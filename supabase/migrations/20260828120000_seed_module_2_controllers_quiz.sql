-- Quiz for "Ejecutando mis Scripts", the fourth lesson of the course. Covers
-- controllers (simple, loop and conditional), telling parameterization from
-- correlation, and the two elements used to debug a script: View Results Tree
-- and the Debug PostProcessor.
--
-- Fills the empty placeholder quiz the content seed created for this lesson.
-- Keyed on lesson and position, so re-running updates the wording in place.
--
-- The lesson title is shared with another lesson in the Relampo module, so the
-- lookup goes through the slug rather than the title.

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
    and l.slug = 'ejecutando-mis-scripts-jmeter'
  limit 1;

  if target_lesson_id is null then
    raise exception 'Lesson "ejecutando-mis-scripts-jmeter" not found';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (target_lesson_id, 'Quiz – Clase 4: Controladores y depuración', true)
  on conflict (lesson_id)
  do update set
    title = excluded.title,
    required = excluded.required
  returning id into target_quiz_id;

  insert into public.quiz_questions (
    quiz_id, position, question_text,
    option_a, option_b, option_c, option_d, correct_option
  )
  values
    (
      target_quiz_id, 1,
      '¿Qué es un Simple Controller?',
      'Un elemento que repite un grupo de peticiones',
      'Un contenedor que agrupa peticiones sin alterar cómo se ejecutan',
      'Un temporizador entre peticiones',
      'Un validador de respuestas',
      'b'
    ),
    (
      target_quiz_id, 2,
      '¿Para qué sirve un Loop Controller?',
      'Para detener la prueba ante un error',
      'Para extraer valores de la respuesta',
      'Para repetir un grupo de peticiones una cantidad definida de veces',
      'Para agrupar peticiones por funcionalidad',
      'c'
    ),
    (
      target_quiz_id, 3,
      '¿Qué hace un If Controller?',
      'Ejecuta su contenido solo si se cumple una condición',
      'Ejecuta su contenido siempre, en orden',
      'Repite su contenido hasta que algo falle',
      'Ordena los samplers alfabéticamente',
      'a'
    ),
    (
      target_quiz_id, 4,
      'Tu aplicación muestra un flujo distinto según el país: los usuarios de Madrid pasan por una pantalla adicional de facturación y los de México no. ¿Qué elemento te permite ejecutar cada flujo según corresponda?',
      'Constant Timer',
      'Simple Controller',
      'If Controller',
      'Cookie Manager',
      'c'
    ),
    (
      target_quiz_id, 5,
      '¿Cuál distingue mejor la parametrización de la correlación?',
      'Ambas son lo mismo con distinto nombre',
      'La parametrización solo aplica en HTTPS',
      'La correlación se hace antes de grabar',
      'En la parametrización tú conoces y entras los datos; en la correlación son datos que no entraste, los genera el servidor',
      'd'
    ),
    (
      target_quiz_id, 6,
      '¿Para qué se usa View Results Tree?',
      'Para generar la carga de la prueba',
      'Para revisar el request y la respuesta de cada petición durante el scripting',
      'Para definir el número de usuarios virtuales',
      'Para configurar el proxy de grabación',
      'b'
    ),
    (
      target_quiz_id, 7,
      '¿Para qué sirve un Debug PostProcessor?',
      'Para pausar la ejecución del script',
      'Para mostrar el valor de las variables durante la ejecución',
      'Para eliminar las peticiones que fallaron',
      'Para cifrar el tráfico de la prueba',
      'b'
    ),
    (
      target_quiz_id, 8,
      'Extrajiste un token con un Regular Expression Extractor pero no sabes si quedó bien capturado. ¿Qué combinación te permite verlo?',
      'Un Constant Timer y Aggregate Report',
      'Un Cookie Manager y un If Controller',
      'Un Debug PostProcessor y View Results Tree',
      'Un CSV Data Set Config',
      'c'
    ),
    (
      target_quiz_id, 9,
      '¿Cuál es la diferencia entre un Simple Controller y un Loop Controller?',
      'El Simple Controller organiza las peticiones; el Loop Controller las repite',
      'Son equivalentes, solo cambia el nombre',
      'El Simple Controller repite y el Loop Controller organiza',
      'Ninguno de los dos afecta al script',
      'a'
    ),
    (
      target_quiz_id, 10,
      'Cargas 50 usuarios y contraseñas desde un archivo para que cada usuario virtual inicie sesión con credenciales distintas. ¿Qué estás haciendo?',
      'Correlación',
      'Una assertion',
      'Un filtrado de grabación',
      'Parametrización',
      'd'
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
