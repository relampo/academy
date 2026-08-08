-- The stable-alias migration (20260808150000) never overwrites an alias a
-- student already holds, which is what keeps a chosen name safe. The side
-- effect is that it also preserved collisions created before aliases were
-- unique: back then the client only checked the aliases loaded for the current
-- course, so two students in different courses could hold the same name.
--
-- This resolves the existing collisions and makes new ones impossible:
--   1. On each duplicated alias the oldest profile keeps it; the others are
--      cleared and handed a fresh unused alias.
--   2. A unique index stops any future write from duplicating one.

-- 1. Clear the losing side of every collision.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(leaderboard_name)
      order by created_at asc nulls last, id asc
    ) as position_in_collision
  from public.profiles
  where nullif(leaderboard_name, '') is not null
),
losers as (
  select id from ranked where position_in_collision > 1
)
update public.profiles p
set leaderboard_name = null
from losers l
where p.id = l.id;

-- 2. Hand each of them a new one. Covers every cleared profile, not only the
--    enrolled ones, so nobody is left without an identity.
do $$
declare
  r record;
begin
  for r in
    select p.id
    from public.profiles p
    where p.role = 'student'
      and nullif(p.leaderboard_name, '') is null
      and exists (
        select 1
        from public.enrollments e
        where e.student_id = p.id
          and e.status = 'approved'
      )
  loop
    perform public.assign_leaderboard_alias(r.id);
  end loop;
end
$$;

-- 3. Make duplicates unrepresentable from here on. Case-insensitive, and
--    partial so the many students without an alias yet do not collide on null.
create unique index if not exists profiles_leaderboard_name_unique
  on public.profiles (lower(leaderboard_name))
  where nullif(leaderboard_name, '') is not null;
