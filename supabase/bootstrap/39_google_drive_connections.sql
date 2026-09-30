create table if not exists public.google_drive_connections (user_id uuid primary key references public.profiles(id) on delete cascade, access_token_enc text not null, access_token_iv text not null, refresh_token_enc text, refresh_token_iv text, expires_at timestamptz, scope text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.google_drive_connections enable row level security;
revoke all on public.google_drive_connections from anon, authenticated;
grant all on public.google_drive_connections to service_role;
create index if not exists google_drive_connections_expires_at_idx on public.google_drive_connections (expires_at);
