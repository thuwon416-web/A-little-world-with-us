-- 53_final_security_policy_hardening.sql
-- Forward-only production hardening applied after the account/storage remediation.
-- This is safe to re-run because policies are recreated idempotently.

begin;

alter table public.location_address_cache enable row level security;
revoke all on public.location_address_cache from anon, authenticated;
grant all on public.location_address_cache to service_role;
drop policy if exists service_role_only on public.location_address_cache;
create policy service_role_only
  on public.location_address_cache
  for all
  to service_role
  using (false)
  with check (false);

alter table public.messages enable row level security;
drop policy if exists messages_couple_delete on public.messages;
drop policy if exists messages_sender_delete on public.messages;
create policy messages_sender_delete
  on public.messages
  for delete
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and sender_id = auth.uid()
  );

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
