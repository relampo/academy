update public.lesson_assignments
set
  description = 'Investiga 5 aplicaciones o plataformas que hayan tenido problemas de performance durante su lanzamiento o durante un evento de alto tráfico. Para cada caso, redacta: qué ocurrió, cuáles fueron los principales impactos para usuarios y negocio, qué aprendizajes deja para performance testing, y agrega las referencias consultadas. Sube tu documento o evidencia a tu carpeta compartida de Google Drive y pega aquí el enlace directo para que el instructor pueda revisarlo.'
where lesson_id in (
  select l.id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = 'Grupo de Estudio: Performance Testing LATAM'
    and l.title = 'Fundamentos de Performance Testing'
);
