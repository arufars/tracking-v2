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

  unique(user_id, project_id)
);

create table public.episodes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,

  episode_number int,
  title text,

  status text check (
    status in ('pre_production','shooting','pre_editing','editing','delivered')
  ) default 'pre_production',

  target_delivery_date date,
  actual_delivery_date date,

  created_at timestamptz default now(),
  unique(project_id, episode_number)
);


create table public.episode_stages (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid references public.episodes(id) on delete cascade,

  stage text check (
    stage in ('pre_production','shooting','pre_editing','editing')
  ) not null,

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
