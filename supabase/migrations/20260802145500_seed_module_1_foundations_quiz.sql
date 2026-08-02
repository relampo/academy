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
    and l.title = 'Fundamentos de Performance Testing'
  limit 1;

  if target_lesson_id is null then
    raise exception 'Lesson not found for Module 1 foundations quiz';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (
    target_lesson_id,
    'Quiz - Módulo 1: Fundamentos del Performance Testing',
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
      '¿Cuál es el objetivo principal del Performance Testing?',
      'Encontrar errores funcionales.',
      'Evaluar cómo responde un sistema bajo diferentes niveles de carga.',
      'Validar el diseño de la interfaz.',
      'Revisar requisitos de negocio.',
      'b'
    ),
    (
      target_quiz_id,
      2,
      '¿Qué métrica indica cuánto tarda una aplicación en responder a una solicitud?',
      'Throughput',
      'Response Time',
      'Error Rate',
      'Concurrent Users',
      'b'
    ),
    (
      target_quiz_id,
      3,
      '¿Qué representa el Throughput?',
      'El número de usuarios conectados.',
      'El porcentaje de errores.',
      'La cantidad de trabajo que procesa el sistema en un período de tiempo.',
      'El consumo de CPU.',
      'c'
    ),
    (
      target_quiz_id,
      4,
      '¿Qué tipo de prueba busca verificar si el sistema soporta la carga esperada?',
      'Load Testing',
      'Stress Testing',
      'Spike Testing',
      'Endurance Testing',
      'a'
    ),
    (
      target_quiz_id,
      5,
      '¿Qué tipo de prueba incrementa la carga por encima de los límites esperados para observar el comportamiento del sistema?',
      'Load Testing',
      'Stress Testing',
      'Spike Testing',
      'Endurance Testing',
      'b'
    ),
    (
      target_quiz_id,
      6,
      '¿Qué caracteriza a un Spike Test?',
      'Mantener una carga constante durante varias horas.',
      'Incrementar la carga de forma gradual.',
      'Aumentos y disminuciones repentinas de la carga.',
      'Ejecutar pruebas únicamente en producción.',
      'c'
    ),
    (
      target_quiz_id,
      7,
      '¿Cuál es el objetivo principal de un Endurance Test?',
      'Encontrar el límite máximo del sistema.',
      'Generar un pico de usuarios.',
      'Mantener la carga esperada durante un período prolongado para detectar degradación o fugas de recursos.',
      'Reducir el consumo de CPU.',
      'c'
    ),
    (
      target_quiz_id,
      8,
      '¿Cuál es la función principal de una herramienta de scripting?',
      'Monitorear CPU y memoria.',
      'Analizar trazas distribuidas.',
      'Construir los escenarios de prueba que ejecutarán los usuarios virtuales.',
      'Generar reportes de rendimiento.',
      'c'
    ),
    (
      target_quiz_id,
      9,
      '¿Cuál de las siguientes herramientas utilizaremos durante este curso para scripting y generación de carga?',
      'Selenium',
      'Cypress',
      'Appium',
      'JMeter',
      'd'
    ),
    (
      target_quiz_id,
      10,
      '¿En qué dos categorías de herramientas se enfoca este curso?',
      'Monitoreo y Observabilidad.',
      'Seguridad y Automatización.',
      'Scripting y Generación de Carga.',
      'DevOps y CI/CD.',
      'c'
    )
  on conflict (quiz_id, position)
  do update set
    question_text = excluded.question_text,
    option_a = excluded.option_a,
    option_b = excluded.option_b,
    option_c = excluded.option_c,
    option_d = excluded.option_d,
    correct_option = excluded.correct_option;
end $$;
