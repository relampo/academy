create or replace function public.get_leaderboard_alias_pool()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array[
    'Relámpago Delta',
    'Centella Alta',
    'Rayo Norte',
    'Trueno Claro',
    'Vórtice Solar',
    'Nube Iónica',
    'Pulso Eléctrico',
    'Arco Plasma',
    'Frente de Tormenta',
    'Aurora Boreal',
    'Lluvia Solar',
    'Ciclón Azul',
    'Neblina Polar',
    'Granizo Veloz',
    'Marea Magnética',
    'Órbita Lunar',
    'Corona Solar',
    'Eclipse Marino',
    'Bruma Eléctrica',
    'Tornado Prisma',
    'Onda Sísmica',
    'Llama Boreal',
    'Cristal de Hielo',
    'Ráfaga Andina',
    'Meteoro Verde',
    'Anillo de Plasma',
    'Ojo del Huracán',
    'Rocío Cósmico',
    'Campo Magnético',
    'Estrella Pulsante',
    'Nebulosa Ámbar',
    'Fulgor Atlántico',
    'Monzón Dorado',
    'Cascada Lunar',
    'Volcán Azul',
    'Cometa Naranja',
    'Halo Nocturno',
    'Magma Solar',
    'Arrecife Eléctrico',
    'Bosque Iónico',
    'Cumbre Nevada',
    'Duna Radiante',
    'Río de Luz',
    'Lago de Plasma',
    'Ráfaga Cobalto',
    'Tempestad Violeta',
    'Faro Boreal',
    'Radar de Nubes',
    'Satélite Solar',
    'Partícula Omega',
    'Brisa Solar',
    'Nimbo Dorado',
    'Ceniza Lunar',
    'Corriente Ártica',
    'Pulso Boreal',
    'Grieta Magnética',
    'Mar de Chispas',
    'Lágrima de Cometa',
    'Viento Cobalto',
    'Núcleo Radiante',
    'Eco de Trueno',
    'Sombra Solar',
    'Luz de Tormenta',
    'Roca Estelar',
    'Niebla de Plasma',
    'Línea de Fuego',
    'Rayo Cenital',
    'Manto Polar',
    'Esfera Iónica',
    'Cauce Eléctrico',
    'Prisma Celeste',
    'Flecha Solar',
    'Gota de Aurora',
    'Cristal Marino',
    'Ancla Magnética',
    'Círculo Boreal',
    'Cumbre de Fuego',
    'Arista Lunar',
    'Ola Violeta',
    'Llama Cobalto',
    'Nexo de Nubes',
    'Estela Dorada',
    'Campo de Granizo',
    'Marea Boreal',
    'Sol de Medianoche',
    'Rastro de Centella',
    'Eje de Tormenta',
    'Rumbo Estelar',
    'Brújula Solar',
    'Nodo de Plasma',
    'Raíz Iónica',
    'Corteza Lunar',
    'Pico Relámpago',
    'Nube de Cristal',
    'Órbita Esmeralda',
    'Fuego Austral',
    'Rocío Polar',
    'Cinturón de Luz',
    'Rayo Submarino',
    'Horizonte Omega',
    'Chispa Azul',
    'Chispa Dorada',
    'Chispa Verde',
    'Chispa Roja',
    'Chispa Boreal',
    'Chispa Marina',
    'Chispa Andina',
    'Chispa Lunar',
    'Chispa Solar',
    'Chispa Cobalto',
    'Centella Norte',
    'Centella Sur',
    'Centella Este',
    'Centella Oeste',
    'Centella Brillante',
    'Centella Profunda',
    'Centella Serena',
    'Centella Rápida',
    'Centella Clara',
    'Centella Nova',
    'Rayo Austral',
    'Rayo Boreal',
    'Rayo Marino',
    'Rayo Andino',
    'Rayo Cósmico',
    'Rayo Dorado',
    'Rayo Violeta',
    'Rayo Esmeralda',
    'Rayo Ámbar',
    'Rayo Prisma',
    'Trueno Norte',
    'Trueno Sur',
    'Trueno Solar',
    'Trueno Lunar',
    'Trueno Marino',
    'Trueno Andino',
    'Trueno Cobalto',
    'Trueno Dorado',
    'Trueno Esmeralda',
    'Trueno Violeta',
    'Pulso Norte',
    'Pulso Sur',
    'Pulso Solar',
    'Pulso Lunar',
    'Pulso Marino',
    'Pulso Andino',
    'Pulso Cobalto',
    'Pulso Dorado',
    'Pulso Esmeralda',
    'Pulso Violeta',
    'Aurora Norte',
    'Aurora Sur',
    'Aurora Solar',
    'Aurora Lunar',
    'Aurora Marina',
    'Aurora Andina',
    'Aurora Cobalto',
    'Aurora Dorada',
    'Aurora Esmeralda',
    'Aurora Violeta',
    'Vórtice Norte',
    'Vórtice Sur',
    'Vórtice Lunar',
    'Vórtice Marino',
    'Vórtice Andino',
    'Vórtice Cobalto',
    'Vórtice Dorado',
    'Vórtice Esmeralda',
    'Vórtice Violeta',
    'Vórtice Ámbar',
    'Nebulosa Norte',
    'Nebulosa Sur',
    'Nebulosa Solar',
    'Nebulosa Lunar',
    'Nebulosa Marina',
    'Nebulosa Andina',
    'Nebulosa Cobalto',
    'Nebulosa Dorada',
    'Nebulosa Esmeralda',
    'Nebulosa Violeta',
    'Meteoro Norte',
    'Meteoro Sur',
    'Meteoro Solar',
    'Meteoro Lunar',
    'Meteoro Marino',
    'Meteoro Andino',
    'Meteoro Cobalto',
    'Meteoro Dorado',
    'Meteoro Esmeralda',
    'Meteoro Violeta',
    'Cometa Norte',
    'Cometa Sur',
    'Cometa Solar',
    'Cometa Lunar',
    'Cometa Marino',
    'Cometa Andino',
    'Cometa Cobalto',
    'Cometa Dorado',
    'Cometa Esmeralda',
    'Cometa Violeta',
    'Prisma Norte',
    'Prisma Sur',
    'Prisma Solar',
    'Prisma Lunar',
    'Prisma Marino',
    'Prisma Andino',
    'Prisma Cobalto',
    'Prisma Dorado',
    'Prisma Esmeralda',
    'Prisma Violeta',
    'Faro Norte',
    'Faro Sur',
    'Faro Solar',
    'Faro Lunar',
    'Faro Marino',
    'Faro Andino',
    'Faro Cobalto',
    'Faro Dorado',
    'Faro Esmeralda',
    'Faro Violeta',
    'Radar Norte',
    'Radar Sur',
    'Radar Solar',
    'Radar Lunar',
    'Radar Marino',
    'Radar Andino',
    'Radar Cobalto',
    'Radar Dorado',
    'Radar Esmeralda',
    'Radar Violeta',
    'Órbita Norte',
    'Órbita Sur',
    'Órbita Solar',
    'Órbita Marina',
    'Órbita Andina',
    'Órbita Cobalto',
    'Órbita Dorada',
    'Órbita Violeta',
    'Órbita Ámbar',
    'Órbita Polar'
  ];
$$;

create or replace function public.get_generated_leaderboard_alias(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select aliases[1 + (abs(hashtext(target_user_id::text)) % array_length(aliases, 1))]
  from public.get_leaderboard_alias_pool() as aliases
$$;

create or replace function public.get_course_leaderboard(target_course_id uuid)
returns table (
  student_id uuid,
  display_name text,
  avatar_url text,
  total_score numeric,
  max_score numeric,
  score_ratio numeric,
  level text
)
language sql
stable
security definer
set search_path = public
as $$
  with requester_allowed as (
    select public.can_manage_course(target_course_id)
      or public.is_enrolled_in_course(target_course_id) as allowed
  ),
  alias_pool as (
    select alias, ordinal
    from unnest(public.get_leaderboard_alias_pool()) with ordinality as pool(alias, ordinal)
  ),
  course_lessons as (
    select l.id
    from public.lessons l
    where l.course_id = target_course_id
      and l.status <> 'archived'
  ),
  approved_students as (
    select
      e.student_id,
      min(coalesce(e.approved_at, e.requested_at)) as enrolled_at
    from public.enrollments e
    join public.course_editions ce on ce.id = e.course_edition_id
    where ce.course_id = target_course_id
      and e.status = 'approved'
    group by e.student_id
  ),
  ranked_students as (
    select
      approved_students.*,
      row_number() over (order by enrolled_at asc nulls last, student_id asc) as alias_index
    from approved_students
  ),
  attendance_scores as (
    select
      la.student_id,
      sum(
        case
          when la.attended and la.stayed_until_end then 10
          when la.attended then 5
          else 0
        end
      )::numeric as score
    from public.lesson_attendance la
    join course_lessons l on l.id = la.lesson_id
    group by la.student_id
  ),
  quiz_scores as (
    select qa.student_id, sum(qa.total_score)::numeric as score
    from public.quiz_attempts qa
    join public.lesson_quizzes q on q.id = qa.quiz_id
    join course_lessons l on l.id = q.lesson_id
    group by qa.student_id
  ),
  assignment_scores as (
    select s.student_id, sum(coalesce(s.points_awarded, 0))::numeric as score
    from public.assignment_submissions s
    join public.lesson_assignments a on a.id = s.assignment_id
    join course_lessons l on l.id = a.lesson_id
    group by s.student_id
  ),
  max_scores as (
    select coalesce(
      sum(10 + 20 + coalesce(a.points, 10)),
      0
    )::numeric as max_score
    from course_lessons l
    left join public.lesson_assignments a on a.lesson_id = l.id
  ),
  visible_profiles as (
    select
      p.*,
      rs.alias_index,
      coalesce(nullif(p.display_name, ''), nullif(trim(p.first_name || ' ' || p.last_name), '')) as full_profile_name
    from ranked_students rs
    join public.profiles p on p.id = rs.student_id
  ),
  scored_profiles as (
    select
      p.id as student_id,
      case
        when p.leaderboard_visibility = 'full_name'
          and p.full_profile_name is not null
          then alias_pool.alias || ' · ' || p.full_profile_name
        when p.leaderboard_visibility = 'first_name'
          and nullif(p.first_name, '') is not null
          then alias_pool.alias || ' · ' || p.first_name
        else alias_pool.alias
      end as display_name,
      p.avatar_url,
      (
        coalesce(attendance_scores.score, 0)
        + coalesce(quiz_scores.score, 0)
        + coalesce(assignment_scores.score, 0)
      )::numeric as total_score,
      max_scores.max_score,
      case
        when max_scores.max_score > 0 then (
          coalesce(attendance_scores.score, 0)
          + coalesce(quiz_scores.score, 0)
          + coalesce(assignment_scores.score, 0)
        ) / max_scores.max_score
        else 0
      end as score_ratio
    from visible_profiles p
    cross join max_scores
    join alias_pool on alias_pool.ordinal = p.alias_index
    left join attendance_scores on attendance_scores.student_id = p.id
    left join quiz_scores on quiz_scores.student_id = p.id
    left join assignment_scores on assignment_scores.student_id = p.id
    cross join requester_allowed
    where requester_allowed.allowed
  )
  select
    student_id,
    display_name,
    avatar_url,
    total_score,
    max_score,
    score_ratio,
    public.get_leaderboard_level(score_ratio) as level
  from scored_profiles
  order by total_score desc, display_name asc, student_id asc
$$;

grant execute on function public.get_leaderboard_alias_pool() to authenticated;
grant execute on function public.get_generated_leaderboard_alias(uuid) to authenticated;
grant execute on function public.get_course_leaderboard(uuid) to authenticated;
