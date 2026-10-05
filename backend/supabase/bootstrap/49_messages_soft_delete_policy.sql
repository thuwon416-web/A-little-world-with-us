-- 49_messages_soft_delete_policy.sql
-- Prevent a couple member from hard-deleting the partner's message.
-- Messages already support deleted_at soft deletion through the sync contract.
-- Apply after reviewing in staging.

begin;

alter table public.messages enable row level security;

drop policy if exists messages_couple_delete on public.messages;
create policy messages_sender_delete
  on public.messages
  for delete
  to authenticated
  using (
    public.is_couple_member(couple_id)
    and sender_id = auth.uid()
  );

commit;
