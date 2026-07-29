create or replace function public.get_leaderboard_level(score_ratio numeric)
returns text
language sql
stable
as $$
  select case
    when score_ratio >= 0.90 then 'Relámpago'
    when score_ratio >= 0.75 then 'Rayo'
    when score_ratio >= 0.50 then 'Centella'
    else 'Chispa'
  end;
$$;
