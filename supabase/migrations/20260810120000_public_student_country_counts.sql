-- The landing map carried a hardcoded country list because the counting
-- function was granted to authenticated only, so an anonymous visitor could not
-- call it. The list then aged: it read 168 people where the database held 184,
-- and the same map inside the app showed the real number.
--
-- The function is security definer and returns nothing but a country code and a
-- headcount — no profile, no name, no identifier — and that aggregate is
-- already public on the landing today. Granting it to anon lets both maps read
-- the same source, which is the only way they stay in agreement.

grant execute on function public.get_student_country_counts() to anon;
