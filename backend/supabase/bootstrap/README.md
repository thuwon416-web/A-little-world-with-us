# Bootstrap Migrations

Maintained Supabase schema/bootstrap definitions for **A Little World With Us**.

## Run order

Run this sequence only for a **fresh or disposable** database. `00_core.sql` is destructive and must never be used to update a production database with data.

| # | File | Purpose |
| --- | --- | --- |
| 00 | `00_core.sql` | Foundation schema, grants, RLS and security |
| 01–10 | Feature schema files | Chat, wellness, safety, finance, vault, AI, location, learning, memories and miscellaneous features |
| 11–14 | Compatibility/RPC files | SOS, admin roles and RPC functions |
| 15a–15b | Media/performance | Media MIME types and performance indexes |
| 16–22 | Feature hardening | Telegram import, location access, storage scope, realtime, push and call signaling |
| 23a–24a | Reliability/security | Idempotency, RLS/API hardening and couple invite RPCs |
| 25–30 | Security/scope hardening | RPC search paths, targeted indexes, RLS consolidation, location access and couple scope |
| 31 | Sync contract parity | Web ↔ Mobile message contract and Care RPC cleanup |
| 32 | Shared realtime | Realtime publication for shared Web ↔ Mobile features |
| 33 | SECURITY DEFINER hardening | Explicit search paths |
| 34 | FK covering indexes | Indexes for currently unindexed foreign keys; location-sharing scope is handled separately |
| 35 | RLS performance | Optimize `auth.uid()` evaluation without changing authorization semantics |
| 37 | Retention cleanup | 7-day location history and 30-day temporary AI-context cleanup |

## Existing databases

Do **not** rerun `00_core.sql`. Apply reviewed follow-on migrations individually, then verify schema, RLS, indexes and Supabase advisors.

The migration set is intended to preserve existing rows/data when applied as additive follow-ons.

## Retention

- `location_history`: automatically purged after 7 days.
- `ai_context_memory`: expires after 30 days and is purged daily.
- Memories, relationship memories, chat history and user media are not automatically deleted.

## Operational notes

- Keep VAPID private keys and cron secrets server-side.
- `22_call_media_signals.sql` requires a native Expo build for WebRTC; Expo Go is not sufficient.
- Never commit credentials or production secrets.
