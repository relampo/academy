-- Tareas de las cuatro primeras clases.
--
-- El trigger create_lesson_assignment ya crea una fila por clase, pero con el
-- texto genérico "Envía la evidencia requerida para esta clase.". Esto le da a
-- cada una de las cuatro primeras clases un enunciado real, para que el
-- estudiante sepa qué entregar. También cubre el caso de que la fila no exista
-- (clases creadas antes del trigger, o filas perdidas), insertándola.
--
-- Idempotente: va por lesson_id, así que reejecutarla actualiza el texto en
-- lugar de duplicar nada. La clase 1 conserva el enunciado de investigación que
-- ya tenía definido en 20260802171000.

do $$
declare
  target_course_id uuid;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'Grupo de Estudio: Performance Testing LATAM'
  limit 1;

  if target_course_id is null then
    raise exception 'Course "Grupo de Estudio: Performance Testing LATAM" not found';
  end if;

  insert into public.lesson_assignments (
    lesson_id, title, description, assignment_type, points, required
  )
  select
    l.id,
    payload.title,
    payload.description,
    'report',
    10,
    true
  from (
    values
      (
        'mi-primer-script-en-jmeter',
        'Tarea - Mi Primer Script en JMeter',
        'Instala Java y Apache JMeter, y graba tu primer script. Elige una aplicación de práctica, graba un flujo completo (por ejemplo: entrar, iniciar sesión y realizar una acción), limpia la grabación con Exclude Patterns, agrega un HTTP Cookie Manager, un Timer y una Assertion, y reprodúcelo con un usuario para comprobar que funciona. Entrega: el archivo .jmx y capturas del View Results Tree mostrando las peticiones en verde. Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo para que el instructor pueda revisarlo.'
      ),
      (
        'correlacion-y-parametrizacion-en-jmeter',
        'Tarea - Correlación y Parametrización en JMeter',
        'Toma el script de la clase anterior y hazlo reutilizable. 1) Identifica los valores dinámicos: graba el mismo flujo dos veces con usuarios distintos y compara ambas grabaciones para ver qué cambia. 2) Correlaciona al menos un valor dinámico con un Regular Expression Extractor y envíalo en la petición siguiente mediante una variable. 3) Parametriza las credenciales con un CSV Data Set Config de al menos 3 usuarios. 4) Ejecuta con 3 hilos y comprueba que cada uno entra con un usuario distinto. Entrega: el .jmx, el archivo CSV y capturas donde se vea el valor extraído y el uso de la variable. Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo.'
      ),
      (
        'ejecutando-mis-scripts-jmeter',
        'Tarea - Ejecutando mis Scripts',
        'Organiza y depura tu script con controladores. 1) Agrupa las peticiones por funcionalidad usando Simple Controllers. 2) Repite una de esas partes con un Loop Controller. 3) Agrega un If Controller que ejecute un flujo distinto según una condición del negocio (por ejemplo, un usuario de Madrid y otro de México). 4) Usa un Debug PostProcessor junto con View Results Tree para mostrar el valor de tus variables durante la ejecución. Ejecuta la prueba y redacta un resumen corto con lo que observaste en el Aggregate Report. Entrega: el .jmx, las capturas de la depuración y tu resumen. Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo.'
      )
  ) as payload(slug, title, description)
  join public.lessons l
    on l.course_id = target_course_id
   and l.slug = payload.slug
  on conflict (lesson_id)
  do update set
    title = excluded.title,
    description = excluded.description,
    assignment_type = excluded.assignment_type,
    points = excluded.points,
    required = excluded.required,
    updated_at = now();

  -- Clase 1: su enunciado ya se definió en 20260802171000, así que aquí solo se
  -- repone. Se escribe si la fila no existe, o si quedó con el texto genérico
  -- que pone el trigger (por ejemplo tras recrear la clase). Un enunciado
  -- editado a mano por el instructor no se toca.
  insert into public.lesson_assignments (
    lesson_id, title, description, assignment_type, points, required
  )
  select
    l.id,
    'Tarea - Fundamentos de Performance Testing',
    'Investiga 5 aplicaciones o plataformas que hayan tenido problemas de performance durante su lanzamiento o durante un evento de alto tráfico. Para cada caso, redacta: qué ocurrió, cuáles fueron los principales impactos para usuarios y negocio, qué aprendizajes deja para performance testing, y agrega las referencias consultadas. Sube tu documento o evidencia a tu carpeta compartida de Google Drive y pega aquí el enlace directo para que el instructor pueda revisarlo.',
    'report',
    10,
    true
  from public.lessons l
  where l.course_id = target_course_id
    and l.slug = 'fundamentos-de-performance-testing'
  on conflict (lesson_id)
  do update set
    title = excluded.title,
    description = excluded.description,
    updated_at = now()
  where
    public.lesson_assignments.description is null
    or btrim(public.lesson_assignments.description) = ''
    or public.lesson_assignments.description
       = 'Envía la evidencia requerida para esta clase.';
end
$$;
