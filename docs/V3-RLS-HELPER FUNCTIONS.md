
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


-- RLS — PROJECTS
alter table projects enable row level security;

create policy "project read"
on projects
for select
using (has_project_access(id));

create policy "project write"
on projects
for update
using (has_edit_access(id));

-- RLS — EPISODES
alter table episodes enable row level security;

create policy "episode read"
on episodes
for select
using (has_project_access(project_id));

create policy "episode edit"
on episodes
for update
using (has_edit_access(project_id));

-- RLS — TASKS & STAGES
alter table episode_stages enable row level security;
alter table stage_tasks enable row level security;

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


-- RLS — PAYMENTS (SANGAT PENTING)
alter table payments enable row level security;

-- hanya production & admin
create policy "payment read internal"
on payments
for select
using (
  has_project_access(project_id)
  and exists (
    select 1 from users
    where id = auth.uid()
      and role in ('admin','production')
  )
);

-- RLS — VIEW TV
alter view episode_live_progress enable row level security;

create policy "tv display read"
on episode_live_progress
for select
using (true);

