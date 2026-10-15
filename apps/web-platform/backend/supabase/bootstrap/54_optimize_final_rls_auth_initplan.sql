-- 54_optimize_final_rls_auth_initplan.sql
-- Keep authorization semantics unchanged while evaluating auth.uid() once per statement.
drop policy if exists messages_sender_delete on public.messages;
create policy messages_sender_delete
  on public.messages
  for delete
  to authenticated
  using (public.is_couple_member(couple_id) and sender_id = (select auth.uid()));

drop policy if exists vault_credentials_delete on public.vault_credentials;
create policy vault_credentials_delete
  on public.vault_credentials
  for delete
  to authenticated
  using (public.is_couple_member(couple_id) and user_id = (select auth.uid()));

drop policy if exists vault_credentials_insert on public.vault_credentials;
create policy vault_credentials_insert
  on public.vault_credentials
  for insert
  to authenticated
  with check (public.is_couple_member(couple_id) and user_id = (select auth.uid()));

drop policy if exists vault_credentials_read on public.vault_credentials;
create policy vault_credentials_read
  on public.vault_credentials
  for select
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and (user_id = (select auth.uid()) or is_shared = true)
  );

drop policy if exists vault_credentials_update on public.vault_credentials;
create policy vault_credentials_update
  on public.vault_credentials
  for update
  to authenticated
  using (public.is_couple_member(couple_id) and user_id = (select auth.uid()))
  with check (public.is_couple_member(couple_id) and user_id = (select auth.uid()));
