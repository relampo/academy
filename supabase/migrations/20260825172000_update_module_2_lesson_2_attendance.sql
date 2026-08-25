do $$
declare
  target_course_id uuid;
  target_lesson_id uuid;
  matched_count integer;
  absent_count integer;
begin
  select c.id
  into target_course_id
  from public.courses c
  where c.title = 'Grupo de Estudio: Performance Testing LATAM'
  order by c.created_at desc
  limit 1;

  if target_course_id is null then
    raise exception 'Course "Grupo de Estudio: Performance Testing LATAM" was not found.';
  end if;

  select l.id
  into target_lesson_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.course_id = target_course_id
    and m.position = 2
  order by l.position asc
  offset 1
  limit 1;

  if target_lesson_id is null then
    raise exception 'Module 2, lesson 2 was not found.';
  end if;

  with attendance_csv(raw_key, raw_name, minutes) as (
    values
      ('yadira garcía', 'Yadira García', 115),
      ('delvis e (relampo)', 'Delvis E (Relampo)', 112),
      ('violena hernandez', 'Violena Hernandez', 107),
      ('humberto ballesteros', 'Humberto Ballesteros', 100),
      ('chaves juan', 'Chaves Juan', 98),
      ('danielteran', 'DanielTeran', 98),
      ('gustavo grajales', 'Gustavo Grajales', 98),
      ('iris moreno', 'Iris Moreno', 98),
      ('jesús perez', 'Jesús Perez', 98),
      ('josé gonzález', 'José González', 98),
      ('leticia gainza', 'Leticia Gainza', 98),
      ('lourdes gimenez', 'Lourdes Gimenez', 98),
      ('luis morales', 'Luis Morales', 98),
      ('martha hernández', 'Martha Hernández', 98),
      ('martin martinez', 'Martin Martinez', 98),
      ('moisés v', 'Moisés V', 98),
      ('patricia', 'Patricia', 98),
      ('patricia pinto', 'Patricia Pinto', 98),
      ('sadith olivares flores', 'SADITH OLIVARES FLORES', 98),
      ('samuel amonzabel', 'Samuel Amonzabel', 98),
      ('carmen', 'Carmen', 97),
      ('johnny ramos', 'Johnny Ramos', 97),
      ('maria alexandra quintanilla', 'Maria Alexandra Quintanilla', 97),
      ('diana aunca', 'diana aunca', 97),
      ('jheiner reaño', 'Jheiner Reaño', 96),
      ('kevin torres', 'Kevin Torres', 96),
      ('saily leyva', 'Saily Leyva', 96),
      ('celio sanchez', 'celio sanchez', 96),
      ('alejandro de rosa', 'Alejandro De Rosa', 95),
      ('dayhanna campos', 'Dayhanna Campos', 95),
      ('maria rubalcaba', 'Maria Rubalcaba', 95),
      ('yiselmartinezdiaz', 'YiselMartinezDiaz', 95),
      ('liseth portuguez', 'Liseth Portuguez', 94),
      ('miguel', 'Miguel', 94),
      ('nahuel', 'Nahuel', 94),
      ('omar gonzalez', 'Omar Gonzalez', 94),
      ('maría alejandra bravo', 'María Alejandra Bravo', 93),
      ('yusmary companioni(ycomparoot@gmail.com)', 'Yusmary Companioni(ycomparoot@gmail.com)', 93),
      ('dahi', 'Dahi', 92),
      ('isa', 'Isa', 92),
      ('paula aragón', 'Paula Aragón', 92),
      ('juliet', 'Juliet', 91),
      ('yackeline cardenas apaza', 'Yackeline Cardenas Apaza', 91),
      ('irving quezada', 'Irving Quezada', 90),
      ('brenda silva', 'Brenda Silva', 89),
      ('evelyn c.', 'Evelyn C.', 88),
      ('yelena', 'Yelena', 88),
      ('sharon rodriguez', 'Sharon Rodriguez', 86),
      ('paola camargo', 'paola camargo', 85),
      ('fernanda flores gallo', 'Fernanda Flores Gallo', 83),
      ('tec | christian sanabria jiménez', 'TEC | Christian Sanabria Jiménez', 80),
      ('gaby arriaga chávez', 'Gaby Arriaga Chávez', 73),
      ('margarita sanchez', 'MARGARITA SANCHEZ', 73),
      ('ariadna garcia', 'Ariadna Garcia', 71),
      ('raquel sotero', 'raquel sotero', 66),
      ('daniel peña', 'Daniel Peña', 63),
      ('jaime arnold huanca valle', 'Jaime Arnold Huanca Valle', 62),
      ('leonardo gaona', 'Leonardo Gaona', 62),
      ('raúl huamán', 'Raúl Huamán', 60),
      ('greisi mariñas', 'Greisi Mariñas', 56),
      ('kevin angarita 11-2', 'Kevin Angarita 11-2', 55),
      ('armando tineo', 'Armando Tineo', 53),
      ('grecia chávez', 'Grecia Chávez', 30),
      ('jenny huaman', 'Jenny Huaman', 25),
      ('renzo', 'Renzo', 22),
      ('omar gabriel''s assistant', 'Omar Gabriel''s Assistant', 11),
      ('yackeline', 'Yackeline', 3),
      ('joan paul tasayco mamani', 'JOAN PAUL TASAYCO MAMANI', 2),
      ('yadira garc[ia', 'Yadira Garc[ia', 1)
  ),
  normalized_csv as (
    select
      regexp_replace(
        translate(lower(raw_key), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
        '[^a-z0-9]+',
        ' ',
        'g'
      ) as normalized_key,
      regexp_replace(
        translate(lower(raw_name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
        '[^a-z0-9]+',
        ' ',
        'g'
      ) as normalized_name,
      max(minutes) as minutes
    from attendance_csv
    group by raw_key, raw_name
  ),
  normalized_students as (
    select distinct on (p.id)
      p.id as student_id,
      coalesce(nullif(p.display_name, ''), nullif(trim(p.first_name || ' ' || p.last_name), ''), p.email, p.id::text) as student_name,
      regexp_replace(
        translate(lower(coalesce(nullif(p.display_name, ''), '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
        '[^a-z0-9]+',
        ' ',
        'g'
      ) as normalized_display_name,
      regexp_replace(
        translate(lower(coalesce(nullif(trim(p.first_name || ' ' || p.last_name), ''), '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
        '[^a-z0-9]+',
        ' ',
        'g'
      ) as normalized_full_name
    from public.enrollments e
    join public.course_editions ce on ce.id = e.edition_id
    join public.profiles p on p.id = e.student_id
    where ce.course_id = target_course_id
      and e.status = 'approved'
    order by p.id, e.requested_at asc
  ),
  matched_attendance as (
    select
      ns.student_id,
      max(nc.minutes) as minutes
    from normalized_students ns
    left join normalized_csv nc
      on nc.normalized_key in (ns.normalized_display_name, ns.normalized_full_name)
      or nc.normalized_name in (ns.normalized_display_name, ns.normalized_full_name)
    group by ns.student_id
  ),
  attendance_status as (
    select
      ns.student_id,
      ma.minutes,
      ma.minutes is not null
        or ns.normalized_display_name ~ '(^| )(patricia|yackeline|yadira)( |$)'
        or ns.normalized_full_name ~ '(^| )(patricia|yackeline|yadira)( |$)' as attended,
      coalesce(ma.minutes, 0) > 50
        or ns.normalized_display_name ~ '(^| )(patricia|yackeline|yadira)( |$)'
        or ns.normalized_full_name ~ '(^| )(patricia|yackeline|yadira)( |$)' as stayed_until_end
    from normalized_students ns
    left join matched_attendance ma on ma.student_id = ns.student_id
  ),
  upserted as (
    insert into public.lesson_attendance (
      lesson_id,
      student_id,
      attended,
      stayed_until_end,
      confirmed_at
    )
    select
      target_lesson_id,
      attendance_status.student_id,
      attendance_status.attended,
      attendance_status.stayed_until_end,
      now()
    from attendance_status
    on conflict (lesson_id, student_id) do update
    set
      attended = excluded.attended,
      stayed_until_end = excluded.stayed_until_end,
      confirmed_at = excluded.confirmed_at,
      updated_at = now()
    returning student_id, attended
  )
  select
    count(*) filter (where attended),
    count(*) filter (where not attended)
  into matched_count, absent_count
  from upserted;

  raise notice 'Updated attendance for module 2 lesson 2: % present, % absent.', matched_count, absent_count;

  raise notice 'Students marked as absent: %',
    (
      with normalized_csv(raw_key, raw_name, minutes) as (
        values
          ('yadira garcía', 'Yadira García', 115),
          ('delvis e (relampo)', 'Delvis E (Relampo)', 112),
          ('violena hernandez', 'Violena Hernandez', 107),
          ('humberto ballesteros', 'Humberto Ballesteros', 100),
          ('chaves juan', 'Chaves Juan', 98),
          ('danielteran', 'DanielTeran', 98),
          ('gustavo grajales', 'Gustavo Grajales', 98),
          ('iris moreno', 'Iris Moreno', 98),
          ('jesús perez', 'Jesús Perez', 98),
          ('josé gonzález', 'José González', 98),
          ('leticia gainza', 'Leticia Gainza', 98),
          ('lourdes gimenez', 'Lourdes Gimenez', 98),
          ('luis morales', 'Luis Morales', 98),
          ('martha hernández', 'Martha Hernández', 98),
          ('martin martinez', 'Martin Martinez', 98),
          ('moisés v', 'Moisés V', 98),
          ('patricia', 'Patricia', 98),
          ('patricia pinto', 'Patricia Pinto', 98),
          ('sadith olivares flores', 'SADITH OLIVARES FLORES', 98),
          ('samuel amonzabel', 'Samuel Amonzabel', 98),
          ('carmen', 'Carmen', 97),
          ('johnny ramos', 'Johnny Ramos', 97),
          ('maria alexandra quintanilla', 'Maria Alexandra Quintanilla', 97),
          ('diana aunca', 'diana aunca', 97),
          ('jheiner reaño', 'Jheiner Reaño', 96),
          ('kevin torres', 'Kevin Torres', 96),
          ('saily leyva', 'Saily Leyva', 96),
          ('celio sanchez', 'celio sanchez', 96),
          ('alejandro de rosa', 'Alejandro De Rosa', 95),
          ('dayhanna campos', 'Dayhanna Campos', 95),
          ('maria rubalcaba', 'Maria Rubalcaba', 95),
          ('yiselmartinezdiaz', 'YiselMartinezDiaz', 95),
          ('liseth portuguez', 'Liseth Portuguez', 94),
          ('miguel', 'Miguel', 94),
          ('nahuel', 'Nahuel', 94),
          ('omar gonzalez', 'Omar Gonzalez', 94),
          ('maría alejandra bravo', 'María Alejandra Bravo', 93),
          ('yusmary companioni(ycomparoot@gmail.com)', 'Yusmary Companioni(ycomparoot@gmail.com)', 93),
          ('dahi', 'Dahi', 92),
          ('isa', 'Isa', 92),
          ('paula aragón', 'Paula Aragón', 92),
          ('juliet', 'Juliet', 91),
          ('yackeline cardenas apaza', 'Yackeline Cardenas Apaza', 91),
          ('irving quezada', 'Irving Quezada', 90),
          ('brenda silva', 'Brenda Silva', 89),
          ('evelyn c.', 'Evelyn C.', 88),
          ('yelena', 'Yelena', 88),
          ('sharon rodriguez', 'Sharon Rodriguez', 86),
          ('paola camargo', 'paola camargo', 85),
          ('fernanda flores gallo', 'Fernanda Flores Gallo', 83),
          ('tec | christian sanabria jiménez', 'TEC | Christian Sanabria Jiménez', 80),
          ('gaby arriaga chávez', 'Gaby Arriaga Chávez', 73),
          ('margarita sanchez', 'MARGARITA SANCHEZ', 73),
          ('ariadna garcia', 'Ariadna Garcia', 71),
          ('raquel sotero', 'raquel sotero', 66),
          ('daniel peña', 'Daniel Peña', 63),
          ('jaime arnold huanca valle', 'Jaime Arnold Huanca Valle', 62),
          ('leonardo gaona', 'Leonardo Gaona', 62),
          ('raúl huamán', 'Raúl Huamán', 60),
          ('greisi mariñas', 'Greisi Mariñas', 56),
          ('kevin angarita 11-2', 'Kevin Angarita 11-2', 55),
          ('armando tineo', 'Armando Tineo', 53),
          ('grecia chávez', 'Grecia Chávez', 30),
          ('jenny huaman', 'Jenny Huaman', 25),
          ('renzo', 'Renzo', 22),
          ('omar gabriel''s assistant', 'Omar Gabriel''s Assistant', 11),
          ('yackeline', 'Yackeline', 3),
          ('joan paul tasayco mamani', 'JOAN PAUL TASAYCO MAMANI', 2),
          ('yadira garc[ia', 'Yadira Garc[ia', 1)
      ),
      normalized_csv_values as (
        select
          regexp_replace(translate(lower(raw_key), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'), '[^a-z0-9]+', ' ', 'g') as normalized_key,
          regexp_replace(translate(lower(raw_name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'), '[^a-z0-9]+', ' ', 'g') as normalized_name
        from normalized_csv
      ),
      normalized_students_values as (
        select distinct on (p.id)
          p.id as student_id,
          coalesce(nullif(p.display_name, ''), nullif(trim(p.first_name || ' ' || p.last_name), ''), p.email, p.id::text) as student_name,
          regexp_replace(translate(lower(coalesce(nullif(p.display_name, ''), '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'), '[^a-z0-9]+', ' ', 'g') as normalized_display_name,
          regexp_replace(translate(lower(coalesce(nullif(trim(p.first_name || ' ' || p.last_name), ''), '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'), '[^a-z0-9]+', ' ', 'g') as normalized_full_name
        from public.enrollments e
        join public.course_editions ce on ce.id = e.edition_id
        join public.profiles p on p.id = e.student_id
        where ce.course_id = target_course_id
          and e.status = 'approved'
        order by p.id, e.requested_at asc
      )
      select string_agg(ns.student_name, ', ' order by ns.student_name)
      from normalized_students_values ns
      where not exists (
        select 1
        from normalized_csv_values nc
        where nc.normalized_key in (ns.normalized_display_name, ns.normalized_full_name)
          or nc.normalized_name in (ns.normalized_display_name, ns.normalized_full_name)
      )
    );
end $$;
