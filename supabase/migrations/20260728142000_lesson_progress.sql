create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index lesson_progress_student_idx on public.lesson_progress(student_id);
create index lesson_progress_lesson_idx on public.lesson_progress(lesson_id);

create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

create policy "lesson_progress_students_manage_own"
on public.lesson_progress for all
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.is_enrolled_in_course(l.course_id)
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.is_enrolled_in_course(l.course_id)
  )
);

create policy "lesson_progress_staff_read"
on public.lesson_progress for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.can_manage_course(l.course_id)
  )
);

grant select, insert, update, delete on public.lesson_progress to authenticated;
