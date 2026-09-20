# Bootstrap Migrations

Master schema files for A Little World With Us.

## Run Order

Run in this order on a **fresh/dev** database:

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

## Warning

`00_core.sql` includes the **destructive reset**. Run on fresh/dev only.

## Original Files

The 45 original migrations were consolidated into the 11 files above.
Originals are preserved in **git history** only — use:
  git log --all -- supabase/bootstrap/
  git show <commit>:supabase/bootstrap/<file>.sql

## How to Run

1. Supabase → SQL Editor
2. Paste `00_core.sql` → Run
3. Run the verification SELECTs included in each file
4. Repeat 01 → 10 in order
5. Verify schema after all 11 (see docs/manual-queue.md)

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
