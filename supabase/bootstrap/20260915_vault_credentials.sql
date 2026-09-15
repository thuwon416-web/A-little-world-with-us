begin;

create table if not exists public.vault_credentials (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_shared boolean not null default false,
  encrypted_payload text not null,
  encryption_iv text not null,
  encryption_version integer not null default 1,
  category text not null default 'other',
  label text not null,
  website_url text,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_credentials_couple_created_idx
  on public.vault_credentials(couple_id, created_at desc);
create index if not exists vault_credentials_user_idx
  on public.vault_credentials(user_id);
create index if not exists vault_credentials_shared_idx
  on public.vault_credentials(couple_id, is_shared)
  where is_shared = true;

drop trigger if exists vault_credentials_touch on public.vault_credentials;
create trigger vault_credentials_touch
  before update on public.vault_credentials
  for each row execute function public.touch_updated_at();

alter table public.vault_credentials enable row level security;

drop policy if exists vault_credentials_access on public.vault_credentials;
create policy vault_credentials_access
  on public.vault_credentials
  for all
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and (user_id = auth.uid() or is_shared = true)
  )
  with check (
    public.is_couple_member(couple_id)
    and user_id = auth.uid()
  );

grant select, insert, update, delete on public.vault_credentials to authenticated;

commit;
