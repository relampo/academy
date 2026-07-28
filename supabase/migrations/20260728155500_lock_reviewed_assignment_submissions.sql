drop policy if exists "assignment_submissions_students_manage_own"
on public.assignment_submissions;

create policy "assignment_submissions_students_select_own"
on public.assignment_submissions for select
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
);

create policy "assignment_submissions_students_insert_own"
on public.assignment_submissions for insert
to authenticated
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

create policy "assignment_submissions_students_update_unreviewed"
on public.assignment_submissions for update
to authenticated
using (
  student_id = auth.uid()
  and status = 'submitted'
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
  and status = 'submitted'
  and exists (
    select 1
    from public.lesson_assignments la
    join public.lessons l on l.id = la.lesson_id
    where la.id = assignment_id
      and public.is_enrolled_in_course(l.course_id)
  )
);
