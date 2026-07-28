# Sprint 3

Goal: complete the enrollment decision workflow for staff.

Included:

- First project commit created from the Sprint 0B-2 baseline.
- Dedicated enrollment review route at `/enrollments`.
- Role-aware navigation entry for admins and instructors.
- Enrollment request filtering by status.
- Approve and reject actions backed by Supabase RLS.

Current permissions:

- Admins can review every enrollment.
- Instructors can review enrollments only for assigned course editions.
- Students continue to see and request enrollments from the course catalog.

Next:

- Instructor assignment UI.
- Course detail page polish for student/instructor views.
- Lessons and resources authoring screens.
