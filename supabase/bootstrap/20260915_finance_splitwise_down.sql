begin;

drop table if exists public.settlements cascade;

alter table public.finance_expenses
  drop column if exists paid_by,
  drop column if exists split_type,
  drop column if exists split_with,
  drop column if exists split_percentage,
  drop column if exists is_settled,
  drop column if exists notes,
  drop column if exists updated_at;

commit;
