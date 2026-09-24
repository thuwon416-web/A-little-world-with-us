# Bootstrap Migrations

Master schema files for A Little World With Us.

## Run Order

Run in this order only when preparing a **fresh or disposable** database. `00_core.sql` drops and recreates the public schema; never use this sequence to update a database whose data must be kept.

| #   | File                           | Purpose                                                                  |
| --- | ------------------------------ | ------------------------------------------------------------------------ |
| 00  | `00_core.sql`                  | Foundation schema + grants + RLS + security                              |
| 01  | `01_chat.sql`                  | Messages parity + reactions/edit                                         |
| 02  | `02_wellness.sql`              | Wellness logs + entries                                                  |
| 03  | `03_safety.sql`                | Safety contacts, check-ins, geofence, battery                            |
| 04  | `04_finance.sql`               | Budgets, reminders, expenses, settlements                                |
| 05  | `05_vault.sql`                 | Vault items + credentials + call logs                                    |
| 06  | `06_ai.sql`                    | AI history, privacy, context, usage                                      |
| 07  | `07_location.sql`              | Memory location fields                                                   |
| 08  | `08_learning.sql`              | Korean lessons, vocab, quizzes                                           |
| 09  | `09_memories.sql`              | Relationship memories + metadata                                         |
| 10  | `10_misc.sql`                  | Playlist, calendar, wishlist, watch, telegram                            |
| 11  | `11_sos_constraint.sql`        | Allow SOS chat message type                                              |
| 12  | `12_admin_roles.sql`           | Role-based admin checks                                                  |
| 14  | `14_rpc_functions.sql`         | On This Day and memory statistics functions                              |
| 15a | `15_media_mime_types.sql`      | Media MIME type columns                                                  |
| 15b | `15_performance_indexes.sql`   | Query performance indexes                                                |
| 16  | `16_telegram_import.sql`       | Existing-database Telegram import table and couple-only RLS              |
| 17  | `17_pair_location_access.sql`  | Lets linked partners view shared location data when sharing is enabled   |
| 18  | `18_storage_pair_scope.sql`    | Restricts private media reads to the uploader and their accepted partner |
| 19  | `19_reminder_realtime.sql`     | Publishes shared reminder changes for device notification scheduling     |
| 20  | `20_call_signals_realtime.sql` | Publishes call state changes to the two call participants                |
| 21  | `21_web_reminder_push.sql`     | Saves browser push subscriptions and tracks sent web reminders            |
| 22  | `22_call_media_signals.sql`   | Adds protected WebRTC offer, answer, and ICE signaling data               |

## Warning

`00_core.sql` includes the **destructive reset**. Run on fresh/dev only.

## Original Files

The base schema and follow-on scripts above are the maintained bootstrap set. Older source migrations are preserved in **git history** — use:
git log --all -- supabase/bootstrap/
git show <commit>:supabase/bootstrap/<file>.sql

## How to Run

1. Supabase → SQL Editor
2. Confirm this is a fresh or disposable database, then paste `00_core.sql` → Run
3. Run the verification SELECTs included in each file
4. Repeat 01 → 10, then 11, 12, 14, 15a, 15b, 16, 17, 18, 19, 20, 21, and 22 in order
5. Verify the required tables, RLS policies, and media columns before deploying app code

## Updating an existing database

Do not rerun `00_core.sql` on an existing database. To resolve the missing `memories.mime_type` column, review and run `15_media_mime_types.sql` on its own. To enable Telegram archive import, run `16_telegram_import.sql` on its own. To let linked partners use the location page, review and run `17_pair_location_access.sql` on its own. To restrict private media reads to the uploader and their accepted partner, review and run `18_storage_pair_scope.sql` on its own. To synchronize scheduled phone reminders, review and run `19_reminder_realtime.sql` on its own. To synchronize call request states between the two participants, review and run `20_call_signals_realtime.sql` on its own. To enable browser push reminders, review and run `21_web_reminder_push.sql` on its own. To enable live mobile call media signaling, review and run `22_call_media_signals.sql` on its own. Configure browser push environment keys and a one-minute Supabase Cron job that calls `/api/cron/reminders` with `Authorization: Bearer <CRON_SECRET>`. Keep the private VAPID key and cron secret server-side only. These scripts are repeatable and preserve existing rows. The app reads `memories.mime_type`, `messages.media_mime_type`, and `time_capsule_attachments.mime_type`; the database column is named `mime_type`, not `memories_mime_type`.

### Browser Reminder Push Setup

1. Generate one VAPID key pair with `npx web-push generate-vapid-keys`.
2. Set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` as server-side production environment variables. Never expose the private key or cron secret to browser code.
3. Apply `21_web_reminder_push.sql` to the existing database.
4. In Supabase Cron, create a one-minute `GET` job for `https://<your-app-domain>/api/cron/reminders` and set the `Authorization` header to `Bearer <CRON_SECRET>`.
5. Deploy the app, sign in on each browser that should receive reminders, and select the browser notification permission button on the reminders page.

The browser must support push notifications and allow them. This setup is separate from mobile local notifications.

### Mobile Live Call Setup

Run `22_call_media_signals.sql` against the existing database, then create and install a new Expo development or production build. The WebRTC library contains native code and does not run in Expo Go. Calls use a public STUN server by default. For restrictive mobile networks, set `EXPO_PUBLIC_TURN_URLS`, `EXPO_PUBLIC_TURN_USERNAME`, and `EXPO_PUBLIC_TURN_CREDENTIAL` in `mobile/.env` before building. These values are bundled into the app, so use a TURN provider that issues short-lived credentials rather than a permanent server password.

---

## Role-Based Admin System (Added: Fix Phase 0)

The role-based admin system replaces hardcoded email checks with PostgreSQL settings.

### Setting Seed Values

Run these commands in Supabase SQL Editor before running `00_core.sql`:

```sql
-- Set admin seed email and UUID
ALTER DATABASE postgres SET app.admin_seed_email = 'your-admin@example.com';
ALTER DATABASE postgres SET app.admin_seed_uuid = 'your-admin-uuid-here';

-- Optional: Set partner seed email and UUID
ALTER DATABASE postgres SET app.partner_seed_email = 'your-partner@example.com';
ALTER DATABASE postgres SET app.partner_seed_uuid = 'your-partner-uuid-here';
```

### Finding User UUIDs

To find your user UUIDs:

```sql
SELECT id, email FROM auth.users WHERE email IN ('your-admin@example.com', 'your-partner@example.com');
```

### Resetting Settings

To clear seed settings:

```sql
ALTER DATABASE postgres RESET app.admin_seed_email;
ALTER DATABASE postgres RESET app.admin_seed_uuid;
ALTER DATABASE postgres RESET app.partner_seed_email;
ALTER DATABASE postgres RESET app.partner_seed_uuid;
```

### Migration

Run `12_admin_roles.sql` after the bootstrap scripts to enable the role-based admin system.
