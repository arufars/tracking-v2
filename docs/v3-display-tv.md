create view episode_live_progress as
select
  p.id as project_id,
  p.title as project_title,

  e.id as episode_id,
  e.episode_number,
  e.title as episode_title,

  es.stage,

  round(
    count(st.id) filter (where st.is_completed)::numeric
    /
    nullif(count(st.id), 0) * 100
  , 0) as progress_percentage

from projects p
join episodes e on e.project_id = p.id
join episode_stages es on es.episode_id = e.id
left join stage_tasks st on st.stage_id = es.id

group by
  p.id, p.title,
  e.id, e.episode_number, e.title,
  es.stage;
