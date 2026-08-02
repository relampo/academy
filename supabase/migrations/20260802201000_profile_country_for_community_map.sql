create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, display_name, email, country, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'country', ''),
    'student'
  )
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    country = coalesce(public.profiles.country, excluded.country);

  return new;
end;
$$;

create or replace function public.get_student_country_counts()
returns table(country text, student_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select profiles.country, count(*)::bigint as student_count
  from public.profiles
  where profiles.role = 'student'
    and profiles.status = 'active'
    and profiles.country is not null
    and length(trim(profiles.country)) > 0
  group by profiles.country
  order by student_count desc, profiles.country asc;
$$;

grant execute on function public.get_student_country_counts() to authenticated;
