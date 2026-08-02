grant delete on public.profiles to authenticated;

create policy "profiles_admin_delete_students"
on public.profiles for delete
to authenticated
using (public.is_admin() and role = 'student');
