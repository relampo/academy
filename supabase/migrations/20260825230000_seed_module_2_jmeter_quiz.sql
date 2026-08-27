-- Quiz for "Mi Primer Script en JMeter", written from the class 2 manual plus
-- the Java/JMeter installation guide: two questions on installation and eight
-- on recording, filtering, listeners, cookies, timers and assertions.
--
-- Replaces the questions seeded in 20260810140000. Keyed on lesson and
-- position, so re-running updates the wording in place.

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
    raise exception 'Lesson "mi-primer-script-en-jmeter" not found';
  end if;

  insert into public.lesson_quizzes (lesson_id, title, required)
  values (target_lesson_id, 'Quiz – Clase 2: Apache JMeter', true)
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
      'Al descargar JMeter desde la página oficial, ¿qué archivo debes tomar?',
      'El que dice Source',
      'El .zip de la sección Binaries',
      'Cualquiera de los dos, da igual',
      'El .msi del instalador de Java',
      'b'
    ),
    (
      target_quiz_id, 2,
      'Ejecutas java -version para verificar la instalación. ¿Qué debe mostrar la primera línea?',
      'La versión 21',
      'La versión 8',
      'El nombre del usuario del sistema',
      'La ruta donde se instaló JMeter',
      'a'
    ),
    (
      target_quiz_id, 3,
      '¿Qué graba realmente JMeter durante una grabación?',
      'Los clics y movimientos del mouse',
      'Capturas de pantalla del navegador',
      'Las solicitudes de red que producen esos clics',
      'El código fuente de la página',
      'c'
    ),
    (
      target_quiz_id, 4,
      '¿Para qué sirve el certificado ApacheJMeterTemporaryRootCA.crt?',
      'Para cifrar los resultados de la prueba',
      'Para autenticar al usuario en la aplicación',
      'Para firmar el archivo .jmx',
      'Para permitir que JMeter actúe como proxy en tráfico HTTPS',
      'd'
    ),
    (
      target_quiz_id, 5,
      'Si el puerto configurado en Firefox no coincide con el del HTTP(S) Test Script Recorder:',
      'JMeter graba igual, pero más lento',
      'Firefox deja de funcionar por completo',
      'JMeter no verá el tráfico',
      'Se duplican las peticiones grabadas',
      'c'
    ),
    (
      target_quiz_id, 6,
      '¿Cuál es el propósito de los Exclude Patterns?',
      'Definir qué tráfico queda dentro del alcance del script',
      'Borrar todos los recursos estáticos, siempre',
      'Acelerar la ejecución de la prueba',
      'Ocultar los errores de la grabación',
      'a'
    ),
    (
      target_quiz_id, 7,
      '¿Para qué se agrega un HTTP Cookie Manager?',
      'Para aumentar la cantidad de usuarios virtuales',
      'Para que cada usuario virtual mantenga su sesión',
      'Para eliminar las cookies del navegador',
      'Para validar el código de respuesta',
      'b'
    ),
    (
      target_quiz_id, 8,
      '¿Qué diferencia a un Constant Timer de un Uniform Random Timer?',
      'El Constant Timer solo funciona con un usuario',
      'El Uniform Random Timer elimina las pausas',
      'No hay diferencia, son sinónimos',
      'El Constant Timer aplica una pausa fija; el Uniform Random varía dentro de un rango',
      'd'
    ),
    (
      target_quiz_id, 9,
      'View Results Tree y Aggregate Report se diferencian en que:',
      'Ambos hacen exactamente lo mismo',
      'Aggregate Report sirve para depurar cada petición una por una',
      'View Results Tree muestra qué ocurrió en cada petición; Aggregate Report resume el conjunto',
      'View Results Tree solo funciona con HTTPS',
      'c'
    ),
    (
      target_quiz_id, 10,
      '¿Qué Assertion marca como fallida una muestra que supera un tiempo límite?',
      'Response Assertion',
      'Size Assertion',
      'XPath Assertion',
      'Duration Assertion',
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
