-- The landing page is public, but get_course_leaderboard is gated on being
-- enrolled or managing the course and is only granted to authenticated. To show
-- a podium to visitors, the scoring is lifted into an internal helper that both
-- functions share, rather than copied into a second query that could drift out
-- of agreement with the ranking students actually see.
--
-- compute_course_leaderboard carries no permission check and is granted to
-- nobody: it is reachable only through the two security definer wrappers below,
-- each of which decides what its own caller may see.

create or replace function public.compute_course_leaderboard(target_course_id uuid)
returns table (
  student_id uuid,
  alias text,
  display_name text,
  avatar_url text,
  total_score numeric,
  max_score numeric,
  score_ratio numeric,
  level text
)
language sql
stable
security definer
set search_path = public
as $$
  with alias_pool as (
    select alias, ordinal
    from unnest(public.get_leaderboard_alias_pool()) with ordinality as pool(alias, ordinal)
  ),
  course_lessons as (
    select l.id
    from public.lessons l
    where l.course_id = target_course_id
      and l.status <> 'archived'
  ),
  approved_students as (
    select
      e.student_id,
      min(coalesce(e.approved_at, e.requested_at)) as enrolled_at
    from public.enrollments e
    join public.course_editions ce on ce.id = e.course_edition_id
    where ce.course_id = target_course_id
      and e.status = 'approved'
    group by e.student_id
  ),
  ranked_students as (
    select
      approved_students.*,
      row_number() over (order by enrolled_at asc nulls last, student_id asc) as alias_index
    from approved_students
  ),
  attendance_scores as (
    select
      la.student_id,
      sum(
        case
          when la.attended and la.stayed_until_end then 10
          when la.attended then 5
          else 0
        end
      )::numeric as score
    from public.lesson_attendance la
    join course_lessons l on l.id = la.lesson_id
    group by la.student_id
  ),
  quiz_scores as (
    select qa.student_id, sum(qa.total_score)::numeric as score
    from public.quiz_attempts qa
    join public.lesson_quizzes q on q.id = qa.quiz_id
    join course_lessons l on l.id = q.lesson_id
    group by qa.student_id
  ),
  assignment_scores as (
    select s.student_id, sum(coalesce(s.points_awarded, 0))::numeric as score
    from public.assignment_submissions s
    join public.lesson_assignments a on a.id = s.assignment_id
    join course_lessons l on l.id = a.lesson_id
    group by s.student_id
  ),
  max_scores as (
    select coalesce(
      sum(10 + 20 + coalesce(a.points, 10)),
      0
    )::numeric as max_score
    from course_lessons l
    left join public.lesson_assignments a on a.lesson_id = l.id
  ),
  visible_profiles as (
    select
      p.*,
      rs.alias_index,
      coalesce(nullif(p.display_name, ''), nullif(trim(p.first_name || ' ' || p.last_name), '')) as full_profile_name
    from ranked_students rs
    join public.profiles p on p.id = rs.student_id
  ),
  aliased_profiles as (
    select
      p.*,
      coalesce(
        nullif(p.leaderboard_name, ''),
        alias_pool.alias,
        public.get_generated_leaderboard_alias(p.id)
      ) as resolved_alias
    from visible_profiles p
    left join alias_pool on alias_pool.ordinal = p.alias_index
  )
  select
    p.id as student_id,
    p.resolved_alias as alias,
    case
      when p.leaderboard_visibility = 'full_name'
        and p.full_profile_name is not null
        then p.resolved_alias || ' · ' || p.full_profile_name
      when p.leaderboard_visibility = 'first_name'
        and nullif(p.first_name, '') is not null
        then p.resolved_alias || ' · ' || p.first_name
      else p.resolved_alias
    end as display_name,
    p.avatar_url,
    (
      coalesce(attendance_scores.score, 0)
      + coalesce(quiz_scores.score, 0)
      + coalesce(assignment_scores.score, 0)
    )::numeric as total_score,
    max_scores.max_score,
    case
      when max_scores.max_score > 0 then (
        coalesce(attendance_scores.score, 0)
        + coalesce(quiz_scores.score, 0)
        + coalesce(assignment_scores.score, 0)
      ) / max_scores.max_score
      else 0
    end as score_ratio,
    public.get_leaderboard_level(
      case
        when max_scores.max_score > 0 then (
          coalesce(attendance_scores.score, 0)
          + coalesce(quiz_scores.score, 0)
          + coalesce(assignment_scores.score, 0)
        ) / max_scores.max_score
        else 0
      end
    ) as level
  from aliased_profiles p
  cross join max_scores
  left join attendance_scores on attendance_scores.student_id = p.id
  left join quiz_scores on quiz_scores.student_id = p.id
  left join assignment_scores on assignment_scores.student_id = p.id
$$;

revoke all on function public.compute_course_leaderboard(uuid) from public, anon, authenticated;

-- The signed-in ranking. Same shape and ordering as before; the permission
-- check is unchanged, only the scoring moved.
create or replace function public.get_course_leaderboard(target_course_id uuid)
returns table (
  student_id uuid,
  display_name text,
  avatar_url text,
  total_score numeric,
  max_score numeric,
  score_ratio numeric,
  level text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.student_id,
    c.display_name,
    c.avatar_url,
    c.total_score,
    c.max_score,
    c.score_ratio,
    c.level
  from public.compute_course_leaderboard(target_course_id) c
  where public.can_manage_course(target_course_id)
     or public.is_enrolled_in_course(target_course_id)
  order by c.total_score desc, c.display_name asc, c.student_id asc
$$;

-- The public podium. Deliberately narrow: alias, avatar and points only. It
-- never returns display_name, so a student who chose to show their real name on
-- the ranking is still only an alias to anonymous visitors, and it does not
-- return student_id either.
create or replace function public.get_public_leaderboard_podium()
returns table (
  podium_position int,
  alias text,
  avatar_url text,
  total_score numeric,
  max_score numeric,
  level text
)
language sql
stable
security definer
set search_path = public
as $$
  with target_course as (
    -- The course the community is actually in, so the podium keeps working if
    -- the flagship course is replaced.
    select ce.course_id
    from public.enrollments e
    join public.course_editions ce on ce.id = e.course_edition_id
    where e.status = 'approved'
    group by ce.course_id
    order by count(distinct e.student_id) desc, ce.course_id asc
    limit 1
  )
  select
    row_number() over (
      order by c.total_score desc, c.alias asc, c.student_id asc
    )::int as podium_position,
    c.alias,
    c.avatar_url,
    c.total_score,
    c.max_score,
    c.level
  from target_course
  cross join lateral public.compute_course_leaderboard(target_course.course_id) c
  where c.total_score > 0
  order by podium_position
  limit 3
$$;

grant execute on function public.get_course_leaderboard(uuid) to authenticated;
grant execute on function public.get_public_leaderboard_podium() to anon, authenticated;
