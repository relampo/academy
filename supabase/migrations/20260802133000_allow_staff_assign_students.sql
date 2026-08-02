create policy "enrollments_insert_staff_approved"
on public.enrollments for insert
to authenticated
with check (
  status = 'approved'
  and (
    public.is_admin()
    or public.is_instructor_for_edition(course_edition_id)
  )
);
