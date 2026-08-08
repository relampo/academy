-- The alias pool migration (20260806160500) started deriving every leaderboard
-- name from the student's enrollment position and stopped reading
-- profiles.leaderboard_name entirely. That broke the intended behaviour: the
-- system assigns a random-looking unique alias, and the student may then change
-- it. It also made the profile card (which still reads leaderboard_name)
-- disagree with the row rendered in the ranking.
--
-- This restores the chosen alias as the source of truth while keeping the
-- enrollment-ordered pool as the auto-assigned default:
--   1. profiles.leaderboard_name, when set
--   2. the pool alias for the student's enrollment position
--   3. the hash-based alias, so students past the end of the pool still appear
--
-- The join on the pool also becomes a LEFT join. It used to be an inner join,
-- which silently dropped every student whose enrollment position exceeded the
-- pool size from the leaderboard.

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
  with requester_allowed as (
    select public.can_manage_course(target_course_id)
      or public.is_enrolled_in_course(target_course_id) as allowed
  ),
  alias_pool as (
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
  ),
  scored_profiles as (
    select
      p.id as student_id,
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
      end as score_ratio
    from aliased_profiles p
    cross join max_scores
    left join attendance_scores on attendance_scores.student_id = p.id
    left join quiz_scores on quiz_scores.student_id = p.id
    left join assignment_scores on assignment_scores.student_id = p.id
    cross join requester_allowed
    where requester_allowed.allowed
  )
  select
    student_id,
    display_name,
    avatar_url,
    total_score,
    max_score,
    score_ratio,
    public.get_leaderboard_level(score_ratio) as level
  from scored_profiles
  order by total_score desc, display_name asc, student_id asc
$$;

grant execute on function public.get_course_leaderboard(uuid) to authenticated;
