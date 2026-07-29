create or replace function public.get_leaderboard_level(score_ratio numeric)
returns text
language sql
stable
as $$
  select case
    when score_ratio >= 0.90 then 'Tormenta'
    when score_ratio >= 0.80 then 'Huracán'
    when score_ratio >= 0.75 then 'Centella'
    when score_ratio >= 0.50 then 'Rayo'
    else 'Chispa'
  end;
$$;
