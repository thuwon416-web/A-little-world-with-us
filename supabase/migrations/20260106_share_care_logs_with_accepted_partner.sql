-- Care logs belong to an accepted couple. Either linked account can see and
-- correct a shared log; there is deliberately no per-entry share toggle.
drop policy if exists "Users can view own care logs" on public.care_daily_logs;
drop policy if exists "Users can insert own care logs" on public.care_daily_logs;
drop policy if exists "Users can update own care logs" on public.care_daily_logs;
drop policy if exists "Partners can view each other's care logs" on public.care_daily_logs;
drop policy if exists "Accepted couples can view care logs" on public.care_daily_logs;
drop policy if exists "Owners can insert care logs" on public.care_daily_logs;
drop policy if exists "Accepted couples can update care logs" on public.care_daily_logs;

create policy "Accepted couples can view care logs"
on public.care_daily_logs for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and (
        (cl.id = care_daily_logs.couple_id and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid()))
        or (cl.inviter_id = auth.uid() and cl.accepted_by = care_daily_logs.user_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = care_daily_logs.user_id)
      )
  )
);

create policy "Owners can insert care logs"
on public.care_daily_logs for insert
with check (auth.uid() = user_id);

create policy "Accepted couples can update care logs"
on public.care_daily_logs for update
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and (
        (cl.id = care_daily_logs.couple_id and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid()))
        or (cl.inviter_id = auth.uid() and cl.accepted_by = care_daily_logs.user_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = care_daily_logs.user_id)
      )
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and (
        (cl.id = care_daily_logs.couple_id and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid()))
        or (cl.inviter_id = auth.uid() and cl.accepted_by = care_daily_logs.user_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = care_daily_logs.user_id)
      )
  )
);
