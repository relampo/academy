-- Quiz for "Correlación y Parametrización en JMeter", the third lesson of the
-- course. Covers correlation, parameterization, the regular expression
-- extractor, reusing a dynamic value across requests, and comparing two
-- recordings of the same flow to spot the values that change.
--
-- Fills the empty placeholder quiz the content seed created for this lesson.
-- Keyed on lesson and position, so re-running updates the wording in place.

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
    and l.slug = 'correlacion-y-parametrizacion-en-jmeter'
  limit 1;

  if target_lesson_id is null then
    raise exception 'Lesson "correlacion-y-parametrizacion-en-jmeter" not found';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (target_lesson_id, 'Quiz – Clase 3: Correlación y Parametrización', true)
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
      '¿Qué es la correlación en un script de performance?',
      'Repetir el mismo request varias veces',
      'Extraer un valor que genera el servidor y reutilizarlo en peticiones siguientes',
      'Aumentar la cantidad de usuarios virtuales',
      'Agrupar peticiones en controladores',
      'b'
    ),
    (
      target_quiz_id, 2,
      'Un script grabado funciona durante la grabación, pero al reproducirlo falla justo después del login. ¿Cuál es la causa más probable?',
      'Faltan Timers entre las peticiones',
      'El Thread Group tiene un solo usuario',
      'Hay valores dinámicos grabados como fijos que necesitan correlación',
      'El Listener consume demasiada memoria',
      'c'
    ),
    (
      target_quiz_id, 3,
      '¿Qué es la parametrización?',
      'Sustituir datos fijos del script por datos variables, como distintos usuarios',
      'Extraer un token de la respuesta del servidor',
      'Validar que el código de respuesta sea 200',
      'Reducir la cantidad de peticiones grabadas',
      'a'
    ),
    (
      target_quiz_id, 4,
      '¿Cuál es la diferencia entre correlación y parametrización?',
      'Son lo mismo con distinto nombre',
      'La parametrización solo aplica a HTTPS',
      'La correlación se hace después de ejecutar la prueba',
      'La correlación toma valores que devuelve el servidor; la parametrización aporta datos propios de la prueba',
      'd'
    ),
    (
      target_quiz_id, 5,
      '¿Qué hace un Regular Expression Extractor?',
      'Elimina peticiones innecesarias del script',
      'Reemplaza al Cookie Manager',
      'Captura un fragmento de la respuesta y lo guarda en una variable',
      'Mide el tiempo de respuesta de cada sampler',
      'c'
    ),
    (
      target_quiz_id, 6,
      'En un Regular Expression Extractor, ¿qué indican los paréntesis dentro de la expresión?',
      'El grupo de captura: la parte que se quiere extraer',
      'Un comentario dentro de la expresión',
      'El número de coincidencias que se deben ignorar',
      'La ruta del archivo de resultados',
      'a'
    ),
    (
      target_quiz_id, 7,
      'El servidor devuelve un token en la respuesta del login y el siguiente request debe enviarlo. ¿Qué debes hacer?',
      'Escribir el token fijo en el request, tal como quedó grabado',
      'Agregar un Constant Timer antes de ese request',
      'Extraerlo de la respuesta y enviarlo mediante una variable',
      'Desactivar el Cookie Manager',
      'c'
    ),
    (
      target_quiz_id, 8,
      '¿Para qué sirve comparar dos grabaciones del mismo flujo hechas con usuarios distintos?',
      'Para medir cuál de los dos usuarios es más rápido',
      'Para duplicar la carga de la prueba',
      'Para comprobar que el proxy está bien configurado',
      'Para identificar qué valores cambian entre ejecuciones y por lo tanto necesitan correlación',
      'd'
    ),
    (
      target_quiz_id, 9,
      '¿Para qué se utiliza un CSV Data Set Config?',
      'Para guardar los resultados de la prueba en un archivo',
      'Para alimentar el script con datos distintos desde un archivo, por ejemplo usuarios y contraseñas',
      'Para exportar el script a otro formato',
      'Para configurar el proxy de grabación',
      'b'
    ),
    (
      target_quiz_id, 10,
      '¿Cómo se referencia en el script una variable llamada token?',
      '$token$',
      '#{token}',
      '%token%',
      '${token}',
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
