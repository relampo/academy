create or replace function public.get_generated_leaderboard_alias(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (
    array[
      'Rayo Norte',
      'Centella Alta',
      'Trueno Claro',
      'Nube Ionica',
      'Chispa Azul',
      'Vortice Solar',
      'Pulso Electrico',
      'Relampago Delta',
      'Frente de Tormenta',
      'Arco Plasma'
    ]
  )[1 + (abs(hashtext(target_user_id::text)) % 10)]
$$;

create or replace function public.get_leaderboard_level(score_ratio numeric)
returns text
language sql
immutable
as $$
  select case
    when score_ratio >= 0.90 then 'Tormenta'
    when score_ratio >= 0.80 then 'Huracan'
    when score_ratio >= 0.75 then 'Centella'
    when score_ratio >= 0.50 then 'Rayo'
    else 'Chispa'
  end
$$;

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
  course_lessons as (
    select l.id
    from public.lessons l
    where l.course_id = target_course_id
      and l.status <> 'archived'
  ),
  approved_students as (
    select distinct e.student_id
    from public.enrollments e
    join public.course_editions ce on ce.id = e.course_edition_id
    join public.profiles p on p.id = e.student_id
    where ce.course_id = target_course_id
      and e.status = 'approved'
      and (
        p.leaderboard_visibility <> 'hidden'
        or e.student_id = auth.uid()
        or public.can_manage_course(target_course_id)
      )
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
  )
  select
    p.id as student_id,
    case
      when p.leaderboard_visibility = 'hidden'
        and p.id <> auth.uid()
        and not public.can_manage_course(target_course_id)
        then 'Hidden student'
      when p.leaderboard_visibility = 'full_name'
        then coalesce(nullif(p.display_name, ''), trim(p.first_name || ' ' || p.last_name))
      when p.leaderboard_visibility = 'first_name'
        then p.first_name
      else coalesce(nullif(p.leaderboard_name, ''), public.get_generated_leaderboard_alias(p.id))
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
  from approved_students s
  join public.profiles p on p.id = s.student_id
  cross join max_scores
  left join attendance_scores on attendance_scores.student_id = s.student_id
  left join quiz_scores on quiz_scores.student_id = s.student_id
  left join assignment_scores on assignment_scores.student_id = s.student_id
  cross join requester_allowed
  where requester_allowed.allowed
  order by total_score desc, display_name asc
$$;

grant execute on function public.get_course_leaderboard(uuid) to authenticated;
grant execute on function public.get_generated_leaderboard_alias(uuid) to authenticated;
