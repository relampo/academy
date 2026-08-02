grant delete on public.profiles to authenticated;

create policy "profiles_instructors_select_students"
on public.profiles for select
to authenticated
using (public.current_user_role() = 'instructor' and role = 'student');

create policy "profiles_staff_delete_students"
on public.profiles for delete
to authenticated
using (public.current_user_role() in ('admin', 'instructor') and role = 'student');
