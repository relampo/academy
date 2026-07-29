do $$
declare
  target_course_id uuid;
  target_edition_id uuid;
  module_id uuid;
  lesson_id uuid;
  syllabus_url text := 'https://drive.google.com/file/d/1N3AI5LRinQ0obStWvDDnpr9sNU40YUXT/view';
begin
  select id
  into target_course_id
  from public.courses
  where title = 'Pruebas de Performance 11 Copy'
  order by created_at desc
  limit 1;

  if target_course_id is null then
    raise notice 'Course "Pruebas de Performance 11 Copy" was not found. Skipping seed.';
    return;
  end if;

  update public.courses
  set
    title = 'Pruebas de Performance 11 Copy',
    short_description = 'Grupo de estudio de Performance Testing Foundations: de cero a un proyecto de portafolio.',
    description = 'Programa de 13 clases semanales que lleva a los estudiantes desde los fundamentos del performance testing hasta la ejecución de pruebas reales con JMeter, Relampo, k6, Gatling y plataformas cloud. El proyecto final es un Performance Test Results Report listo para portafolio.',
    status = 'published'
  where id = target_course_id;

  select id
  into target_edition_id
  from public.course_editions
  where course_id = target_course_id
    and archived_at is null
  order by created_at desc
  limit 1;

  if target_edition_id is null then
    insert into public.course_editions (
      course_id,
      title,
      slug,
      status,
      start_date,
      end_date,
      capacity,
      enrollment_open,
      requires_approval
    )
    values (
      target_course_id,
      'Pruebas de Performance 11 Copy',
      'default',
      'published',
      '2026-08-05',
      '2026-10-28',
      100,
      true,
      true
    )
    returning id into target_edition_id;
  else
    update public.course_editions
    set
      title = 'Pruebas de Performance 11 Copy',
      status = 'published',
      start_date = '2026-08-05',
      end_date = '2026-10-28',
      capacity = coalesce(capacity, 100),
      enrollment_open = true,
      requires_approval = true
    where id = target_edition_id;
  end if;

  delete from public.lessons
  where course_id = target_course_id;

  delete from public.modules
  where course_id = target_course_id;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Fundamentos',
    'Conceptos base de performance testing, métricas principales, protocolos y presentación del capstone.',
    1,
    'published'
  )
  returning id into module_id;

  insert into public.lessons (
    course_id, module_id, title, slug, description, content, scheduled_at,
    duration_minutes, position, status, attendance_enabled
  )
  values (
    target_course_id,
    module_id,
    'Fundamentos de Performance Testing',
    'fundamentos-de-performance-testing',
    'Bienvenida, tipos de pruebas, métricas principales, herramientas del mercado, arquitectura cliente-servidor, HTTP/HTTPS, requests/responses y presentación del capstone.',
    'Los estudiantes conocen el programa, el Performance Test Results Report y las bases necesarias para iniciar un proyecto real de performance testing.',
    '2026-08-05 19:00:00-04',
    120,
    1,
    'published',
    true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Temario oficial del programa', 'PDF base del grupo de estudio.', 'pdf', syllabus_url, true, 1),
    (lesson_id, 'Performance Test Results Report - plantilla inicial', 'Plantilla que se completa durante todo el programa.', 'report', null, true, 2),
    (lesson_id, 'Checklist de métricas principales', 'Resumen de métricas para analizar resultados.', 'report', null, true, 3);

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'JMeter',
    'Construcción, correlación, parametrización y ejecución de scripts con JMeter.',
    2,
    'published'
  )
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Mi Primer Script en JMeter', 'mi-primer-script-en-jmeter',
    'Configuración del browser, grabación, estructura del script, HTTP Requests, Debug, Cookie Manager, HTTP Request Defaults, assertions, timers y ejecución básica.',
    'La clase usa la Aplicación Web #1 para construir el primer script en JMeter desde cero.',
    '2026-08-12 19:00:00-04', 120, 2, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Grabación de clase - JMeter primer script', 'Video de referencia para repasar la clase.', 'video', null, false, 1),
    (lesson_id, 'Starter script JMeter', 'Archivo base para práctica de JMeter.', 'script', null, true, 2),
    (lesson_id, 'Aplicación Web #1', 'Ambiente de práctica para grabación y requests.', 'external_link', null, false, 3);

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Correlación y Parametrización en JMeter', 'correlacion-y-parametrizacion-en-jmeter',
    'Parametrización, CSV Data Set Config, variables, controladores, correlación, extractores y práctica con Aplicación Web #2.',
    'El objetivo es hacer scripts más dinámicos y listos para escenarios de usuarios múltiples.',
    '2026-08-19 19:00:00-04', 120, 3, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Dataset CSV de práctica', 'Datos parametrizados para ejecutar usuarios variables.', 'script', null, true, 1),
    (lesson_id, 'Guía de extractores y variables', 'Referencia rápida de correlación en JMeter.', 'pdf', null, true, 2);

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Ejecutando mis Scripts', 'ejecutando-mis-scripts-jmeter',
    'Generación de carga, reportes JTL, listeners, ejecución por consola, Aplicación Web #3 y asignación del capstone en JMeter.',
    'Los estudiantes ejecutan scripts y empiezan a producir resultados que alimentan el reporte final.',
    '2026-08-26 19:00:00-04', 120, 4, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Comandos de ejecución por consola', 'Referencia para ejecutar JMeter en modo non-GUI.', 'script', null, true, 1),
    (lesson_id, 'Ejemplo de reporte JTL', 'Archivo de ejemplo para analizar resultados.', 'report', null, true, 2),
    (lesson_id, 'Asignación Capstone - JMeter', 'Entrega del primer bloque del proyecto final.', 'report', null, true, 3);

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Relampo',
    'Grabación, YAML, correlación automática, ejecución distribuida y reportes con Relampo.',
    3,
    'published'
  )
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Mi Primer Script en Relampo', 'mi-primer-script-en-relampo',
    'Grabación, estructura YAML, requests, assertions, timers, ejecución y Aplicación Web #1.',
    'Primera implementación del mismo escenario usando Relampo.',
    '2026-09-02 19:00:00-04', 120, 5, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Starter YAML Relampo', 'Script base en YAML para la práctica.', 'script', null, true, 1),
    (lesson_id, 'Guía de assertions y timers', 'Notas de configuración básica.', 'pdf', null, true, 2);

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Correlación y Parametrización en Relampo', 'correlacion-y-parametrizacion-en-relampo',
    'Parametrización, variables, correlación automática, extractores y Aplicación Web #2.',
    'Práctica enfocada en construir scripts dinámicos en Relampo.',
    '2026-09-09 19:00:00-04', 120, 6, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Ejemplos de variables y extractores', 'Snippets para correlación automática.', 'script', null, true, 1),
    (lesson_id, 'Dataset de parametrización Relampo', 'Datos para escenarios dinámicos.', 'script', null, true, 2);

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Ejecutando mis Scripts', 'ejecutando-mis-scripts-relampo',
    'Generación de carga, reportes, ejecución distribuida y asignación del capstone en Relampo.',
    'Los estudiantes comparan resultados de Relampo contra lo trabajado en JMeter.',
    '2026-09-16 19:00:00-04', 120, 7, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Asignación Capstone - Relampo', 'Entrega del escenario implementado en Relampo.', 'report', null, true, 1),
    (lesson_id, 'Ejemplo de reporte Relampo', 'Reporte de referencia para análisis.', 'report', null, true, 2);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'AI & Performance Testing', 'Uso de agentes de AI aplicados al performance testing.', 4, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'AI Agents for Performance Testing', 'ai-agents-for-performance-testing',
    'Clase con invitado especial sobre agentes de AI para acelerar análisis, generación de escenarios y revisión de resultados.',
    'Exploración de casos prácticos de AI aplicada al ciclo de performance testing.',
    '2026-09-23 19:00:00-04', 120, 8, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Prompt pack para performance testing', 'Prompts base para análisis y generación de escenarios.', 'script', null, true, 1),
    (lesson_id, 'Notas del invitado especial', 'Resumen y referencias de la clase.', 'pdf', null, true, 2);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'k6', 'Performance testing con k6 usando escenarios, assertions, timers y resultados básicos.', 5, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Performance Testing con k6', 'performance-testing-con-k6',
    'Aplicación Web #2, parametrización, correlación, timers, assertions, generación de carga, resultados básicos y asignación del capstone.',
    'Implementación del escenario de pruebas usando k6.',
    '2026-09-30 19:00:00-04', 120, 9, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Starter script k6', 'Script base para construir el escenario en k6.', 'script', null, true, 1),
    (lesson_id, 'Asignación Capstone - k6', 'Entrega del escenario implementado en k6.', 'report', null, true, 2);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'Gatling', 'Performance testing con Gatling y comparación contra herramientas previas.', 6, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Performance Testing con Gatling', 'performance-testing-con-gatling',
    'Aplicación Web #2, parametrización, correlación, timers, assertions, generación de carga, resultados básicos y asignación del capstone.',
    'Implementación del escenario de pruebas usando Gatling.',
    '2026-10-07 19:00:00-04', 120, 10, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Starter script Gatling', 'Script base para práctica en Gatling.', 'script', null, true, 1),
    (lesson_id, 'Asignación Capstone - Gatling', 'Entrega del escenario implementado en Gatling.', 'report', null, true, 2);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'Plataformas Cloud', 'Ejecución de pruebas en plataformas cloud y comparación de herramientas.', 7, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'BlazeMeter & OctoPerf', 'blazemeter-and-octoperf',
    'Importación de scripts, configuración de pruebas, ejecución en la nube, reportes y comparación entre plataformas.',
    'Clase con invitado especial enfocada en ejecución cloud.',
    '2026-10-14 19:00:00-04', 120, 11, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Checklist de ejecución cloud', 'Pasos para preparar pruebas en BlazeMeter y OctoPerf.', 'pdf', null, true, 1),
    (lesson_id, 'Comparativa de plataformas', 'Tabla para comparar resultados y costos.', 'report', null, true, 2);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'Performance Results Analysis', 'Análisis de métricas, reportes, nmon, logs y preparación del documento final.', 8, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Performance Results Analysis', 'performance-results-analysis',
    'Métricas, reporte de performance, archivo nmon, logs de la aplicación y preparación del documento final.',
    'Esta clase prepara a los estudiantes para completar el Performance Test Results Report.',
    '2026-10-21 19:00:00-04', 120, 12, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Ejemplo de análisis nmon', 'Archivo de referencia para métricas de infraestructura.', 'report', null, true, 1),
    (lesson_id, 'Log analysis worksheet', 'Plantilla para documentar hallazgos desde logs.', 'report', null, true, 2),
    (lesson_id, 'Performance Test Results Report - versión final', 'Documento final del capstone.', 'report', null, true, 3);

  insert into public.modules (course_id, title, description, position, status)
  values (target_course_id, 'Entrega del Capstone Project', 'Presentación final del proyecto y entrega de scripts, reportes e informe profesional.', 9, 'published')
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id, module_id, 'Presentación del Proyecto Final', 'presentacion-del-proyecto-final',
    'Entrega de scripts en JMeter, Relampo, k6 y Gatling; reportes generados; y Performance Test Results Report completo.',
    'El documento final incluye executive summary, objetivos, ambiente, workload, escenarios, resultados, métricas de infraestructura, logs, hallazgos, recomendaciones y conclusiones.',
    '2026-10-28 19:00:00-04', 120, 13, 'published', true
  )
  returning id into lesson_id;
  insert into public.resources (lesson_id, title, description, resource_type, external_url, is_downloadable, position)
  values
    (lesson_id, 'Final submission checklist', 'Lista de verificación antes de presentar el capstone.', 'pdf', null, true, 1),
    (lesson_id, 'Portfolio presentation template', 'Plantilla para presentar el proyecto en entrevistas o portafolio.', 'slides', null, true, 2),
    (lesson_id, 'Capstone final package', 'Entrega final con scripts, reportes y documento profesional.', 'zip', null, true, 3);
end $$;
