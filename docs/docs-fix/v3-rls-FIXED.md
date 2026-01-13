# ROW LEVEL SECURITY - FIXED VERSION

-- �️ HAPUS SEMUA POLICIES LAMA (cleanup)
drop policy if exists "users read all" on users;
drop policy if exists "users update own" on users;
drop policy if exists "users insert admin" on users;

drop policy if exists "user_projects read own" on user_projects;
drop policy if exists "user_projects insert admin" on user_projects;
drop policy if exists "user_projects update admin" on user_projects;
drop policy if exists "user_projects delete admin" on user_projects;

drop policy if exists "audit_logs read admin" on audit_logs;

drop policy if exists "templates read all" on stage_task_templates;
drop policy if exists "templates insert admin" on stage_task_templates;
drop policy if exists "templates update admin" on stage_task_templates;
drop policy if exists "templates delete admin" on stage_task_templates;

drop policy if exists "project read" on projects;
drop policy if exists "project write" on projects;
drop policy if exists "project insert" on projects;

drop policy if exists "episode read" on episodes;
drop policy if exists "episode edit" on episodes;
drop policy if exists "episode insert" on episodes;

drop policy if exists "stage read" on episode_stages;
drop policy if exists "stage edit" on episode_stages;

drop policy if exists "task read" on stage_tasks;
drop policy if exists "task edit" on stage_tasks;

drop policy if exists "payment read internal" on payments;
drop policy if exists "payment edit admin" on payments;
drop policy if exists "payment insert admin" on payments;


-- �🔐 HELPER FUNCTIONS

--  🔑 Cek akses project
create or replace function has_project_access(pid uuid)
returns boolean as $$
  select exists (
    select 1 from user_projects
    where user_id = auth.uid()
      and project_id = pid
  );
$$ language sql security definer;


-- Cek akses edit
create or replace function has_edit_access(pid uuid)
returns boolean as $$
  select exists (
    select 1 from user_projects
    where user_id = auth.uid()
      and project_id = pid
      and access_level in ('edit','admin')
  );
$$ language sql security definer;


-- 🆕 Cek role user
create or replace function has_role(role_name text)
returns boolean as $$
  select exists (
    select 1 from users
    where id = auth.uid()
      and role = role_name
  );
$$ language sql security definer;


-- Cek apakah request memakai service_role key
create or replace function is_service_role()
returns boolean as $$
  select current_setting('request.jwt.claim.role', true) = 'service_role';
$$ language sql security definer;


-- 🔐 RLS — USERS
alter table users enable row level security;

-- User bisa baca semua users (untuk dropdown, assignment, dll)
drop policy if exists "users read all" on users;
create policy "users read all"
on users
for select
using (auth.uid() is not null);

-- User hanya bisa update profile sendiri
drop policy if exists "users update own" on users;
create policy "users update own"
on users
for update
using (id = auth.uid());

-- Hanya admin yang bisa insert user baru
drop policy if exists "users insert admin" on users;
create policy "users insert admin"
on users
for insert
with check (has_role('admin'));


-- 🔐 RLS — USER_PROJECTS
alter table user_projects enable row level security;

-- User bisa baca project assignments mereka sendiri
drop policy if exists "user_projects read own" on user_projects;
create policy "user_projects read own"
on user_projects
for select
using (user_id = auth.uid() or has_role('admin'));

-- Hanya admin & production yang bisa assign user ke project
drop policy if exists "user_projects insert admin" on user_projects;
create policy "user_projects insert admin"
on user_projects
for insert
with check (
  has_role('admin')
  or has_role('production')
  or is_service_role()
);

-- Hanya admin yang bisa update atau delete assignments
drop policy if exists "user_projects update admin" on user_projects;
create policy "user_projects update admin"
on user_projects
for update
using (has_role('admin'));

drop policy if exists "user_projects delete admin" on user_projects;
create policy "user_projects delete admin"
on user_projects
for delete
using (has_role('admin'));


drop policy if exists "audit_logs read admin" on audit_logs;
-- 🔐 RLS — AUDIT_LOGS
alter table audit_logs enable row level security;

-- Hanya admin yang bisa baca audit logs
create policy "audit_logs read admin"
on audit_logs
for select
using (has_role('admin'));

-- Audit logs tidak bisa diedit atau dihapus manual
-- (hanya via trigger)


-- 🔐 RLS — STAGE_TASK_TEMPLATES
alter table stage_task_templates enable row level security;

drop policy if exists "templates read all" on stage_task_templates;
create policy "templates read all"
on stage_task_templates
for select
using (auth.uid() is not null);

-- Hanya admin yang bisa edit templates
drop policy if exists "templates insert admin" on stage_task_templates;
create policy "templates insert admin"
on stage_task_templates
for insert
with check (has_role('admin'));

drop policy if exists "templates update admin" on stage_task_templates;
create policy "templates update admin"
on stage_task_templates
for update
using (has_role('admin'));

drop policy if exists "templates delete admin" on stage_task_templates;using (has_role('admin'));

create policy "templates delete admin"
on stage_task_templates
for delete
using (has_role('admin'));


-- 🔐 RLS — PROJECTS
alter table projects enable row level security;

drop policy if exists "project read" on projects;
create policy "project read"
on projects
for select
using (has_project_access(id));

drop policy if exists "project write" on projects;
create policy "project write"
on projects
for update
using (has_edit_access(id));

drop policy if exists "project insert" on projects;
create policy "project insert"
on projects
for insert
with check (
  has_role('admin')
  or has_role('production')
  or is_service_role()
);

drop policy if exists "episode read" on episodes;
create policy "episode read"
on episodes
for select
using (has_project_access(project_id));

drop policy if exists "episode edit" on episodes;
create policy "episode edit"
on episodes
for update
using (has_edit_access(project_id));

drop policy if exists "episode insert" on episodes;create policy "episode edit"
on episodes
for update
using (has_edit_access(project_id));

create policy "episode insert"
on episodes
drop policy if exists "stage read" on episode_stages;
create policy "stage read"
on episode_stages
for select
using (
  exists (
    select 1 from episodes e
    where e.id = episode_id
      and has_project_access(e.project_id)
  )
);

drop policy if exists "stage edit" on episode_stages;using (
  exists (
    select 1 from episodes e
    where e.id = episode_id
      and has_project_access(e.project_id)
  )
);

create policy "stage edit"
on episode_stages
for update
using (
  exists (
    select 1 from episodes e
    where e.id = episode_id
      and has_edit_access(e.project_id)
  )
);
drop policy if exists "task read" on stage_tasks;
create policy "task read"
on stage_tasks
for select
using (
  exists (
    select 1 from episode_stages es
    join episodes e on e.id = es.episode_id
    where es.id = stage_id
      and has_project_access(e.project_id)
  )
);

drop policy if exists "task edit" on stage_tasks;    join episodes e on e.id = es.episode_id
    where es.id = stage_id
      and has_project_access(e.project_id)
  )
);

create policy "task edit"
on stage_tasks
for update
using (
  exists (
    select 1 from episode_stages es
    join episodes e on e.id = es.episode_id
    where es.id = stage_id
      and has_edit_access(e.project_id)
  )
);


drop policy if exists "payment read internal" on payments;
create policy "payment read internal"
on payments
for select
using (
  has_project_access(project_id)
  and (has_role('admin') or has_role('production'))
);

-- hanya admin yang bisa edit payment
drop policy if exists "payment edit admin" on payments;
create policy "payment edit admin"
on payments
for update
using (has_role('admin'));

drop policy if exists "payment insert admin" on payments;
create policy "payment insert admin"
on payments
for insert
with check (has_role('admin'));


-- ℹ️ NOTE: VIEWS DO NOT NEED POLICIES
-- Views automatically inherit RLS from their underlying tables.
-- Access control is handled by the table-level policies above.
-- 
-- Views yang sudah dilindungi RLS:
-- - live_production_board → menggunakan RLS dari projects, episodes, episode_stages
-- - production_stage_summary → menggunakan RLS dari episode_stages, episodes, projects
-- - investor_financial_summary → menggunakan RLS dari projects, payments