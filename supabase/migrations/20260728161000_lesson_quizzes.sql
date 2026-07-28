create table public.lesson_quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.lesson_quizzes(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('a', 'b', 'c', 'd')),
  position integer not null check (position between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.lesson_quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  total_score numeric not null default 0,
  total_seconds integer not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option text not null check (selected_option in ('a', 'b', 'c', 'd')),
  is_correct boolean not null,
  seconds_spent integer not null default 0,
  points_awarded numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index lesson_quizzes_lesson_idx on public.lesson_quizzes(lesson_id);
create index quiz_questions_quiz_position_idx on public.quiz_questions(quiz_id, position);
create index quiz_attempts_quiz_student_idx on public.quiz_attempts(quiz_id, student_id);
create index quiz_answers_attempt_idx on public.quiz_answers(attempt_id);

create trigger set_lesson_quizzes_updated_at
before update on public.lesson_quizzes
for each row execute function public.set_updated_at();

create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

create trigger set_quiz_attempts_updated_at
before update on public.quiz_attempts
for each row execute function public.set_updated_at();

alter table public.lesson_quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

create policy "lesson_quizzes_staff_manage"
on public.lesson_quizzes for all
to authenticated
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id and public.can_manage_course(l.course_id)
  )
)
with check (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id and public.can_manage_course(l.course_id)
  )
);

create policy "lesson_quizzes_enrolled_read"
on public.lesson_quizzes for select
to authenticated
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and l.status = 'published'
      and public.is_enrolled_in_course(l.course_id)
  )
);

create policy "quiz_questions_staff_manage"
on public.quiz_questions for all
to authenticated
using (
  exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id and public.can_manage_course(l.course_id)
  )
)
with check (
  exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id and public.can_manage_course(l.course_id)
  )
);

create policy "quiz_questions_enrolled_read"
on public.quiz_questions for select
to authenticated
using (
  exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id
      and l.status = 'published'
      and public.is_enrolled_in_course(l.course_id)
  )
);

create policy "quiz_attempts_students_manage_own"
on public.quiz_attempts for all
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id and public.is_enrolled_in_course(l.course_id)
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id and public.is_enrolled_in_course(l.course_id)
  )
);

create policy "quiz_attempts_staff_read"
on public.quiz_attempts for select
to authenticated
using (
  exists (
    select 1
    from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.id = quiz_id and public.can_manage_course(l.course_id)
  )
);

create policy "quiz_answers_students_manage_own"
on public.quiz_answers for all
to authenticated
using (
  exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_id and a.student_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_id and a.student_id = auth.uid()
  )
);

create policy "quiz_answers_staff_read"
on public.quiz_answers for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts a
    join public.lesson_quizzes q on q.id = a.quiz_id
    join public.lessons l on l.id = q.lesson_id
    where a.id = attempt_id and public.can_manage_course(l.course_id)
  )
);

grant select, insert, update, delete on public.lesson_quizzes to authenticated;
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.quiz_answers to authenticated;

insert into public.lesson_quizzes (lesson_id, title, required)
select l.id, 'Quiz - ' || l.title, true
from public.lessons l
where l.status <> 'archived'
on conflict (lesson_id) do nothing;

create or replace function public.ensure_lesson_quiz()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lesson_quizzes (lesson_id, title, required)
  values (new.id, 'Quiz - ' || new.title, true)
  on conflict (lesson_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_lesson_quiz on public.lessons;

create trigger create_lesson_quiz
after insert on public.lessons
for each row execute function public.ensure_lesson_quiz();
