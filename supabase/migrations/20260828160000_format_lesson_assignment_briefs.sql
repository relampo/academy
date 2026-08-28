-- Da formato a los enunciados de las cuatro primeras clases.
--
-- El texto se guarda plano y se pinta en un solo párrafo, así que los pasos
-- "1) 2) 3)" quedaban pegados dentro de un bloque corrido. Aquí se reescriben
-- con saltos de línea; el CSS del reproductor los respeta (white-space:
-- pre-line), de modo que cada paso cae en su propia línea.
--
-- Solo cambia el formato: el contenido de la tarea es el mismo. Va por
-- lesson_id, así que reejecutarla no duplica nada.

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

  update public.lesson_assignments a
  set description = payload.description,
      updated_at = now()
  from (
    values
      (
        'mi-primer-script-en-jmeter',
        E'Instala Java y Apache JMeter, y graba tu primer script.\n\n' ||
        E'1) Graba un flujo completo en una aplicación de práctica: entrar, iniciar sesión y realizar una acción.\n' ||
        E'2) Limpia la grabación con Exclude Patterns.\n' ||
        E'3) Agrega un HTTP Cookie Manager, un Timer y una Assertion.\n' ||
        E'4) Reprodúcelo con un usuario y comprueba que funciona.\n\n' ||
        E'Entrega: el archivo .jmx y capturas del View Results Tree mostrando las peticiones en verde.\n\n' ||
        E'Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo para que el instructor pueda revisarlo.'
      ),
      (
        'correlacion-y-parametrizacion-en-jmeter',
        E'Toma el script de la clase anterior y hazlo reutilizable.\n\n' ||
        E'1) Identifica los valores dinámicos: graba el mismo flujo dos veces con usuarios distintos y compara ambas grabaciones para ver qué cambia.\n' ||
        E'2) Correlaciona al menos un valor dinámico con un Regular Expression Extractor y envíalo en la petición siguiente mediante una variable.\n' ||
        E'3) Parametriza las credenciales con un CSV Data Set Config de al menos 3 usuarios.\n' ||
        E'4) Ejecuta con 3 hilos y comprueba que cada uno entra con un usuario distinto.\n\n' ||
        E'Entrega: el .jmx, el archivo CSV y capturas donde se vea el valor extraído y el uso de la variable.\n\n' ||
        E'Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo.'
      ),
      (
        'ejecutando-mis-scripts-jmeter',
        E'Organiza y depura tu script con controladores.\n\n' ||
        E'1) Agrupa las peticiones por funcionalidad usando Simple Controllers.\n' ||
        E'2) Repite una de esas partes con un Loop Controller.\n' ||
        E'3) Agrega un If Controller que ejecute un flujo distinto según una condición del negocio (por ejemplo, un usuario de Madrid y otro de México).\n' ||
        E'4) Usa un Debug PostProcessor junto con View Results Tree para mostrar el valor de tus variables durante la ejecución.\n' ||
        E'5) Ejecuta la prueba y redacta un resumen corto con lo que observaste en el Aggregate Report.\n\n' ||
        E'Entrega: el .jmx, las capturas de la depuración y tu resumen.\n\n' ||
        E'Sube todo a tu carpeta compartida de Google Drive y pega aquí el enlace directo.'
      )
  ) as payload(slug, description)
  where a.lesson_id in (
    select l.id
    from public.lessons l
    where l.course_id = target_course_id
      and l.slug = payload.slug
  );

  -- La clase 1 se reformatea solo si conserva el texto corrido que se le puso
  -- en agosto. Si el instructor lo editó, se respeta lo que haya escrito.
  update public.lesson_assignments a
  set description =
        E'Investiga 5 aplicaciones o plataformas que hayan tenido problemas de performance durante su lanzamiento o durante un evento de alto tráfico.\n\n' ||
        E'Para cada caso, redacta:\n' ||
        E'- Qué ocurrió.\n' ||
        E'- Cuáles fueron los principales impactos para usuarios y negocio.\n' ||
        E'- Qué aprendizajes deja para performance testing.\n' ||
        E'- Las referencias consultadas.\n\n' ||
        E'Sube tu documento o evidencia a tu carpeta compartida de Google Drive y pega aquí el enlace directo para que el instructor pueda revisarlo.',
      updated_at = now()
  where a.lesson_id in (
    select l.id
    from public.lessons l
    where l.course_id = target_course_id
      and l.slug = 'fundamentos-de-performance-testing'
  )
  and a.description like 'Investiga 5 aplicaciones%'
  and a.description not like '%Para cada caso, redacta:' || chr(10) || '%';
end
$$;
