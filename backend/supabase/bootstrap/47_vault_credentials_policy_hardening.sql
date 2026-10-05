-- 47_vault_credentials_policy_hardening.sql
-- Prevent a shared vault credential from being mutated or deleted by the partner.
-- Apply after reviewing in staging. Additive/forward-only.

begin;

alter table public.vault_credentials enable row level security;

drop policy if exists vault_credentials_access on public.vault_credentials;
drop policy if exists vault_credentials_read on public.vault_credentials;
drop policy if exists vault_credentials_insert on public.vault_credentials;
drop policy if exists vault_credentials_update on public.vault_credentials;
drop policy if exists vault_credentials_delete on public.vault_credentials;

create policy vault_credentials_read
  on public.vault_credentials
  for select
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and (user_id = auth.uid() or is_shared = true)
  );

create policy vault_credentials_insert
  on public.vault_credentials
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id)
    and user_id = auth.uid()
  );

create policy vault_credentials_update
  on public.vault_credentials
  for update
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and user_id = auth.uid()
  )
  with check (
    public.is_couple_member(couple_id)
    and user_id = auth.uid()
  );

create policy vault_credentials_delete
  on public.vault_credentials
  for delete
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and user_id = auth.uid()
  );

commit;
