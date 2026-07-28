create type public.lesson_status as enum ('draft', 'published', 'hidden', 'archived');

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null,
  status public.lesson_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  objectives text,
  content text,
  video_url text,
  scheduled_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  position integer not null,
  status public.lesson_status not null default 'draft',
  attendance_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  description text,
  resource_type text not null,
  external_url text not null,
  is_downloadable boolean not null default true,
  unlock_at timestamptz,
  requires_enrollment boolean not null default true,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index modules_course_position_idx on public.modules(course_id, position);
create index lessons_course_position_idx on public.lessons(course_id, position);
create index lessons_module_position_idx on public.lessons(module_id, position);
create index resources_lesson_position_idx on public.resources(lesson_id, position);

create trigger set_modules_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create or replace function public.is_enrolled_in_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.course_editions ce on ce.id = e.course_edition_id
    where ce.course_id = target_course_id
      and e.student_id = auth.uid()
      and e.status = 'approved'
  )
$$;

create or replace function public.can_manage_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_instructor_for_course(target_course_id)
$$;

alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.resources enable row level security;

create policy "modules_staff_manage"
on public.modules for all
to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

create policy "modules_enrolled_read_published"
on public.modules for select
to authenticated
using (
  status = 'published'
  and public.is_enrolled_in_course(course_id)
);

create policy "lessons_staff_manage"
on public.lessons for all
to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

create policy "lessons_enrolled_read_published"
on public.lessons for select
to authenticated
using (
  status = 'published'
  and public.is_enrolled_in_course(course_id)
);

create policy "resources_staff_manage"
on public.resources for all
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.can_manage_course(l.course_id)
  )
)
with check (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.can_manage_course(l.course_id)
  )
);

create policy "resources_enrolled_read_published_lesson"
on public.resources for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and l.status = 'published'
      and public.is_enrolled_in_course(l.course_id)
      and (unlock_at is null or unlock_at <= now())
  )
);

grant select, insert, update on public.modules, public.lessons, public.resources to authenticated;
