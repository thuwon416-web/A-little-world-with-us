-- Targeted production indexes for high-frequency couple/RLS lookups.
-- Keep this migration narrow: do not blanket-index every foreign key.

create index if not exists couple_links_couple_id_idx
  on public.couple_links (couple_id);

create index if not exists couple_links_inviter_status_idx
  on public.couple_links (inviter_id, status);

create index if not exists couple_links_accepted_by_status_idx
  on public.couple_links (accepted_by, status)
  where accepted_by is not null;

create index if not exists profiles_lower_email_idx
  on public.profiles (lower(email));
