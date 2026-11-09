begin;

-- The account deletion status API and erasure cron use the server-only
-- service_role client. Keep direct user access governed by the existing RLS
-- policies while allowing the trusted server to read and mark queue rows.
grant select, update on table public.account_deletion_requests to service_role;

commit;
