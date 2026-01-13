# DATABASE SCHEMA - FIXED VERSION
# Menambahkan field yang diperlukan dari UI Form & Live Board

create extension if not exists "uuid-ossp";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,

  -- role = tipe user (bukan akses data)
  role text check (role in ('admin','production','broadcaster','investor')),

  is_active boolean default true,
  created_at timestamptz default now()
);


create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,

  type text check (type in ('film','series','documentary','variety')),
  status text check (status in ('active','completed','archived')) default 'active',

  -- 🆕 TAMBAHAN FIELD
  genre text, -- Genre bebas (reality show, drama, comedy, dll)
  
  total_budget numeric default 0,
  start_date date,
  target_completion_date date,

  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.user_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,

  -- kontrol akses per project
  access_level text check (access_level in ('view','edit','admin')) not null,
  
  -- 🆕 TAMBAHAN: role dalam tim (untuk tracking "Tim Production C", dll)
  team_role text, -- 'production_a', 'production_b', 'production_c', 'editor', dll

  unique(user_id, project_id)
);

create table public.episodes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,

  episode_number int,
  season int default 1, -- 🆕 TAMBAHAN SEASON
  title text,
  
  description text, -- deskripsi episode

  status text check (
    status in ('pre_production','shooting','pre_editing','editing','delivered')
  ) default 'pre_production',

  -- 🆕 TAMBAHAN PRIORITY
  priority text check (priority in ('urgent','normal','low')) default 'normal',

  -- 🆕 TAMBAHAN BROADCAST INFO
  channel_tv text, -- Channel TV (MBG Network, SCTV, dll)
  air_time time, -- Jam tayang (19:00, 21:00, dll)
  air_date date, -- Tanggal tayang

  -- 🆕 TAMBAHAN EDITOR
  editor_name text, -- Nama editor yang assigned

  target_delivery_date date,
  actual_delivery_date date,

  -- 🆕 TAMBAHAN NOTES/CATATAN
  notes text, -- Catatan per episode

  created_at timestamptz default now(),
  unique(project_id, episode_number, season)
);


create table public.episode_stages (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid references public.episodes(id) on delete cascade,

  stage text check (
    stage in ('shooting','editing','review','delivered','g_drive')
  ) not null,

  -- 🆕 TAMBAHAN: PROGRESS PERCENTAGE PER STAGE
  progress_percentage int default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  
  -- 🆕 TAMBAHAN: STATUS STAGE
  status text check (status in ('not_started','in_progress','completed')) default 'not_started',
  
  -- 🆕 TAMBAHAN: NOTES PER STAGE
  stage_notes text, -- Catatan per tahap (Live shooting audisi babak semifinal, dll)

  started_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz default now(),
  unique(episode_id, stage)
);

create table public.stage_tasks (
  id uuid primary key default uuid_generate_v4(),
  stage_id uuid references public.episode_stages(id) on delete cascade,

  title text not null,
  is_completed boolean default false,
  completed_at timestamptz,

  created_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  episode_id uuid references public.episodes(id),

  description text,
  amount numeric not null,
  
  -- 🆕 TAMBAHAN: TIPE PAYMENT
  payment_type text check (payment_type in ('honor','salary','party_cash','vendor','other')),
  recipient_name text,

  status text check (status in ('unpaid','partial','paid')) default 'unpaid',
  due_date date,
  paid_at timestamptz,

  created_at timestamptz default now()
);


create table public.audit_logs (
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


-- 🆕 VIEW UNTUK LIVE PRODUCTION BOARD
create view live_production_board as
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

  -- Tim Production (ambil dari user_projects)
  string_agg(distinct up.team_role, ', ') as production_team,

  -- Status icon/color
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
  e.priority desc, -- Urgent dulu
  es.stage, 
  e.air_date asc;


-- 🆕 VIEW UNTUK SUMMARY COUNTER (top section di dashboard)
create view production_stage_summary as
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
