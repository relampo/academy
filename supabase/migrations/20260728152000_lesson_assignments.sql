create table public.lesson_assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  description text,
  assignment_type text not null default 'report',
  points numeric not null default 10,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id)
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.lesson_assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submission_url text,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'needs_revision')),
  points_awarded numeric,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create index lesson_assignments_lesson_idx on public.lesson_assignments(lesson_id);
create index assignment_submissions_assignment_idx on public.assignment_submissions(assignment_id);
create index assignment_submissions_student_idx on public.assignment_submissions(student_id);

create trigger set_lesson_assignments_updated_at
before update on public.lesson_assignments
for each row execute function public.set_updated_at();

create trigger set_assignment_submissions_updated_at
before update on public.assignment_submissions
for each row execute function public.set_updated_at();

alter table public.lesson_assignments enable row level security;
alter table public.assignment_submissions enable row level security;

create policy "lesson_assignments_staff_manage"
on public.lesson_assignments for all
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

create policy "lesson_assignments_enrolled_read"
on public.lesson_assignments for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and l.status = 'published'
      and public.is_enrolled_in_course(l.course_id)
  )
);

create policy "assignment_submissions_staff_manage"
on public.assignment_submissions for all
to authenticated
using (
  exists (
    select 1
    from public.lesson_assignments la
    join public.lessons l on l.id = la.lesson_id
    where la.id = assignment_id
      and public.can_manage_course(l.course_id)
  )
)
with check (
  exists (
    select 1
    from public.lesson_assignments la
    join public.lessons l on l.id = la.lesson_id
    where la.id = assignment_id
      and public.can_manage_course(l.course_id)
  )
);

create policy "assignment_submissions_students_manage_own"
on public.assignment_submissions for all
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lesson_assignments la
    join public.lessons l on l.id = la.lesson_id
    where la.id = assignment_id
      and public.is_enrolled_in_course(l.course_id)
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lesson_assignments la
    join public.lessons l on l.id = la.lesson_id
    where la.id = assignment_id
      and public.is_enrolled_in_course(l.course_id)
  )
);

grant select, insert, update, delete on public.lesson_assignments to authenticated;
grant select, insert, update, delete on public.assignment_submissions to authenticated;

insert into public.lesson_assignments (
  lesson_id,
  title,
  description,
  assignment_type,
  points,
  required
)
select
  l.id,
  'Assignment - ' || l.title,
  'Submit the required evidence for this class.',
  case
    when l.title ilike '%script%'
      or l.title ilike '%jmeter%'
      or l.title ilike '%relampo%'
      or l.title ilike '%k6%'
      or l.title ilike '%gatling%'
      or l.title ilike '%proyecto final%'
      then 'script'
    else 'report'
  end,
  10,
  true
from public.lessons l
where l.status <> 'archived'
on conflict (lesson_id) do nothing;
