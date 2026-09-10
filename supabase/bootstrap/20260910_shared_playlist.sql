-- Phase 8, step 1: a private YouTube playlist shared by the two members of a couple.
begin;

create table if not exists public.shared_playlist (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'youtube' check (provider in ('youtube', 'spotify', 'upload', 'local')),
  external_id text not null check (char_length(external_id) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200),
  artist text check (artist is null or char_length(artist) between 1 and 200),
  album text check (album is null or char_length(album) between 1 and 200),
  thumbnail_url text,
  source_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  why_added text check (why_added is null or char_length(why_added) between 0 and 1000),
  position integer not null default 0,
  is_anniversary_song boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, provider, external_id)
);

comment on table public.shared_playlist is 'YouTube tracks shared privately by members of a couple.';
comment on column public.shared_playlist.external_id is 'Provider identifier; for YouTube this is the canonical video ID.';
comment on column public.shared_playlist.why_added is 'Optional note explaining why the song was added.';

create index if not exists shared_playlist_couple_position_idx
  on public.shared_playlist (couple_id, position, created_at);
create index if not exists shared_playlist_added_by_idx
  on public.shared_playlist (added_by);

drop trigger if exists shared_playlist_touch on public.shared_playlist;
create trigger shared_playlist_touch
  before update on public.shared_playlist
  for each row execute function public.touch_updated_at();

alter table public.shared_playlist enable row level security;
drop policy if exists shared_playlist_couple_access on public.shared_playlist;
create policy shared_playlist_couple_access
  on public.shared_playlist
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

grant select, insert, update, delete on public.shared_playlist to authenticated;

commit;
