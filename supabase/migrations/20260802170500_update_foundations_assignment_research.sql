update public.lesson_assignments
set
  title = 'Assignment - Casos reales de problemas de performance',
  description = 'Investiga 5 aplicaciones o plataformas que hayan tenido problemas de performance durante su lanzamiento o durante un evento de alto tráfico. Para cada caso, redacta: qué ocurrió, cuáles fueron los principales impactos para usuarios y negocio, qué aprendizajes deja para performance testing, y agrega las referencias consultadas. Entrega tu investigación en tu repositorio de GitHub y pega aquí el enlace directo al archivo o carpeta de esta tarea.',
  assignment_type = 'research',
  points = 10
where lesson_id in (
  select l.id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = 'Grupo de Estudio: Performance Testing LATAM'
    and l.title = 'Fundamentos de Performance Testing'
);
