-- Quiz for the first lesson of Module 1, "Fundamentos de Performance Testing",
-- written from the student manual: why the discipline exists, the five metrics,
-- the four test types, client-server, protocols and the anatomy of HTTP.
--
-- Replaces the questions seeded in 20260802145500. The quiz is keyed on its
-- lesson and each question on its position, so re-running updates the wording
-- in place rather than duplicating anything.

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
    and l.slug = 'fundamentos-de-performance-testing'
  limit 1;

  if target_lesson_id is null then
    raise exception 'Lesson "fundamentos-de-performance-testing" not found';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (
    target_lesson_id,
    'Quiz – Clase 1: Fundamentos del Performance Testing',
    true
  )
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
      '¿Cuál es el objetivo principal del Performance Testing?',
      'Encontrar errores funcionales en la aplicación',
      'Conocer los límites del sistema antes de que los descubran los usuarios',
      'Mejorar el diseño visual de la interfaz',
      'Reducir la cantidad de código',
      'b'
    ),
    (
      target_quiz_id, 2,
      '¿Qué mide el Response Time?',
      'Cuántas solicitudes procesa el sistema por segundo',
      'Cuántos usuarios hay conectados a la vez',
      'Cuánto tarda la aplicación en responder una solicitud',
      'El porcentaje de solicitudes que fallan',
      'c'
    ),
    (
      target_quiz_id, 3,
      'El throughput mide principalmente:',
      'Capacidad: cuánto trabajo procesa el sistema en un período',
      'Velocidad: qué tan rápido responde cada solicitud',
      'La cantidad de usuarios registrados',
      'El tiempo que tarda en recuperarse tras un pico',
      'a'
    ),
    (
      target_quiz_id, 4,
      '¿Qué son los usuarios concurrentes?',
      'Todos los usuarios registrados en la aplicación',
      'Los usuarios que reportaron errores',
      'Los usuarios que completaron una compra',
      'Los que usan el sistema al mismo tiempo, en un instante dado',
      'd'
    ),
    (
      target_quiz_id, 5,
      'De 100 usuarios, 95 reciben respuesta en 1 segundo y 5 esperan 8 segundos. ¿Por qué no basta con mirar el promedio?',
      'Porque oculta la mala experiencia de una parte de los usuarios',
      'Porque el promedio siempre es incorrecto',
      'Porque el promedio solo sirve con pocos usuarios',
      'Porque no se puede calcular en pruebas de carga',
      'a'
    ),
    (
      target_quiz_id, 6,
      '¿Qué pregunta responde una prueba de Load Testing?',
      '¿Cuál es el punto de ruptura del sistema?',
      '¿Qué ocurre si la carga cambia de forma repentina?',
      '¿El sistema soporta la carga esperada?',
      '¿El rendimiento se degrada tras muchas horas?',
      'c'
    ),
    (
      target_quiz_id, 7,
      'Termina un concierto y en segundos miles de personas intentan comprar boletos. ¿Qué tipo de prueba simula esa situación?',
      'Endurance Testing',
      'Spike Testing',
      'Load Testing',
      'Volume Testing',
      'b'
    ),
    (
      target_quiz_id, 8,
      'En la arquitectura cliente-servidor, ¿quién inicia siempre la comunicación?',
      'El cliente',
      'El servidor',
      'La base de datos',
      'El protocolo',
      'a'
    ),
    (
      target_quiz_id, 9,
      'Que HTTP sea «sin estado» (stateless) significa que:',
      'No puede transportar archivos',
      'Solo funciona con HTTPS',
      'Cada solicitud es independiente y no recuerda la anterior',
      'No permite enviar headers',
      'c'
    ),
    (
      target_quiz_id, 10,
      'Un servidor devuelve el código 500. ¿Qué indica?',
      'El recurso solicitado no existe',
      'La solicitud fue procesada correctamente',
      'El usuario no está autenticado',
      'Ocurrió un error en el servidor',
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
