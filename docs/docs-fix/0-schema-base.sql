-- ============================================================================
-- DATABASE SCHEMA - BASE TABLES
-- Dreamlight World Media Production Tracking System
-- ============================================================================
-- Purpose: Create all base tables before applying RLS policies
-- Date: January 8, 2026
-- IMPORTANT: RUN THIS FIRST before rls-policies-corrected.sql
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  
  -- Role: production, broadcaster, investor (lowercase)
  role text check (role in ('production','broadcaster','investor')) default 'production',
  
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Index untuk performance
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_email on public.users(email);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  
  type text check (type in ('film','series','documentary','variety','acara')),
  status text check (status in ('active','completed','archived')) default 'active',
  genre text,
  
  total_budget numeric default 0,
  start_date date,
  target_completion_date date,
  
  -- Broadcaster/Client reference
  broadcaster_id uuid references public.users(id),
  
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_broadcaster_id on public.projects(broadcaster_id);
create index if not exists idx_projects_created_by on public.projects(created_by);

-- ============================================================================
-- USER_PROJECTS (ACCESS CONTROL)
-- ============================================================================
create table if not exists public.user_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  
  access_level text check (access_level in ('view','edit','admin')) not null,
  team_role text, -- 'production_a', 'production_b', 'editor', etc
  
  created_at timestamptz default now(),
  unique(user_id, project_id)
);

-- Indexes
create index if not exists idx_user_projects_user_id on public.user_projects(user_id);
create index if not exists idx_user_projects_project_id on public.user_projects(project_id);

-- ============================================================================
-- MILESTONES TABLE (REQUIRED FOR RLS)
-- ============================================================================
create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  
  name text not null,
  description text,
  
  due_date date,
  completed_at timestamptz,
  is_completed boolean default false,
  
  -- Visibility controls (REQUIRED for RLS policies)
  visible_to_client boolean default true,
  visible_to_investor boolean default true,
  
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_milestones_project_id on public.milestones(project_id);
create index if not exists idx_milestones_visible_to_client on public.milestones(visible_to_client);
create index if not exists idx_milestones_visible_to_investor on public.milestones(visible_to_investor);

-- ============================================================================
-- EPISODES TABLE
-- ============================================================================
create table if not exists public.episodes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  
  episode_number int not null,
  season int default 1,
  title text,
  description text,
  
  status text check (
    status in ('pre_production','shooting','pre_editing','editing','delivered')
  ) default 'pre_production',
  
  priority text check (priority in ('urgent','normal','low')) default 'normal',
  
  -- Broadcast info
  channel_tv text,
  air_time time,
  air_date date,
  
  editor_name text,
  
  target_delivery_date date,
  actual_delivery_date date,
  
  notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, episode_number, season)
);

-- Indexes
create index if not exists idx_episodes_project_id on public.episodes(project_id);
create index if not exists idx_episodes_status on public.episodes(status);
create index if not exists idx_episodes_priority on public.episodes(priority);

-- ============================================================================
-- EPISODE_STAGES TABLE
-- ============================================================================
create table if not exists public.episode_stages (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid references public.episodes(id) on delete cascade,
  
  stage text check (
    stage in ('shooting','editing','review','delivered','g_drive')
  ) not null,
  
  progress_percentage int default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  status text check (status in ('not_started','in_progress','completed')) default 'not_started',
  stage_notes text,
  
  started_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz default now(),
  unique(episode_id, stage)
);

-- Indexes
create index if not exists idx_episode_stages_episode_id on public.episode_stages(episode_id);
create index if not exists idx_episode_stages_stage on public.episode_stages(stage);

-- ============================================================================
-- STAGE_TASKS TABLE
-- ============================================================================
create table if not exists public.stage_tasks (
  id uuid primary key default uuid_generate_v4(),
  stage_id uuid references public.episode_stages(id) on delete cascade,
  
  title text not null,
  is_completed boolean default false,
  completed_at timestamptz,
  
  created_at timestamptz default now()
);

-- Index
create index if not exists idx_stage_tasks_stage_id on public.stage_tasks(stage_id);

-- ============================================================================
-- EPISODE_STAGE_SEGMENTS TABLE (editing progress by segment)
-- ============================================================================
create table if not exists public.episode_stage_segments (
  episode_id uuid references public.episodes(id) on delete cascade,
  stage text not null check (stage in ('editing')),
  segment_number int not null check (segment_number between 1 and 3),
  cut_percent int not null default 0 check (cut_percent between 0 and 100),
  audio_percent int not null default 0 check (audio_percent between 0 and 100),
  graphics_percent int not null default 0 check (graphics_percent between 0 and 100),
  master_percent int not null default 0 check (master_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (episode_id, stage, segment_number)
);

create index if not exists idx_episode_stage_segments_episode on public.episode_stage_segments(episode_id);

-- RLS for per-segment editing progress
alter table public.episode_stage_segments enable row level security;

drop policy if exists episode_stage_segments_select on public.episode_stage_segments;
create policy episode_stage_segments_select on public.episode_stage_segments
  for select using (
    exists (
      select 1 from public.user_projects up
      join public.episodes e on e.id = episode_id
      where up.project_id = e.project_id and up.user_id = auth.uid()
    )
  );

drop policy if exists episode_stage_segments_insert on public.episode_stage_segments;
create policy episode_stage_segments_insert on public.episode_stage_segments
  for insert with check (
    exists (
      select 1 from public.user_projects up
      join public.episodes e on e.id = episode_id
      where up.project_id = e.project_id and up.user_id = auth.uid()
    )
  );

drop policy if exists episode_stage_segments_update on public.episode_stage_segments;
create policy episode_stage_segments_update on public.episode_stage_segments
  for update using (
    exists (
      select 1 from public.user_projects up
      join public.episodes e on e.id = episode_id
      where up.project_id = e.project_id and up.user_id = auth.uid()
    )
  );

drop policy if exists episode_stage_segments_delete on public.episode_stage_segments;
create policy episode_stage_segments_delete on public.episode_stage_segments
  for delete using (
    exists (
      select 1 from public.user_projects up
      join public.episodes e on e.id = episode_id
      where up.project_id = e.project_id and up.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TEAM_PAYMENTS TABLE (SENSITIVE - RLS REQUIRED)
-- ============================================================================
create table if not exists public.team_payments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  
  member_name text not null,
  payment_type text check (payment_type in ('honor','salary','petty_cash','vendor','other')),
  amount numeric not null,
  
  description text,
  
  status text check (status in ('pending','paid','overdue')) default 'pending',
  due_date date,
  paid_at timestamptz,
  
  receipt_url text,
  
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_team_payments_project_id on public.team_payments(project_id);
create index if not exists idx_team_payments_status on public.team_payments(status);

-- ============================================================================
-- FINANCIAL_RECORDS TABLE (SENSITIVE)
-- ============================================================================
create table if not exists public.financial_records (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  
  record_type text check (record_type in ('budget','expense','income')),
  
  amount numeric not null,
  description text,
  
  category text, -- Production, Post-Production, Operational, etc
  subcategory text,
  
  recorded_date date default current_date,
  
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_financial_records_project_id on public.financial_records(project_id);
create index if not exists idx_financial_records_type on public.financial_records(record_type);

-- ============================================================================
-- EXPENSES TABLE (SENSITIVE)
-- ============================================================================
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  
  description text not null,
  amount numeric not null,
  
  category text, -- Budget category
  expense_date date default current_date,
  
  receipt_url text,
  
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_expenses_project_id on public.expenses(project_id);
create index if not exists idx_expenses_category on public.expenses(category);

-- ============================================================================
-- INCOME_RECORDS TABLE (SENSITIVE)
-- ============================================================================
create table if not exists public.income_records (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  
  description text not null,
  amount numeric not null,
  
  payment_status text check (payment_status in ('pending','received')) default 'pending',
  expected_date date,
  received_date date,
  
  invoice_number text,
  
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_income_records_project_id on public.income_records(project_id);
create index if not exists idx_income_records_status on public.income_records(payment_status);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  project_id uuid,
  entity_type text,
  entity_id uuid,
  action text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- Index
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Live Production Board View
create or replace view live_production_board as
select
  p.id as project_id,
  p.title as project_title,
  p.genre,
  
  e.id as episode_id,
  e.episode_number,
  e.season,
  e.title as episode_title,
  e.description as episode_description,
  e.priority,
  e.channel_tv,
  e.air_time,
  e.air_date,
  e.editor_name,
  e.notes as episode_notes,
  e.target_delivery_date as deadline,
  
  es.stage as current_stage,
  es.progress_percentage,
  es.status as stage_status,
  es.stage_notes,
  
  string_agg(distinct up.team_role, ', ') as production_team,
  
  case 
    when es.stage = 'shooting' then 'camera'
    when es.stage = 'editing' then 'scissors'
    when es.stage = 'review' then 'check'
    when es.stage = 'delivered' then 'send'
    when es.stage = 'g_drive' then 'cloud'
    else 'clock'
  end as stage_icon
  
from projects p
join episodes e on e.project_id = p.id
left join episode_stages es on es.episode_id = e.id
left join user_projects up on up.project_id = p.id

where p.status = 'active'
  and es.status in ('in_progress', 'not_started')

group by 
  p.id, p.title, p.genre,
  e.id, e.episode_number, e.season, e.title, e.description,
  e.priority, e.channel_tv, e.air_time, e.air_date,
  e.editor_name, e.notes, e.target_delivery_date,
  es.stage, es.progress_percentage, es.status, es.stage_notes

order by 
  e.priority desc,
  es.stage, 
  e.air_date asc;

-- Production Stage Summary View
create or replace view production_stage_summary as
select
  es.stage,
  count(distinct e.id) as project_count,
  round(avg(es.progress_percentage), 0) as avg_progress
from episode_stages es
join episodes e on e.id = es.episode_id
join projects p on p.id = e.project_id
where p.status = 'active'
  and es.status in ('in_progress', 'not_started')
group by es.stage;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ BASE SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '📋 Tables created: users, projects, user_projects, milestones, episodes, episode_stages, stage_tasks, team_payments, financial_records, expenses, income_records, audit_logs';
  RAISE NOTICE '📊 Views created: live_production_board, production_stage_summary';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP: Execute rls-policies-corrected.sql to apply Row Level Security';
END $$;
