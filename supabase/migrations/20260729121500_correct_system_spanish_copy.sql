update public.courses
set description = 'Programa de 13 clases semanales que lleva a los estudiantes desde los fundamentos del performance testing hasta la ejecución de pruebas reales con JMeter, Relampo, k6, Gatling y plataformas cloud. El proyecto final es un Performance Test Results Report listo para portafolio.'
where description = 'Programa de 13 clases semanales que lleva a los estudiantes desde los fundamentos del performance testing hasta la ejecucion de pruebas reales con JMeter, Relampo, k6, Gatling y plataformas cloud. El proyecto final es un Performance Test Results Report listo para portafolio.';

update public.modules
set description = case description
  when 'Conceptos base de performance testing, metricas principales, protocolos y presentacion del capstone.'
    then 'Conceptos base de performance testing, métricas principales, protocolos y presentación del capstone.'
  when 'Construccion, correlacion, parametrizacion y ejecucion de scripts con JMeter.'
    then 'Construcción, correlación, parametrización y ejecución de scripts con JMeter.'
  when 'Grabacion, YAML, correlacion automatica, ejecucion distribuida y reportes con Relampo.'
    then 'Grabación, YAML, correlación automática, ejecución distribuida y reportes con Relampo.'
  when 'Performance testing con k6 usando escenarios, assertions, timers y resultados basicos.'
    then 'Performance testing con k6 usando escenarios, assertions, timers y resultados básicos.'
  when 'Performance testing con Gatling y comparacion contra herramientas previas.'
    then 'Performance testing con Gatling y comparación contra herramientas previas.'
  when 'Ejecucion de pruebas en plataformas cloud y comparacion de herramientas.'
    then 'Ejecución de pruebas en plataformas cloud y comparación de herramientas.'
  when 'Analisis de metricas, reportes, nmon, logs y preparacion del documento final.'
    then 'Análisis de métricas, reportes, nmon, logs y preparación del documento final.'
  when 'Presentacion final del proyecto y entrega de scripts, reportes e informe profesional.'
    then 'Presentación final del proyecto y entrega de scripts, reportes e informe profesional.'
  else description
end
where description in (
  'Conceptos base de performance testing, metricas principales, protocolos y presentacion del capstone.',
  'Construccion, correlacion, parametrizacion y ejecucion de scripts con JMeter.',
  'Grabacion, YAML, correlacion automatica, ejecucion distribuida y reportes con Relampo.',
  'Performance testing con k6 usando escenarios, assertions, timers y resultados basicos.',
  'Performance testing con Gatling y comparacion contra herramientas previas.',
  'Ejecucion de pruebas en plataformas cloud y comparacion de herramientas.',
  'Analisis de metricas, reportes, nmon, logs y preparacion del documento final.',
  'Presentacion final del proyecto y entrega de scripts, reportes e informe profesional.'
);

update public.lessons
set
  title = case title
    when 'Correlacion y Parametrizacion en JMeter' then 'Correlación y Parametrización en JMeter'
    when 'Correlacion y Parametrizacion en Relampo' then 'Correlación y Parametrización en Relampo'
    when 'Presentacion del Proyecto Final' then 'Presentación del Proyecto Final'
    else title
  end,
  description = case description
    when 'Bienvenida, tipos de pruebas, metricas principales, herramientas del mercado, arquitectura cliente-servidor, HTTP/HTTPS, requests/responses y presentacion del capstone.'
      then 'Bienvenida, tipos de pruebas, métricas principales, herramientas del mercado, arquitectura cliente-servidor, HTTP/HTTPS, requests/responses y presentación del capstone.'
    when 'Configuracion del browser, grabacion, estructura del script, HTTP Requests, Debug, Cookie Manager, HTTP Request Defaults, assertions, timers y ejecucion basica.'
      then 'Configuración del browser, grabación, estructura del script, HTTP Requests, Debug, Cookie Manager, HTTP Request Defaults, assertions, timers y ejecución básica.'
    when 'Parametrizacion, CSV Data Set Config, variables, controladores, correlacion, extractores y practica con Aplicacion Web #2.'
      then 'Parametrización, CSV Data Set Config, variables, controladores, correlación, extractores y práctica con Aplicación Web #2.'
    when 'Generacion de carga, reportes JTL, listeners, ejecucion por consola, Aplicacion Web #3 y asignacion del capstone en JMeter.'
      then 'Generación de carga, reportes JTL, listeners, ejecución por consola, Aplicación Web #3 y asignación del capstone en JMeter.'
    when 'Grabacion, estructura YAML, requests, assertions, timers, ejecucion y Aplicacion Web #1.'
      then 'Grabación, estructura YAML, requests, assertions, timers, ejecución y Aplicación Web #1.'
    when 'Parametrizacion, variables, correlacion automatica, extractores y Aplicacion Web #2.'
      then 'Parametrización, variables, correlación automática, extractores y Aplicación Web #2.'
    when 'Generacion de carga, reportes, ejecucion distribuida y asignacion del capstone en Relampo.'
      then 'Generación de carga, reportes, ejecución distribuida y asignación del capstone en Relampo.'
    when 'Clase con invitado especial sobre agentes de AI para acelerar analisis, generacion de escenarios y revision de resultados.'
      then 'Clase con invitado especial sobre agentes de AI para acelerar análisis, generación de escenarios y revisión de resultados.'
    when 'Aplicacion Web #2, parametrizacion, correlacion, timers, assertions, generacion de carga, resultados basicos y asignacion del capstone.'
      then 'Aplicación Web #2, parametrización, correlación, timers, assertions, generación de carga, resultados básicos y asignación del capstone.'
    when 'Importacion de scripts, configuracion de pruebas, ejecucion en la nube, reportes y comparacion entre plataformas.'
      then 'Importación de scripts, configuración de pruebas, ejecución en la nube, reportes y comparación entre plataformas.'
    when 'Metricas, reporte de performance, archivo nmon, logs de la aplicacion y preparacion del documento final.'
      then 'Métricas, reporte de performance, archivo nmon, logs de la aplicación y preparación del documento final.'
    else description
  end,
  content = case content
    when 'La clase usa la Aplicacion Web #1 para construir el primer script en JMeter desde cero.'
      then 'La clase usa la Aplicación Web #1 para construir el primer script en JMeter desde cero.'
    when 'El objetivo es hacer scripts mas dinamicos y listos para escenarios de usuarios multiples.'
      then 'El objetivo es hacer scripts más dinámicos y listos para escenarios de usuarios múltiples.'
    when 'Primera implementacion del mismo escenario usando Relampo.'
      then 'Primera implementación del mismo escenario usando Relampo.'
    when 'Practica enfocada en construir scripts dinamicos en Relampo.'
      then 'Práctica enfocada en construir scripts dinámicos en Relampo.'
    when 'Exploracion de casos practicos de AI aplicada al ciclo de performance testing.'
      then 'Exploración de casos prácticos de AI aplicada al ciclo de performance testing.'
    when 'Implementacion del escenario de pruebas usando k6.'
      then 'Implementación del escenario de pruebas usando k6.'
    when 'Implementacion del escenario de pruebas usando Gatling.'
      then 'Implementación del escenario de pruebas usando Gatling.'
    when 'Clase con invitado especial enfocada en ejecucion cloud.'
      then 'Clase con invitado especial enfocada en ejecución cloud.'
    else content
  end
where title in (
  'Correlacion y Parametrizacion en JMeter',
  'Correlacion y Parametrizacion en Relampo',
  'Presentacion del Proyecto Final'
)
or description is not null
or content is not null;

update public.resources
set
  title = case title
    when 'Checklist de metricas principales' then 'Checklist de métricas principales'
    when 'Grabacion de clase - JMeter primer script' then 'Grabación de clase - JMeter primer script'
    when 'Aplicacion Web #1' then 'Aplicación Web #1'
    when 'Dataset CSV de practica' then 'Dataset CSV de práctica'
    when 'Guia de extractores y variables' then 'Guía de extractores y variables'
    when 'Comandos de ejecucion por consola' then 'Comandos de ejecución por consola'
    when 'Asignacion Capstone - JMeter' then 'Asignación Capstone - JMeter'
    when 'Guia de assertions y timers' then 'Guía de assertions y timers'
    when 'Dataset de parametrizacion Relampo' then 'Dataset de parametrización Relampo'
    when 'Asignacion Capstone - Relampo' then 'Asignación Capstone - Relampo'
    when 'Asignacion Capstone - k6' then 'Asignación Capstone - k6'
    when 'Asignacion Capstone - Gatling' then 'Asignación Capstone - Gatling'
    when 'Checklist de ejecucion cloud' then 'Checklist de ejecución cloud'
    else title
  end,
  description = case description
    when 'Resumen de metricas para analizar resultados.' then 'Resumen de métricas para analizar resultados.'
    when 'Archivo base para practica de JMeter.' then 'Archivo base para práctica de JMeter.'
    when 'Ambiente de practica para grabacion y requests.' then 'Ambiente de práctica para grabación y requests.'
    when 'Referencia rapida de correlacion en JMeter.' then 'Referencia rápida de correlación en JMeter.'
    when 'Notas de configuracion basica.' then 'Notas de configuración básica.'
    when 'Snippets para correlacion automatica.' then 'Snippets para correlación automática.'
    when 'Datos para escenarios dinamicos.' then 'Datos para escenarios dinámicos.'
    when 'Reporte de referencia para analisis.' then 'Reporte de referencia para análisis.'
    when 'Prompts base para analisis y generacion de escenarios.' then 'Prompts base para análisis y generación de escenarios.'
    when 'Script base para practica en Gatling.' then 'Script base para práctica en Gatling.'
    when 'Lista de verificacion antes de presentar el capstone.' then 'Lista de verificación antes de presentar el capstone.'
    else description
  end
where title is not null
or description is not null;

update public.lesson_assignments
set
  title = regexp_replace(title, '^Assignment - ', 'Tarea - '),
  description = 'Envía la evidencia requerida para esta clase.'
where title like 'Assignment - %'
or description = 'Submit the required evidence for this class.';

create or replace function public.ensure_lesson_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lesson_assignments (
    lesson_id,
    title,
    description,
    assignment_type,
    points,
    required
  )
  values (
    new.id,
    'Tarea - ' || new.title,
    'Envía la evidencia requerida para esta clase.',
    'report',
    10,
    true
  )
  on conflict (lesson_id) do nothing;

  return new;
end;
$$;

create or replace function public.get_generated_leaderboard_alias(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (
    array[
      'Rayo Norte',
      'Centella Alta',
      'Trueno Claro',
      'Nube Iónica',
      'Chispa Azul',
      'Vórtice Solar',
      'Pulso Eléctrico',
      'Relámpago Delta',
      'Frente de Tormenta',
      'Arco Plasma'
    ]
  )[1 + (abs(hashtext(target_user_id::text)) % 10)]
$$;
