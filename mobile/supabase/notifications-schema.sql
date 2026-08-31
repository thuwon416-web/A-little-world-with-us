create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text not null,
  scheduled_at timestamptz not null,
  repeat text not null default 'none' check (repeat in ('none', 'daily', 'weekly')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_id on public.user_notifications(user_id);
create index if not exists idx_user_notifications_scheduled_at on public.user_notifications(scheduled_at);
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_reminders_scheduled_at on public.reminders(scheduled_at);

alter table public.user_notifications enable row level security;
alter table public.reminders enable row level security;

create policy "Users can manage own notifications"
on public.user_notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own reminders"
on public.reminders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
