drop policy if exists "modules_enrolled_read_published" on public.modules;

create policy "modules_enrolled_read_available_structure"
on public.modules for select
to authenticated
using (
  status <> 'archived'
  and public.is_enrolled_in_course(course_id)
);

drop policy if exists "lessons_enrolled_read_published" on public.lessons;

create policy "lessons_enrolled_read_available_structure"
on public.lessons for select
to authenticated
using (
  status <> 'archived'
  and public.is_enrolled_in_course(course_id)
);
