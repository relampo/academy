do $$
declare
  target_course_id uuid;
  module_id uuid;
  lesson_id uuid;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'Grupo de Estudio: Performance Testing LATAM'
  order by created_at desc
  limit 1;

  if target_course_id is null then
    raise notice 'Course "Grupo de Estudio: Performance Testing LATAM" was not found. Skipping content seed.';
    return;
  end if;

  update public.courses
  set
    short_description = 'Grupo de estudio semanal de Performance Testing Foundations para LATAM.',
    description = 'Programa de 13 clases que lleva a los participantes desde los fundamentos del performance testing hasta un proyecto final de portafolio: Performance Test Results Report.',
    status = 'published'
  where id = target_course_id;

  update public.course_editions
  set
    title = 'Grupo de Estudio: Performance Testing LATAM',
    status = 'published',
    start_date = '2026-08-05',
    end_date = '2026-10-28',
    enrollment_open = true
  where course_id = target_course_id
    and archived_at is null;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Fundamentos',
    'Bases del performance testing, métricas principales, arquitectura cliente-servidor, protocolos y presentación del capstone.',
    1,
    'published'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
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
    'Bienvenida, casos reales, carrera profesional, métricas principales, tipos de pruebas, herramientas del mercado, arquitectura cliente-servidor, protocolos, HTTP/HTTPS, métodos HTTP, requests/responses y presentación del capstone.',
    'Presentación del Capstone Project y del Performance Test Results Report, la plantilla profesional que se completará durante todo el programa.',
    '2026-08-05 19:00:00-04',
    120,
    1,
    'published',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled
  returning id into lesson_id;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'JMeter',
    'Grabación, estructura, correlación, parametrización y ejecución de scripts con JMeter.',
    2,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values
    (
      target_course_id,
      module_id,
      'Mi Primer Script en JMeter',
      'mi-primer-script-en-jmeter',
      'Configuración del browser, grabación, estructura del script, HTTP Requests, Debug, Cookie Manager, HTTP Request Defaults, assertions, timers, ejecución de scripts básicos y Aplicación Web #1.',
      'Primera práctica guiada para construir y ejecutar un script básico en JMeter.',
      '2026-08-12 19:00:00-04',
      120,
      2,
      'draft',
      true
    ),
    (
      target_course_id,
      module_id,
      'Correlación y Parametrización en JMeter',
      'correlacion-y-parametrizacion-en-jmeter',
      'Parametrización, CSV Data Set Config, variables, controladores, correlación, extractores y Aplicación Web #2.',
      'Construcción de scripts más dinámicos mediante datos variables y correlación.',
      '2026-08-19 19:00:00-04',
      120,
      3,
      'draft',
      true
    ),
    (
      target_course_id,
      module_id,
      'Ejecutando mis Scripts',
      'ejecutando-mis-scripts-jmeter',
      'Generación de carga, reportes JTL, listeners, ejecución por consola, Aplicación Web #3 y asignación del Capstone Project - JMeter.',
      'Ejecución y análisis inicial de resultados producidos con JMeter.',
      '2026-08-26 19:00:00-04',
      120,
      4,
      'draft',
      true
    )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Relampo',
    'Grabación, YAML, requests, assertions, timers, correlación automática y ejecución distribuida con Relampo.',
    3,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values
    (
      target_course_id,
      module_id,
      'Mi Primer Script en Relampo',
      'mi-primer-script-en-relampo',
      'Grabación, estructura YAML, requests, assertions, timers, ejecución y Aplicación Web #1.',
      'Primera implementación del escenario de práctica usando Relampo.',
      '2026-09-02 19:00:00-04',
      120,
      5,
      'draft',
      true
    ),
    (
      target_course_id,
      module_id,
      'Correlación y Parametrización en Relampo',
      'correlacion-y-parametrizacion-en-relampo',
      'Parametrización, variables, correlación automática, extractores y Aplicación Web #2.',
      'Práctica para construir scripts dinámicos y reutilizables en Relampo.',
      '2026-09-09 19:00:00-04',
      120,
      6,
      'draft',
      true
    ),
    (
      target_course_id,
      module_id,
      'Ejecutando mis Scripts',
      'ejecutando-mis-scripts-relampo',
      'Generación de carga, reportes, ejecución distribuida y asignación del Capstone Project - Relampo.',
      'Ejecución y comparación de resultados usando Relampo.',
      '2026-09-16 19:00:00-04',
      120,
      7,
      'draft',
      true
    )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'AI & Performance Testing',
    'Uso de agentes de AI aplicados al ciclo de performance testing.',
    4,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'AI Agents for Performance Testing',
    'ai-agents-for-performance-testing',
    'Clase con invitado especial sobre agentes de AI para performance testing.',
    'Sesión enfocada en casos de uso de AI para acelerar diseño, análisis y revisión de resultados.',
    '2026-09-23 19:00:00-04',
    120,
    8,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'k6',
    'Performance testing con k6 usando parametrización, correlación, timers, assertions y generación de carga.',
    5,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'Performance Testing con k6',
    'performance-testing-con-k6',
    'Aplicación Web #2, parametrización, correlación, timers, assertions, generación de carga, resultados básicos y asignación del Capstone Project - k6.',
    'Implementación del escenario de pruebas usando k6.',
    '2026-09-30 19:00:00-04',
    120,
    9,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Gatling',
    'Performance testing con Gatling y comparación con herramientas previas.',
    6,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'Performance Testing con Gatling',
    'performance-testing-con-gatling',
    'Aplicación Web #2, parametrización, correlación, timers, assertions, generación de carga, resultados básicos y asignación del Capstone Project - Gatling.',
    'Implementación del escenario de pruebas usando Gatling.',
    '2026-10-07 19:00:00-04',
    120,
    10,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Plataformas Cloud',
    'Importación, configuración y ejecución de pruebas en plataformas cloud.',
    7,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'BlazeMeter & OctoPerf',
    'blazemeter-and-octoperf',
    'Importación de scripts, configuración de pruebas, ejecución en la nube, reportes y comparación entre plataformas.',
    'Clase con invitado especial enfocada en ejecución cloud.',
    '2026-10-14 19:00:00-04',
    120,
    11,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Performance Results Analysis',
    'Análisis de métricas, reportes, nmon, logs y preparación del documento final.',
    8,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'Performance Results Analysis',
    'performance-results-analysis',
    'Métricas, reporte de performance, archivo nmon, logs de la aplicación y preparación del documento final.',
    'Esta clase prepara a los estudiantes para completar el documento final del proyecto.',
    '2026-10-21 19:00:00-04',
    120,
    12,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;

  insert into public.modules (course_id, title, description, position, status)
  values (
    target_course_id,
    'Entrega del Capstone Project',
    'Presentación final del proyecto y entrega de scripts, reportes e informe profesional.',
    9,
    'draft'
  )
  on conflict (course_id, position) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status
  returning id into module_id;

  insert into public.lessons (course_id, module_id, title, slug, description, content, scheduled_at, duration_minutes, position, status, attendance_enabled)
  values (
    target_course_id,
    module_id,
    'Presentación del Proyecto Final',
    'presentacion-del-proyecto-final',
    'Entrega de scripts en JMeter, Relampo, k6 y Gatling; reportes generados; y Performance Test Results Report.',
    'Entrega final del documento profesional con executive summary, objetivos, ambiente, workload, escenarios, resultados, métricas de infraestructura, logs, hallazgos, recomendaciones y conclusiones.',
    '2026-10-28 19:00:00-04',
    120,
    13,
    'draft',
    true
  )
  on conflict (course_id, slug) do update
  set
    module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    scheduled_at = excluded.scheduled_at,
    duration_minutes = excluded.duration_minutes,
    position = excluded.position,
    status = excluded.status,
    attendance_enabled = excluded.attendance_enabled;
end $$;
