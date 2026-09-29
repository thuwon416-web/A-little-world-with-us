# Bootstrap Migrations

Master schema files for A Little World With Us.

## Run Order

Run this sequence only when preparing a **fresh or disposable** database. `00_core.sql` drops and recreates the public schema; never use it to update a database whose data must be kept.

| # | File | Purpose |
| --- | --- | --- |
| 00 | `00_core.sql` | Foundation schema + grants + RLS + security |
| 01 | `01_chat.sql` | Messages parity + reactions/edit |
| 02 | `02_wellness.sql` | Wellness logs + entries |
| 03 | `03_safety.sql` | Safety contacts, check-ins, geofence, battery |
| 04 | `04_finance.sql` | Budgets, reminders, expenses, settlements |
| 05 | `05_vault.sql` | Vault items + credentials + call logs |
| 06 | `06_ai.sql` | AI history, privacy, context, usage |
| 07 | `07_location.sql` | Memory location fields |
| 08 | `08_learning.sql` | Korean lessons, vocab, quizzes |
| 09 | `09_memories.sql` | Relationship memories + metadata |
| 10 | `10_misc.sql` | Playlist, calendar, wishlist, watch, telegram |
| 11 | `11_sos_constraint.sql` | Allow SOS chat message type |
| 12 | `12_admin_roles.sql` | Role-based admin checks |
| 14 | `14_rpc_functions.sql` | On This Day and memory statistics functions |
| 15a | `15_media_mime_types.sql` | Media MIME type columns |
| 15b | `15_performance_indexes.sql` | Query performance indexes |
| 16 | `16_telegram_import.sql` | Existing-database Telegram import table and couple-only RLS |
| 17 | `17_pair_location_access.sql` | Linked-partner shared location access |
| 18 | `18_storage_pair_scope.sql` | Private media access scoped to uploader/accepted partner |
| 19 | `19_reminder_realtime.sql` | Shared reminder realtime publication |
| 20 | `20_call_signals_realtime.sql` | Call state realtime publication |
| 21 | `21_web_reminder_push.sql` | Browser push subscriptions/reminder tracking |
| 22 | `22_call_media_signals.sql` | Protected WebRTC signaling data |
| 23a | `23_reliability_security_hardening.sql` | Reliability idempotency + RLS/API hardening |
| 24a | `24_couple_invite_rpc.sql` | Couple invite RPCs |
| 25 | `25_security_hardening.sql` | Harden legacy RPC execution/search path |
| 26 | `26_targeted_performance_indexes.sql` | Targeted high-value lookup indexes |
| 27 | `27_consolidate_permissive_policies.sql` | Consolidate redundant permissive RLS policies |
| 28 | `28_couple_only_location_access.sql` | Remove legacy admin bypass from shared location RLS |
| 29 | `29_single_couple_scope.sql` | Enforce a single private couple at the invite boundary |
| 30 | `30_remove_location_admin_helper.sql` | Remove retired location-admin RLS helper |
| 31 | `31_sync_contract_parity.sql` | Restore Web ↔ Mobile message fields and remove ambiguous Care RPC overload |
| 32 | `32_enable_shared_feature_realtime.sql` | Enable Realtime publication for shared Web ↔ Mobile feature tables |
| 33 | `33_harden_security_definer_search_path.sql` | Harden SECURITY DEFINER helper search paths |
| 34 | `34_add_fk_covering_indexes.sql` | Add covering indexes for currently unindexed foreign keys (excluding location-sharing scope) |
| 35 | `35_optimize_rls_auth_initplan.sql` | Optimize auth.uid() evaluation in RLS policies without changing authorization semantics |

## Warning

`00_core.sql` includes the **destructive reset**. Run on fresh/dev only.

## Original Files

The bootstrap set is the maintained schema source. Older source migrations are preserved in git history:
`git log --all -- supabase/bootstrap/`
`git show <commit>:supabase/bootstrap/<file>.sql`

## Updating an Existing Database

Do **not** rerun `00_core.sql` on an existing production database. Review and apply follow-on scripts individually. Scripts 15a–34 are intended to be repeatable and preserve existing rows.

For browser reminder push, keep VAPID private keys and the cron secret server-side only. For mobile live calls, `22_call_media_signals.sql` requires a native Expo build; WebRTC does not run in Expo Go.

## Role-Based Admin System

The role-based admin system replaces hardcoded email checks with PostgreSQL settings. Never commit real credentials or production secrets.

## Production Safety

Production schema changes should use a reviewed follow-on migration and then verify the affected schema/RLS/advisors. Never use the destructive bootstrap sequence on a database containing real user data.
