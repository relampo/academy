-- Aliases were positional, not owned. get_course_leaderboard derived them from
--   row_number() over (order by enrolled_at, student_id)
-- so the alias was a student's *place in the enrollment queue*, never a
-- property of the student. Any change to the approved set renumbered everyone
-- behind it: withdrawing one student out of eight reassigned the alias of five
-- others, and students who identify each other by alias saw the board rename
-- them overnight.
--
-- This makes the alias a possession. It is assigned once, persisted on the
-- profile, and from then on only the student changes it.
--
--   1. assign_leaderboard_alias() hands out a random unused alias and stores it
--   2. a trigger calls it the moment an enrollment becomes approved
--   3. a backfill pins the alias every current student is showing right now, so
--      this migration itself renames as few people as possible

create or replace function public.assign_leaderboard_alias(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alias text;
begin
  select nullif(p.leaderboard_name, '') into v_alias
  from public.profiles p
  where p.id = target_user_id;

  -- Already owns one: never reassign, that is the whole point.
  if v_alias is not null then
    return v_alias;
  end if;

  select pool.alias into v_alias
  from unnest(public.get_leaderboard_alias_pool()) with ordinality as pool(alias, ordinal)
  where not exists (
    select 1
    from public.profiles taken
    where lower(taken.leaderboard_name) = lower(pool.alias)
  )
  order by random()
  limit 1;

  -- Pool exhausted. Suffix a random entry rather than leaving the student
  -- without an identity; the leaderboard must still be able to name them.
  if v_alias is null then
    select pool.alias || ' ' || (1 + floor(random() * 9000))::int::text into v_alias
    from unnest(public.get_leaderboard_alias_pool()) with ordinality as pool(alias, ordinal)
    order by random()
    limit 1;
  end if;

  update public.profiles
  set leaderboard_name = v_alias
  where id = target_user_id
    and nullif(leaderboard_name, '') is null;

  return v_alias;
end;
$$;

create or replace function public.ensure_leaderboard_alias()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' then
    perform public.assign_leaderboard_alias(new.student_id);
  end if;

  return new;
end;
$$;

drop trigger if exists enrollments_assign_leaderboard_alias on public.enrollments;

create trigger enrollments_assign_leaderboard_alias
after insert or update of status on public.enrollments
for each row
execute function public.ensure_leaderboard_alias();

-- Backfill. Pin the alias each student is showing today, taken from the course
-- they joined first, so the board reads the same after this migration as before
-- it. Students whose positional alias collides with someone else's are left
-- null here and pick up a fresh unused one in the pass below.
with approved as (
  select
    e.student_id,
    ce.course_id,
    min(coalesce(e.approved_at, e.requested_at)) as enrolled_at
  from public.enrollments e
  join public.course_editions ce on ce.id = e.course_edition_id
  where e.status = 'approved'
  group by e.student_id, ce.course_id
),
numbered as (
  select
    student_id,
    course_id,
    enrolled_at,
    row_number() over (
      partition by course_id
      order by enrolled_at asc nulls last, student_id asc
    ) as alias_index
  from approved
),
first_course as (
  select distinct on (student_id)
    student_id,
    alias_index
  from numbered
  order by student_id, enrolled_at asc nulls last, course_id asc
),
pool as (
  select alias, ordinal
  from unnest(public.get_leaderboard_alias_pool()) with ordinality as t(alias, ordinal)
),
candidate as (
  select fc.student_id, pool.alias
  from first_course fc
  join pool on pool.ordinal = fc.alias_index
  join public.profiles p on p.id = fc.student_id
  where nullif(p.leaderboard_name, '') is null
),
deduped as (
  -- One student per alias: whoever sorts first keeps it.
  select distinct on (lower(alias)) student_id, alias
  from candidate
  where not exists (
    select 1
    from public.profiles taken
    where lower(taken.leaderboard_name) = lower(candidate.alias)
  )
  order by lower(alias), student_id
)
update public.profiles p
set leaderboard_name = d.alias
from deduped d
where p.id = d.student_id;

-- Anyone approved but still without an alias (collision above, or enrolled past
-- the end of the pool) gets a fresh unused one.
do $$
declare
  r record;
begin
  for r in
    select distinct e.student_id
    from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.status = 'approved'
      and nullif(p.leaderboard_name, '') is null
  loop
    perform public.assign_leaderboard_alias(r.student_id);
  end loop;
end
$$;

grant execute on function public.assign_leaderboard_alias(uuid) to authenticated;
