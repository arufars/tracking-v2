# TRIGGERS & AUTOMATION - FIXED VERSION

-- 🗑️ HAPUS TRIGGERS & FUNCTIONS LAMA (jika ada)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists after_episode_insert on episodes;
drop trigger if exists after_task_update on stage_tasks;
drop trigger if exists after_stage_update on episode_stages;
drop trigger if exists audit_projects on projects;
drop trigger if exists audit_episodes on episodes;
drop trigger if exists audit_stage_tasks on stage_tasks;
drop trigger if exists audit_payments on payments;

drop function if exists handle_new_user();
drop function if exists create_episode_structure();
drop function if exists update_stage_progress();
drop function if exists update_episode_status();
drop function if exists audit_trigger();

drop view if exists investor_financial_summary;

-- Template untuk tasks di setiap stage
create table if not exists public.stage_task_templates (
id uuid primary key default uuid_generate_v4(),
stage text check (
stage in ('shooting','editing','review','delivered','g_drive')
) not null,

title text not null,
order_number int,

created_at timestamptz default now()
);

-- 🆕 Trigger: Auto-create user profile saat register
create or replace function handle_new_user()
returns trigger as $$
begin
insert into public.users (id, email, full_name, role, avatar_url)
values (
new.id,
new.email,
coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
coalesce(new.raw_user_meta_data->>'role', 'production'), -- default role
new.raw_user_meta_data->>'avatar_url'
);
return new;
end;

$$
language plpgsql security definer;

-- Attach trigger ke auth.users (managed by Supabase)
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();


-- 🆕 Trigger: Auto-create stages saat episode dibuat
create or replace function create_episode_structure()
returns trigger as
$$

declare
stage_record record;
stage_id uuid;
begin
-- create stages dengan urutan
for stage_record in
select unnest(array['shooting','editing','review','delivered','g_drive']) as stage
loop
insert into episode_stages (episode_id, stage, status)
values (new.id, stage_record.stage, 'not_started')
returning id into stage_id;

    -- create tasks from template
    insert into stage_tasks (stage_id, title)
    select stage_id, title
    from stage_task_templates
    where stage = stage_record.stage
    order by order_number;

end loop;

return new;
end;

$$
language plpgsql;

create trigger after_episode_insert
after insert on episodes
for each row
execute function create_episode_structure();


-- 🆕 Trigger: Auto-update progress_percentage saat task di-complete
create or replace function update_stage_progress()
returns trigger as
$$

declare
total_tasks int;
completed_tasks int;
new_percentage int;
begin
-- Hitung total tasks dan completed tasks di stage ini
select
count(_),
count(_) filter (where is_completed = true)
into total_tasks, completed_tasks
from stage_tasks
where stage_id = new.stage_id;

-- Hitung percentage
if total_tasks > 0 then
new_percentage := round((completed_tasks::numeric / total_tasks) \* 100);
else
new_percentage := 0;
end if;

-- Update progress_percentage di episode_stages
update episode_stages
set
progress_percentage = new_percentage,
status = case
when new_percentage = 0 then 'not_started'
when new_percentage = 100 then 'completed'
else 'in_progress'
end,
completed_at = case
when new_percentage = 100 then now()
else null
end
where id = new.stage_id;

return new;
end;

$$
language plpgsql;

create trigger after_task_update
after insert or update or delete on stage_tasks
for each row
execute function update_stage_progress();


-- 🆕 Trigger: Auto-update episode status berdasarkan current active stage
create or replace function update_episode_status()
returns trigger as
$$

declare
current_active_stage text;
begin
-- Cari stage yang sedang in_progress atau not_started (urutan pertama)
select stage into current_active_stage
from episode_stages
where episode_id = new.episode_id
and status in ('in_progress', 'not_started')
order by
case stage
when 'shooting' then 1
when 'editing' then 2
when 'review' then 3
when 'delivered' then 4
when 'g_drive' then 5
end
limit 1;

-- Update episode status sesuai stage aktif
update episodes
set status = coalesce(current_active_stage, 'delivered')
where id = new.episode_id;

return new;
end;

$$
language plpgsql;

create trigger after_stage_update
after update on episode_stages
for each row
execute function update_episode_status();


-- TRIGGER AUDIT_LOGS OTOMATIS
create or replace function audit_trigger()
returns trigger as
$$

begin
insert into audit_logs (
user_id,
project_id,
entity_type,
entity_id,
action,
old_value,
new_value
)
values (
auth.uid(),
coalesce(new.project_id, old.project_id),
tg_table_name,
coalesce(new.id, old.id),
tg_op,
to_jsonb(old),
to_jsonb(new)
);

return new;
end;

$$
language plpgsql security definer;


-- ATTACH TRIGGER KE TABEL KRUSIAL
create trigger audit_projects
after insert or update or delete on projects
for each row execute function audit_trigger();

create trigger audit_episodes
after insert or update or delete on episodes
for each row execute function audit_trigger();

create trigger audit_stage_tasks
after update on stage_tasks
for each row execute function audit_trigger();

create trigger audit_payments
after insert or update on payments
for each row execute function audit_trigger();


-- VIEW FINANCIAL SUMMARY (untuk Investor)
create view investor_financial_summary as
select
  p.id as project_id,
  p.title as project_title,

  p.total_budget,

  coalesce(sum(pay.amount), 0) as total_planned_payment,

  coalesce(
    sum(pay.amount) filter (where pay.status = 'paid'),
    0
  ) as total_paid,

  round(
    coalesce(
      sum(pay.amount) filter (where pay.status = 'paid'),
      0
    )
    /
    nullif(p.total_budget, 0) * 100
  , 0) as paid_percentage

from projects p
left join payments pay on pay.project_id = p.id

group by p.id, p.title, p.total_budget;


-- 🗑️ HAPUS SAMPLE DATA LAMA (jika ada)
delete from stage_task_templates;

-- 🆕 Insert sample task templates
insert into stage_task_templates (stage, title, order_number) values
  ('shooting', 'Setup kamera dan lighting', 1),
  ('shooting', 'Brief talent dan crew', 2),
  ('shooting', 'Recording audisi/scene', 3),
  ('shooting', 'Review footage', 4),

  ('editing', 'Import footage ke software', 1),
  ('editing', 'Rough cut', 2),
  ('editing', 'Fine cut + color grading', 3),
  ('editing', 'Audio mixing', 4),
  ('editing', 'Export final', 5),

  ('review', 'Review internal tim', 1),
  ('review', 'Revisi berdasarkan feedback', 2),
  ('review', 'Approval final', 3),

  ('delivered', 'Upload ke platform broadcaster', 1),
  ('delivered', 'Konfirmasi diterima', 2),

  ('g_drive', 'Upload ke Google Drive', 1),
  ('g_drive', 'Share link ke stakeholder', 2);
$$
