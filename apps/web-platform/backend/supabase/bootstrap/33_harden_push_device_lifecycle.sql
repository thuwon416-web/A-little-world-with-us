-- Push-device lifecycle hardening: track freshness and allow invalidation without exposing subscriptions to anon.

alter table public.push_devices
  add column if not exists last_seen timestamptz;

alter table public.push_devices
  add column if not exists invalidated boolean not null default false;

alter table public.web_push_subscriptions
  add column if not exists last_seen timestamptz;

alter table public.web_push_subscriptions
  add column if not exists invalidated boolean not null default false;

create index if not exists push_devices_active_idx
  on public.push_devices(user_id)
  where invalidated = false;

create index if not exists web_push_subscriptions_active_idx
  on public.web_push_subscriptions(user_id)
  where invalidated = false;

update public.push_devices
set last_seen = coalesce(last_seen, updated_at),
    invalidated = coalesce(invalidated, false);

update public.web_push_subscriptions
set last_seen = coalesce(last_seen, updated_at),
    invalidated = coalesce(invalidated, false);

revoke all on table public.push_devices from anon;
revoke all on table public.web_push_subscriptions from anon;
grant select, insert, update, delete on public.push_devices to authenticated;
grant select, insert, update, delete on public.web_push_subscriptions to authenticated;

