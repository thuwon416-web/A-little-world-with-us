-- Large-media storage metadata for the Backblaze B2 tier.
alter table public.memories add column if not exists b2_file_id text;
alter table public.memories add column if not exists b2_file_name text;
alter table public.memories add column if not exists b2_bucket_name text;

alter table public.messages add column if not exists media_storage_provider text;
alter table public.messages add column if not exists media_storage_path text;
alter table public.messages add column if not exists media_storage_file_id text;
alter table public.messages add column if not exists media_size_bytes bigint;

alter table public.messages drop constraint if exists messages_media_storage_provider_check;
alter table public.messages add constraint messages_media_storage_provider_check
  check (media_storage_provider is null or media_storage_provider in ('supabase','backblaze_b2','cloudinary','google_drive'));

create index if not exists messages_media_storage_provider_idx
  on public.messages(media_storage_provider)
  where media_storage_provider is not null;

create index if not exists memories_b2_file_id_idx
  on public.memories(b2_file_id)
  where b2_file_id is not null;
