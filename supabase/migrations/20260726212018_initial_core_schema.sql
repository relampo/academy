create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'instructor', 'student');
create type public.user_status as enum ('active', 'suspended', 'pending');
create type public.course_status as enum ('draft', 'published', 'enrollment_closed', 'completed', 'archived');
create type public.enrollment_status as enum ('pending', 'approved', 'rejected', 'withdrawn', 'completed');
create type public.leaderboard_visibility as enum ('full_name', 'first_name', 'alias', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  display_name text,
  leaderboard_name text,
  leaderboard_visibility public.leaderboard_visibility not null default 'alias',
  role public.user_role not null default 'student',
  status public.user_status not null default 'active',
  country text,
  timezone text,
  discord_username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  cover_url text,
  status public.course_status not null default 'draft',
  created_by uuid references public.profiles(id),
  source_course_id uuid references public.courses(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.course_editions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  slug text not null,
  status public.course_status not null default 'draft',
  start_date date,
  end_date date,
  capacity integer check (capacity is null or capacity > 0),
  requires_approval boolean not null default true,
  enrollment_open boolean not null default false,
  discord_url text,
  max_points numeric,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (course_id, slug)
);

create table public.course_instructors (
  course_id uuid not null references public.courses(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (course_id, instructor_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_edition_id uuid not null references public.course_editions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.enrollment_status not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  completed_at timestamptz,
  rejection_reason text,
  unique (course_edition_id, student_id)
);

create index courses_status_idx on public.courses(status);
create index course_editions_course_status_idx on public.course_editions(course_id, status);
create index course_editions_enrollment_idx on public.course_editions(status, enrollment_open);
create index course_instructors_instructor_idx on public.course_instructors(instructor_id);
create index enrollments_student_status_idx on public.enrollments(student_id, status);
create index enrollments_edition_status_idx on public.enrollments(course_edition_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger set_course_editions_updated_at
before update on public.course_editions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_instructor_for_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_instructors ci
    where ci.course_id = target_course_id
      and ci.instructor_id = auth.uid()
  )
$$;

create or replace function public.is_instructor_for_edition(target_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_editions ce
    join public.course_instructors ci on ci.course_id = ce.course_id
    where ce.id = target_edition_id
      and ci.instructor_id = auth.uid()
  )
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_editions enable row level security;
alter table public.course_instructors enable row level security;
alter table public.enrollments enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_basic_fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "courses_public_read_published"
on public.courses for select
to anon, authenticated
using (status in ('published', 'enrollment_closed', 'completed'));

create policy "courses_instructor_read_assigned"
on public.courses for select
to authenticated
using (public.is_instructor_for_course(id));

create policy "courses_admin_all"
on public.courses for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "course_editions_public_read_published"
on public.course_editions for select
to anon, authenticated
using (status in ('published', 'enrollment_closed', 'completed'));

create policy "course_editions_instructor_read_assigned"
on public.course_editions for select
to authenticated
using (public.is_instructor_for_course(course_id));

create policy "course_editions_admin_all"
on public.course_editions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "course_instructors_select_assigned_or_admin"
on public.course_instructors for select
to authenticated
using (instructor_id = auth.uid() or public.is_admin());

create policy "course_instructors_admin_all"
on public.course_instructors for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "enrollments_select_own_or_staff"
on public.enrollments for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
  or public.is_instructor_for_edition(course_edition_id)
);

create policy "enrollments_insert_own_pending"
on public.enrollments for insert
to authenticated
with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.course_editions ce
    where ce.id = course_edition_id
      and ce.status = 'published'
      and ce.enrollment_open = true
  )
);

create policy "enrollments_update_staff"
on public.enrollments for update
to authenticated
using (public.is_admin() or public.is_instructor_for_edition(course_edition_id))
with check (public.is_admin() or public.is_instructor_for_edition(course_edition_id));

grant usage on schema public to anon, authenticated;
grant select on public.courses, public.course_editions to anon;
grant select, insert, update on public.profiles, public.courses, public.course_editions, public.course_instructors, public.enrollments to authenticated;
