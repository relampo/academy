# Admin Bootstrap

Relampo Academy creates new users as `student` by default.

To create the first administrator:

1. Sign up in the application once Sprint 1 authentication is available.
2. Open the Supabase dashboard.
3. Go to SQL Editor.
4. Run:

```sql
select public.bootstrap_admin_by_email(
  'your-email@example.com',
  'Initial academy owner'
);
```

The function:

- Finds the Supabase Auth user by email.
- Promotes the matching profile to `admin`.
- Activates the profile.
- Writes an `admin.bootstrap` audit entry.

The function is intentionally not executable by `anon` or `authenticated`.
It is for project-owner use from Supabase SQL Editor during setup.
