# Sprint 2

Goal: make courses, editions and enrollment requests real enough to operate.

Included:

- Typed course service layer.
- Admin course creation.
- Admin course edition creation.
- Course inventory with edition summaries.
- Student course catalog backed by Supabase.
- Student enrollment request flow.

Current permissions:

- Admins can create courses and editions through existing RLS.
- Students can request enrollment only for published editions with enrollment open.
- Instructors/admins can review enrollments in later screens.

Next sprint:

- Instructor assignment UI.
- Enrollment approval/rejection UI.
- Course detail page.
- Lessons and resources schema.
