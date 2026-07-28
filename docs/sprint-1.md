# Sprint 1

Goal: make authentication and role-based access real.

Included:

- Supabase email/password signup.
- Supabase email/password login.
- Session persistence.
- Profile loading from `profiles`.
- Role-aware navigation.
- Protected app shell.
- Unauthorized state for restricted workspaces.
- Logout.

Roles:

- `student`: dashboard, courses, profile.
- `instructor`: student and assignment workspaces.
- `admin`: course, user and settings administration.

First admin:

After creating the first user account, promote it from Supabase SQL Editor:

```sql
select public.bootstrap_admin_by_email(
  'your-email@example.com',
  'Initial academy owner'
);
```

Next sprint:

- Admin course management.
- Course editions.
- Instructor assignment.
- Enrollment workflow.
