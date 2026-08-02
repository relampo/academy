create policy "courses_instructor_update_assigned"
on public.courses for update
to authenticated
using (public.can_manage_course(id))
with check (public.can_manage_course(id));

create policy "course_editions_instructor_update_assigned"
on public.course_editions for update
to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));
