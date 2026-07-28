create policy "enrollments_resubmit_own_rejected"
on public.enrollments for update
to authenticated
using (
  student_id = auth.uid()
  and status in ('rejected', 'withdrawn')
)
with check (
  student_id = auth.uid()
  and status = 'pending'
  and approved_at is null
  and approved_by is null
  and completed_at is null
  and rejection_reason is null
  and exists (
    select 1
    from public.course_editions ce
    where ce.id = course_edition_id
      and ce.status = 'published'
      and ce.enrollment_open = true
  )
);
