do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'courses',
    'course_editions',
    'course_instructors',
    'enrollments',
    'modules',
    'lessons',
    'resources',
    'lesson_attendance',
    'lesson_progress',
    'lesson_assignments',
    'assignment_submissions',
    'lesson_quizzes',
    'quiz_questions',
    'quiz_attempts',
    'quiz_answers',
    'leaderboard_profiles'
  ];
begin
  foreach table_name in array realtime_tables loop
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    exception
      when duplicate_object then
        null;
      when undefined_table then
        null;
    end;
  end loop;
end $$;
