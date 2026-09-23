# Bootstrap Migrations

Master schema files for A Little World With Us.

## Run Order

Run in this order only when preparing a **fresh or disposable** database. `00_core.sql` drops and recreates the public schema; never use this sequence to update a database whose data must be kept.

| # | File | Purpose |
|---|------|---------|
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
4. Repeat 01 → 10, then 11, 12, 14, 15a, 15b, and 16 in order
5. Verify the required tables, RLS policies, and media columns before deploying app code

## Updating an existing database

Do not rerun `00_core.sql` on an existing database. To resolve the missing `memories.mime_type` column, review and run `15_media_mime_types.sql` on its own. To enable Telegram archive import, run `16_telegram_import.sql` on its own. Both scripts are repeatable and preserve existing rows. The app reads `memories.mime_type`, `messages.media_mime_type`, and `time_capsule_attachments.mime_type`; the database column is named `mime_type`, not `memories_mime_type`.

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
