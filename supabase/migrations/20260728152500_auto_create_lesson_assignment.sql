create or replace function public.ensure_lesson_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lesson_assignments (
    lesson_id,
    title,
    description,
    assignment_type,
    points,
    required
  )
  values (
    new.id,
    'Tarea - ' || new.title,
    'Envía la evidencia requerida para esta clase.',
    'report',
    10,
    true
  )
  on conflict (lesson_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_lesson_assignment on public.lessons;

create trigger create_lesson_assignment
after insert on public.lessons
for each row execute function public.ensure_lesson_assignment();
