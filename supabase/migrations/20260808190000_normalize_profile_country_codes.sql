-- The community map never lit up. The signup form stores an ISO alpha-2 code
-- (the País select uses option.code as its value), getCountryByCode expects a
-- code, and the SVG map keys off lowercase alpha-2 ids. But profiles.country
-- also holds free text imported from outside the app — "Peru", "Panamá",
-- "Colombia - Bogotá", "Buenos Aires" — so getCountryByCode returned undefined
-- and "peru" was compared against the id "pe": no country ever matched.
--
-- On top of that, get_student_country_counts grouped by the raw string, so
-- "Peru" and "Perú", or "Mexico" and "México", counted as separate places. In
-- the current data 46 distinct strings stand for 18 countries.
--
-- This resolves free text to ISO codes, rewrites the stored values, and makes
-- the counting function normalize on read so imported data can never split a
-- country in two again.

create or replace function public.normalize_country_code(raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v text;
  result text;
begin
  if raw is null then
    return null;
  end if;

  -- Fold accents and collapse whitespace so "Perú", "Peru " and "PERU" agree.
  v := lower(
    regexp_replace(
      translate(
        raw,
        'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
      ),
      '\s+', ' ', 'g'
    )
  );
  v := trim(v);

  if v = '' then
    return null;
  end if;

  -- Already an ISO alpha-2 code: everything the signup select writes.
  if v ~ '^[a-z]{2}$' then
    return upper(v);
  end if;

  select m.code into result
  from (values
    ('argentina', 'AR'),
    ('buenos aires', 'AR'),
    ('bolivia', 'BO'),
    ('brasil', 'BR'),
    ('brazil', 'BR'),
    ('canada', 'CA'),
    ('chile', 'CL'),
    ('colombia', 'CO'),
    -- "Colombo" has no plausible reading here other than a typo for Colombia:
    -- every other value in the data is a Spanish-speaking country.
    ('colombo', 'CO'),
    ('costa rica', 'CR'),
    ('cuba', 'CU'),
    ('ecuador', 'EC'),
    ('espana', 'ES'),
    ('spain', 'ES'),
    ('estados unidos', 'US'),
    ('united states', 'US'),
    ('eeuu', 'US'),
    ('usa', 'US'),
    ('guatemala', 'GT'),
    ('honduras', 'HN'),
    ('mexico', 'MX'),
    ('ciudad de mexico', 'MX'),
    ('cdmx', 'MX'),
    ('nicaragua', 'NI'),
    ('panama', 'PA'),
    ('panana', 'PA'),
    ('paraguay', 'PY'),
    ('peru', 'PE'),
    ('republica dominicana', 'DO'),
    ('el salvador', 'SV'),
    ('uruguay', 'UY'),
    ('venezuela', 'VE')
  ) as m(alias, code)
  where m.alias = v;

  if result is not null then
    return result;
  end if;

  -- "Colombia - Bogotá", "México, Querétaro", "España-Zaragoza",
  -- "Argentina Buenos Aires": the country leads and a region follows. Matching
  -- on a prefix plus a separator keeps hyphenated country names such as
  -- Guinea-Bissau from being truncated.
  select m.code into result
  from (values
    ('argentina', 'AR'),
    ('bolivia', 'BO'),
    ('brasil', 'BR'),
    ('brazil', 'BR'),
    ('canada', 'CA'),
    ('chile', 'CL'),
    ('colombia', 'CO'),
    ('costa rica', 'CR'),
    ('cuba', 'CU'),
    ('ecuador', 'EC'),
    ('espana', 'ES'),
    ('estados unidos', 'US'),
    ('guatemala', 'GT'),
    ('honduras', 'HN'),
    ('mexico', 'MX'),
    ('nicaragua', 'NI'),
    ('panama', 'PA'),
    ('paraguay', 'PY'),
    ('peru', 'PE'),
    ('uruguay', 'UY'),
    ('venezuela', 'VE')
  ) as m(alias, code)
  where v like m.alias || ' %'
     or v like m.alias || ',%'
     or v like m.alias || '-%'
  order by length(m.alias) desc
  limit 1;

  -- Unrecognisable ("E", a stray keystroke): leave it out of the map rather
  -- than guessing a country for a student.
  return result;
end;
$$;

-- Rewrite what is stored, so the profile page and the map read the same thing.
update public.profiles
set country = public.normalize_country_code(country)
where country is not null
  and country is distinct from public.normalize_country_code(country);

-- Normalize on read too: imported rows can arrive at any time and must never
-- split one country across two map entries again.
create or replace function public.get_student_country_counts()
returns table(country text, student_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.normalize_country_code(profiles.country) as country,
    count(*)::bigint as student_count
  from public.profiles
  where profiles.role = 'student'
    and profiles.status = 'active'
    and public.normalize_country_code(profiles.country) is not null
  group by public.normalize_country_code(profiles.country)
  order by student_count desc, country asc;
$$;

grant execute on function public.normalize_country_code(text) to authenticated;
grant execute on function public.get_student_country_counts() to authenticated;
