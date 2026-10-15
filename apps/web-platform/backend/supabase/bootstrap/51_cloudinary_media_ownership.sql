-- Shared media metadata for Cloudinary-backed assets.
-- Safe to run after the account-deletion/shared-ownership migration.

alter table public.memories
  drop constraint if exists memories_storage_provider_check;

alter table public.memories
  add constraint memories_storage_provider_check
  check (storage_provider in ('supabase', 'google_drive', 'cloudinary'));

alter table public.memories
  add column if not exists cloudinary_asset_id text,
  add column if not exists cloudinary_public_id text,
  add column if not exists storage_url text,
  add column if not exists thumbnail_url text,
  add column if not exists size_bytes bigint,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric;

create unique index if not exists memories_cloudinary_asset_id_idx
  on public.memories (cloudinary_asset_id)
  where cloudinary_asset_id is not null;

create index if not exists memories_storage_provider_idx
  on public.memories (storage_provider);
