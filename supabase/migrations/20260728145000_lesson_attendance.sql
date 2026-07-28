create table public.lesson_attendance (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default false,
  stayed_until_end boolean not null default false,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index lesson_attendance_student_idx on public.lesson_attendance(student_id);
create index lesson_attendance_lesson_idx on public.lesson_attendance(lesson_id);

create trigger set_lesson_attendance_updated_at
before update on public.lesson_attendance
for each row execute function public.set_updated_at();

alter table public.lesson_attendance enable row level security;

create policy "lesson_attendance_staff_manage"
on public.lesson_attendance for all
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

create policy "lesson_attendance_students_read_own"
on public.lesson_attendance for select
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.is_enrolled_in_course(l.course_id)
  )
);

grant select, insert, update, delete on public.lesson_attendance to authenticated;
