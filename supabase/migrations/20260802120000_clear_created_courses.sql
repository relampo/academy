-- Remove all created course information.
-- Deleting courses cascades to editions, enrollments, instructors, modules,
-- lessons, resources, attendance, progress, assignments, quizzes, and answers.
update public.courses
set source_course_id = null
where source_course_id is not null;

delete from public.courses;
