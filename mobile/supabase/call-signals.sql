create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('audio', 'video')),
  status text not null check (status in ('calling', 'ringing', 'in_call', 'ended', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_call_signals_receiver on public.call_signals(receiver_id, created_at desc);
create index if not exists idx_call_signals_caller on public.call_signals(caller_id, created_at desc);

alter table public.call_signals enable row level security;

create policy "Linked couple can create call signals"
on public.call_signals
for insert
with check (
  auth.uid() = caller_id
  and exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and ((cl.inviter_id = auth.uid() and cl.accepted_by = call_signals.receiver_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = call_signals.receiver_id))
  )
);

create policy "Linked couple can view call signals"
on public.call_signals
for select
using (
  auth.uid() = caller_id
  or auth.uid() = receiver_id
  or exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and ((cl.inviter_id = auth.uid() and cl.accepted_by = call_signals.caller_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = call_signals.caller_id)
        or (cl.inviter_id = auth.uid() and cl.accepted_by = call_signals.receiver_id)
        or (cl.accepted_by = auth.uid() and cl.inviter_id = call_signals.receiver_id))
  )
);

create policy "Linked couple can update call signals"
on public.call_signals
for update
using (
  auth.uid() = caller_id or auth.uid() = receiver_id
)
with check (
  auth.uid() = caller_id or auth.uid() = receiver_id
);

