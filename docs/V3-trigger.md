create table public.stage_task_templates (
  id uuid primary key default uuid_generate_v4(),
  stage text check (
    stage in ('pre_production','shooting','pre_editing','editing')
  ) not null,

  title text not null,
  order_number int,

  created_at timestamptz default now()
);


create or replace function create_episode_structure()
returns trigger as $$
declare
  stage_record record;
  stage_id uuid;
begin
  -- create stages
  for stage_record in
    select unnest(array['pre_production','shooting','pre_editing','editing']) as stage
  loop
    insert into episode_stages (episode_id, stage)
    values (new.id, stage_record.stage)
    returning id into stage_id;

    -- create tasks from template
    insert into stage_tasks (stage_id, title)
    select stage_id, title
    from stage_task_templates
    where stage = stage_record.stage;
  end loop;

  return new;
end;
$$ language plpgsql;


create trigger after_episode_insert
after insert on episodes
for each row
execute function create_episode_structure();


-- TRIGGER AUDIT_LOGS OTOMATIS
create or replace function audit_trigger()
returns trigger as $$
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
$$ language plpgsql security definer;


-- 2.2 ATTACH TRIGGER KE TABEL KRUSIAL
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


-- VIEW FINANCIAL SUMMARY
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


-- RLS VIEW INVESTOR
alter view investor_financial_summary enable row level security;

create policy "investor finance read"
on investor_financial_summary
for select
using (
  exists (
    select 1 from users
    where id = auth.uid()
      and role in ('investor','admin')
  )
);
