-- A couple-scoped, deliberately narrow update path for shared period selection.
-- Daily Care notes remain protected by their owner policy; this function can only
-- change period_day after confirming that the caller belongs to the couple.
create or replace function public.save_care_period_dates(
  target_couple_id uuid,
  selected_dates date[]
)
returns table(log_date date, period_day boolean)
language plpgsql security definer set search_path = public
as $$
declare normalized_dates date[];
begin
  if auth.uid() is null or not public.is_couple_member(target_couple_id) then
    raise exception 'You must be an accepted member of this couple.' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct value order by value), '{}'::date[]) into normalized_dates
    from unnest(coalesce(selected_dates, '{}'::date[])) as value;
  update public.care_daily_logs set period_day = false, updated_by = auth.uid(), updated_at = now()
    where couple_id = target_couple_id and period_day = true and not (log_date = any(normalized_dates));
  insert into public.care_daily_logs (couple_id, user_id, log_date, period_day, created_by, updated_by, updated_at)
    select target_couple_id, auth.uid(), value, true, auth.uid(), auth.uid(), now() from unnest(normalized_dates) as value
  on conflict (couple_id, log_date) do update set period_day = true, updated_by = auth.uid(), updated_at = now();
  return query select log.log_date, log.period_day from public.care_daily_logs as log
    where log.couple_id = target_couple_id and log.period_day = true order by log.log_date;
end;
$$;
revoke all on function public.save_care_period_dates(uuid, date[]) from public, anon;
grant execute on function public.save_care_period_dates(uuid, date[]) to authenticated;
