-- Release 2: private voice transcripts and shared occasion dates.
-- Run once after 20260111_reset_and_bootstrap.sql and 20260909_f1_f6_schema_upgrade.sql.
begin;

alter table public.messages add column if not exists transcript text;

create table if not exists public.couple_occasions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  kind text not null default 'custom' check (kind in ('anniversary','birthday','custom')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, kind, title)
);
drop trigger if exists couple_occasions_touch on public.couple_occasions;
create trigger couple_occasions_touch before update on public.couple_occasions for each row execute function public.touch_updated_at();
alter table public.couple_occasions enable row level security;
drop policy if exists couple_occasions_couple_access on public.couple_occasions;
create policy couple_occasions_couple_access on public.couple_occasions for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
grant select, insert, update, delete on public.couple_occasions to authenticated;

insert into public.couple_occasions (couple_id, title, month, day, kind)
select id, 'Our anniversary', extract(month from anniversary)::smallint, extract(day from anniversary)::smallint, 'anniversary'
from public.couples
where anniversary is not null
on conflict (couple_id, kind, title) do update set month = excluded.month, day = excluded.day;

commit;
select 'Release 2 schema upgrade complete' as status;
