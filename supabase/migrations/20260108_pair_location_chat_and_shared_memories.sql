-- Final pair-scoped policies and data contracts for location, shared memories,
-- and one-time location messages.
create extension if not exists pgcrypto;

create or replace function public.is_location_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles
  where id = auth.uid() and email = 'thuwon416@gmail.com' and role = 'admin'
) $$;

drop policy if exists "Location admin reads latest locations" on public.user_locations;
create policy "Location admin reads linked pair latest locations" on public.user_locations
  for select using (
    public.is_location_admin()
    and exists (
      select 1 from public.couple_links cl
      where cl.couple_id = user_locations.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

drop policy if exists "Location admin reads history" on public.location_history;
create policy "Location admin reads linked pair history" on public.location_history
  for select using (
    public.is_location_admin()
    and exists (
      select 1 from public.couple_links cl
      where cl.couple_id = location_history.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

drop policy if exists "Location admin reads linked profiles" on public.profiles;
create policy "Location admin reads linked profiles" on public.profiles
  for select using (
    public.is_location_admin()
    and exists (
      select 1 from public.couple_links cl
      where cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
        and (profiles.id = cl.inviter_id or profiles.id = cl.accepted_by)
    )
  );

alter table public.messages add column if not exists message_type text not null default 'text';
alter table public.messages add column if not exists location_payload jsonb;
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text', 'voice', 'photo', 'sticker', 'gif', 'file', 'video', 'audio', 'location'));

alter table public.memories add column if not exists date date;
alter table public.memories add column if not exists category text not null default 'favorite';
alter table public.memories add column if not exists image_url text;
alter table public.memories add column if not exists caption text;
update public.memories set date = created_at::date where date is null;
update public.memories set category = 'favorite' where category is null;

drop policy if exists "memories_update_own_records" on public.memories;
drop policy if exists "memories_delete_own_records" on public.memories;
create policy "memories_update_by_accepted_couple" on public.memories for update
using (exists (select 1 from public.couple_links cl where cl.id = memories.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())))
with check (exists (select 1 from public.couple_links cl where cl.id = memories.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())));
create policy "memories_delete_by_accepted_couple" on public.memories for delete
using (exists (select 1 from public.couple_links cl where cl.id = memories.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())));

-- Enable in Supabase Cron once: select cron.schedule('purge-location-history', '15 3 * * *', $$delete from public.location_history where captured_at < now() - interval '7 days'$$);
