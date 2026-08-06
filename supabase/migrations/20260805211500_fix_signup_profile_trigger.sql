alter table public.profiles
add column if not exists email text;

create index if not exists profiles_email_idx
on public.profiles (lower(email))
where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    email,
    country,
    role
  )
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
