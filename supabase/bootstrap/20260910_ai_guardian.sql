begin;

create table if not exists public.ai_privacy_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  allow_ai_read_mood boolean not null default false,
  allow_ai_read_cycle boolean not null default false,
  allow_ai_read_chat boolean not null default false,
  allow_ai_read_location boolean not null default false,
  allow_ai_read_finance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists ai_privacy_settings_touch on public.ai_privacy_settings;
create trigger ai_privacy_settings_touch
before update on public.ai_privacy_settings
for each row execute function public.touch_updated_at();

alter table public.ai_privacy_settings enable row level security;

drop policy if exists ai_privacy_settings_own_access on public.ai_privacy_settings;
create policy ai_privacy_settings_own_access
on public.ai_privacy_settings
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.ai_privacy_settings to authenticated;

commit;
