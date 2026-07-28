with ranked_offerings as (
  select
    ce.id,
    ce.course_id,
    row_number() over (
      partition by ce.course_id
      order by
        exists (
          select 1
          from public.enrollments e
          where e.course_edition_id = ce.id
        ) desc,
        ce.enrollment_open desc,
        ce.created_at desc
    ) as offering_rank
  from public.course_editions ce
  where ce.archived_at is null
)
update public.course_editions ce
set
  status = 'archived',
  enrollment_open = false,
  archived_at = now()
from ranked_offerings ro
where ce.id = ro.id
  and ro.offering_rank > 1;
