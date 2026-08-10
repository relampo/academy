-- Quiz for the first lesson of Module 2 (JMeter): "Mi Primer Script en JMeter".
--
-- Idempotent, like the Module 1 quiz seed: the quiz is keyed on its lesson and
-- each question on its position, so re-running this updates the wording in
-- place rather than duplicating the quiz.

do $$
declare
  target_lesson_id uuid;
  target_quiz_id uuid;
begin
  select l.id
  into target_lesson_id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = 'Grupo de Estudio: Performance Testing LATAM'
    and l.slug = 'mi-primer-script-en-jmeter'
  limit 1;

  if target_lesson_id is null then
    raise exception 'Lesson "mi-primer-script-en-jmeter" not found for the Module 2 JMeter quiz';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (
    target_lesson_id,
    'Quiz – Clase 2: JMeter básico',
    true
  )
  on conflict (lesson_id)
  do update set
    title = excluded.title,
    required = excluded.required
  returning id into target_quiz_id;

  insert into public.quiz_questions (
    quiz_id,
    position,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option
  )
  values
    (
      target_quiz_id,
      1,
      '¿Qué componente de JMeter se utiliza para capturar el tráfico generado desde el navegador?',
      'View Results Tree',
      'HTTP(S) Test Script Recorder',
      'Simple Controller',
      'Response Assertion',
      'b'
    ),
    (
      target_quiz_id,
      2,
      '¿Para qué se utiliza un Prefix durante la grabación del script?',
      'Para identificar las peticiones grabadas',
      'Para aumentar la cantidad de usuarios',
      'Para medir el tiempo de respuesta',
      'Para validar errores',
      'a'
    ),
    (
      target_quiz_id,
      3,
      'Después de grabar varias peticiones, ¿qué componente puedes utilizar para organizarlas por flujo o funcionalidad?',
      'Timer',
      'Listener',
      'Simple Controller',
      'Assertion',
      'c'
    ),
    (
      target_quiz_id,
      4,
      '¿Cuál es la función principal de un Timer en JMeter?',
      'Eliminar peticiones',
      'Introducir tiempos de espera entre las peticiones',
      'Validar las respuestas',
      'Grabar el tráfico',
      'b'
    ),
    (
      target_quiz_id,
      5,
      '¿Para qué se utiliza una Assertion?',
      'Para comprobar que una respuesta cumple con una condición esperada',
      'Para organizar las peticiones',
      'Para generar usuarios virtuales',
      'Para grabar el navegador',
      'a'
    ),
    (
      target_quiz_id,
      6,
      'Quieres comprobar que una página contiene el texto esperado. ¿Qué elemento puedes utilizar?',
      'Constant Timer',
      'Simple Controller',
      'Response Assertion',
      'Listener',
      'c'
    ),
    (
      target_quiz_id,
      7,
      '¿Qué permite la opción Retrieve All Embedded Resources?',
      'Descargar recursos asociados a la página, como imágenes, CSS y JavaScript',
      'Eliminar automáticamente recursos duplicados',
      'Crear usuarios virtuales',
      'Agregar Assertions',
      'a'
    ),
    (
      target_quiz_id,
      8,
      '¿Cuál de los siguientes elementos es un Listener?',
      'Response Assertion',
      'View Results Tree',
      'Simple Controller',
      'Constant Timer',
      'b'
    ),
    (
      target_quiz_id,
      9,
      'Durante la creación del script quieres revisar las peticiones y respuestas para identificar posibles errores. ¿Qué elemento utilizarías?',
      'View Results Tree',
      'Simple Controller',
      'Timer',
      'HTTP(S) Test Script Recorder',
      'a'
    ),
    (
      target_quiz_id,
      10,
      'Una vez finalizado el ejercicio, ¿qué archivo debes subir a la carpeta compartida de Google Drive?',
      '.jpg',
      '.txt',
      '.jmx',
      '.html',
      'c'
    )
  on conflict (quiz_id, position)
  do update set
    question_text = excluded.question_text,
    option_a = excluded.option_a,
    option_b = excluded.option_b,
    option_c = excluded.option_c,
    option_d = excluded.option_d,
    correct_option = excluded.correct_option,
    updated_at = now();
end
$$;
