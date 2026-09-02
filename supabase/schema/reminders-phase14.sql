-- Create reminders table
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id),
  title text not null,
  description text,
  reminder_date date not null,
  reminder_type text not null check (reminder_type in ('custom', 'anniversary', 'birthday', 'cycle', 'medication')),
  repeat_interval text check (repeat_interval in ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  notified boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_user_id on reminders(user_id);
create index if not exists idx_reminders_reminder_date on reminders(reminder_date);

alter table reminders enable row level security;

create policy "Users can view own reminders" on reminders
  for select using (user_id = auth.uid());

create policy "Linked partners can view each other's reminders" on reminders
  for select using (
    couple_id is not null
    and exists (
      select 1 from public.couple_links cl
      where cl.id = reminders.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Users can insert own reminders" on reminders
  for insert with check (user_id = auth.uid());
