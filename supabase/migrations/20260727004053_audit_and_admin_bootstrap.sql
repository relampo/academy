create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log(entity_type, entity_id);
create index audit_log_actor_idx on public.audit_log(actor_id);
create index audit_log_created_at_idx on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log_admin_read"
on public.audit_log for select
to authenticated
using (public.is_admin());

create policy "audit_log_admin_insert"
on public.audit_log for insert
to authenticated
with check (public.is_admin());

create or replace function public.write_audit_log(
  action text,
  entity_type text,
  entity_id uuid default null,
  before_data jsonb default null,
  after_data jsonb default null,
  reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  )
  values (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

revoke all on function public.write_audit_log(text, text, uuid, jsonb, jsonb, text) from public;
grant execute on function public.write_audit_log(text, text, uuid, jsonb, jsonb, text) to service_role;

create or replace function public.audit_profile_sensitive_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role or old.status is distinct from new.status then
    insert into public.audit_log (
      actor_id,
      action,
      entity_type,
      entity_id,
      before_data,
      after_data,
      reason
    )
    values (
      auth.uid(),
      'profile.sensitive_update',
      'profile',
      new.id,
      jsonb_build_object('role', old.role, 'status', old.status),
      jsonb_build_object('role', new.role, 'status', new.status),
      null
    );
  end if;

  return new;
end;
$$;

create trigger audit_profile_sensitive_changes
after update of role, status on public.profiles
for each row execute function public.audit_profile_sensitive_changes();

create or replace function public.bootstrap_admin_by_email(target_email text, reason text default 'Initial admin bootstrap')
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
  previous_profile jsonb;
  updated_profile jsonb;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'No auth user found for email %', target_email;
  end if;

  select to_jsonb(p) into previous_profile
  from public.profiles p
  where p.id = target_user_id;

  if previous_profile is null then
    insert into public.profiles (id, first_name, last_name, display_name, role, status)
    values (target_user_id, '', '', target_email, 'admin', 'active');
  else
    update public.profiles
    set role = 'admin',
        status = 'active'
    where id = target_user_id;
  end if;

  select to_jsonb(p) into updated_profile
  from public.profiles p
  where p.id = target_user_id;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  )
  values (
    target_user_id,
    'admin.bootstrap',
    'profile',
    target_user_id,
    previous_profile,
    updated_profile,
    reason
  );

  return target_user_id;
end;
$$;

revoke all on function public.bootstrap_admin_by_email(text, text) from public;
revoke all on function public.bootstrap_admin_by_email(text, text) from anon;
revoke all on function public.bootstrap_admin_by_email(text, text) from authenticated;

grant select on public.audit_log to authenticated;
