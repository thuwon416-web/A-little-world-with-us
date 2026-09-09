-- F1-F6 live-project upgrade. Run this ONCE after 20260111_reset_and_bootstrap.sql.
-- It is additive and does not reset accounts or shared data.
begin;

alter table public.time_capsules add column if not exists recipient_id uuid references public.profiles(id) on delete cascade;
alter table public.time_capsules add column if not exists status text not null default 'scheduled' check (status in ('scheduled','revealed','cancelled'));
alter table public.time_capsules add column if not exists revealed_at timestamptz;
alter table public.time_capsules add column if not exists cancelled_at timestamptz;
alter table public.time_capsules add column if not exists updated_at timestamptz not null default now();
update public.time_capsules set content = coalesce(content, '') where content is null;
alter table public.time_capsules alter column content set not null;

update public.time_capsules c
set recipient_id = case when cl.inviter_id = c.user_id then cl.accepted_by else cl.inviter_id end
from public.couple_links cl
where cl.couple_id = c.couple_id and cl.status = 'accepted' and c.recipient_id is null;

alter table public.time_capsules alter column recipient_id set not null;
create index if not exists time_capsules_recipient_unlock_idx on public.time_capsules(recipient_id, unlock_at);
drop trigger if exists time_capsules_touch on public.time_capsules;
create trigger time_capsules_touch before update on public.time_capsules for each row execute function public.touch_updated_at();

create table if not exists public.time_capsule_attachments (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.time_capsules(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','file')),
  created_at timestamptz not null default now()
);
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ready' check (status in ('ready','failed')),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);

alter table public.time_capsules enable row level security;
drop policy if exists time_capsules_couple_access on public.time_capsules;
create policy time_capsules_creator_manage on public.time_capsules for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy time_capsules_recipient_read_revealed on public.time_capsules for select using (recipient_id = auth.uid() and status = 'revealed' and unlock_at <= now());
alter table public.time_capsule_attachments enable row level security;
create policy time_capsule_attachments_creator_access on public.time_capsule_attachments for all using (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.user_id = auth.uid())) with check (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.user_id = auth.uid()));
create policy time_capsule_attachments_recipient_read on public.time_capsule_attachments for select using (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.recipient_id = auth.uid() and c.status = 'revealed' and c.unlock_at <= now()));
alter table public.export_jobs enable row level security;
create policy export_jobs_own_access on public.export_jobs for all using (requested_by = auth.uid() and public.is_couple_member(couple_id)) with check (requested_by = auth.uid() and public.is_couple_member(couple_id));

insert into storage.buckets (id, name, public) values ('surprises','surprises',false) on conflict (id) do update set public = false;
drop policy if exists surprise_media_creator_access on storage.objects;
drop policy if exists surprise_media_recipient_read on storage.objects;
create policy surprise_media_creator_access on storage.objects for all using (bucket_id = 'surprises' and owner = auth.uid()) with check (bucket_id = 'surprises' and owner = auth.uid() and public.has_accepted_couple());
create policy surprise_media_recipient_read on storage.objects for select using (bucket_id = 'surprises' and exists (select 1 from public.time_capsule_attachments a join public.time_capsules c on c.id = a.capsule_id where a.storage_path = name and c.recipient_id = auth.uid() and c.status = 'revealed' and c.unlock_at <= now()));
grant select, insert, update, delete on public.time_capsules, public.time_capsule_attachments, public.export_jobs to authenticated;
commit;

select 'F1-F6 schema upgrade complete' as status;
