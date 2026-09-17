# Manual Queue — A Little World With Us

Master checklist. Run in order during deploy.

## 1. SQL Bootstrap (Supabase SQL Editor)

Run in **exact order** on a fresh database:

| ID | File | Purpose | Status |
|----|------|---------|--------|
| M-SQL-00 | `supabase/bootstrap/00_core.sql` | Foundation, grants, RLS, and security | ⏸️ |
| M-SQL-01 | `supabase/bootstrap/01_chat.sql` | Messages parity, reactions, and edits | ⏸️ |
| M-SQL-02 | `supabase/bootstrap/02_wellness.sql` | Wellness logs and entries | ⏸️ |
| M-SQL-03 | `supabase/bootstrap/03_safety.sql` | Safety contacts, check-ins, geofence, and battery | ⏸️ |
| M-SQL-04 | `supabase/bootstrap/04_finance.sql` | Budgets, reminders, expenses, and settlements | ⏸️ |
| M-SQL-05 | `supabase/bootstrap/05_vault.sql` | Vault items, credentials, and call logs | ⏸️ |
| M-SQL-06 | `supabase/bootstrap/06_ai.sql` | AI history, privacy, context, and usage | ⏸️ |
| M-SQL-07 | `supabase/bootstrap/07_location.sql` | Memory locations and location metadata | ⏸️ |
| M-SQL-08 | `supabase/bootstrap/08_learning.sql` | Korean lessons, vocabulary, and quizzes | ⏸️ |
| M-SQL-09 | `supabase/bootstrap/09_memories.sql` | Relationship memories | ⏸️ |
| M-SQL-10 | `supabase/bootstrap/10_misc.sql` | Playlist, calendar, wishlist, and Telegram features | ⏸️ |
| **M-SQL-11** | **`supabase/bootstrap/11_sos_constraint.sql`** | **Adds `sos` to `messages.message_type` (Stage 4a-fix)** | ⏸️ |

**Warning:** `00_core.sql` includes destructive reset operations. Run on a fresh or disposable development database only.

## 2. Edge Functions (Supabase Deploy)

```bash
supabase link --project-ref mktfnwdvzbdrxfcvnolp
supabase functions deploy check-geofence
supabase functions deploy check-battery
supabase functions deploy check-missed-checkin
supabase functions deploy checkin-notify
supabase functions deploy sos-resolved
supabase functions deploy location-alerts
supabase functions deploy reverse-geocode
supabase functions deploy reveal-surprises
```

| ID | Function | Notes | Status |
|----|----------|-------|--------|
| M-EDGE-1 | `check-geofence` | New/updated Phase 21.2a | ⏸️ |
| M-EDGE-2 | `check-battery` | Updated Phase 21.3a | ⏸️ |
| M-EDGE-3 | `check-missed-checkin` | New Phase 21.4 | ⏸️ |
| M-EDGE-4 | `checkin-notify` | Existing function | ⏸️ |
| M-EDGE-5 | `sos-resolved` | Existing function | ⏸️ |
| M-EDGE-6 | `location-alerts` | Existing function | ⏸️ |
| M-EDGE-7 | `reverse-geocode` | Existing function | ⏸️ |
| M-EDGE-8 | `reveal-surprises` | Existing function | ⏸️ |

## 3. pg_cron Migration (Vercel → Supabase)

**Context:** Move the three frequent safety schedules from Vercel to Supabase `pg_cron`; verify that only one scheduler remains.

### 3.1 Enable extensions and store secrets

Run after the bootstrap is available:

```sql
create extension if not exists pg_net;
create extension if not exists pg_cron;

select vault.create_secret('https://mktfnwdvzbdrxfcvnolp.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET_VALUE>', 'cron_secret');
```

Store the real `CRON_SECRET` in the approved secret store. Never commit it.

### 3.2 Schedule the three jobs

Use `vault.decrypted_secrets` for the project URL and bearer secret:

```sql
select cron.schedule('check-geofence', '*/5 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/api/cron/check-geofence',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$job$);

select cron.schedule('check-battery', '*/15 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/api/cron/check-battery',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$job$);

select cron.schedule('check-missed-checkin', '*/5 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/api/cron/check-missed-checkin',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$job$);
```

### 3.3 Remove Vercel schedules

After pg_cron jobs are confirmed healthy, remove the `crons` array from `vercel.json`, commit, push, and redeploy. Confirm there are no duplicate Vercel and pg_cron schedules.

Vercel Hobby limit was the reason for migration. pg_cron verified working 2026-09-17.

| ID | Task | Status |
|----|------|--------|
| M-PGCRON-1 | Enable `pg_cron` and `pg_net` | ✅ |
| M-PGCRON-2 | Add `project_url` and `cron_secret` to Supabase Vault | ✅ |
| M-PGCRON-3 | Schedule geofence, battery, and missed-checkin jobs | ✅ |
| M-PGCRON-4 | Remove the three Vercel cron entries | 🔴 |
| M-PGCRON-5 | Verify no duplicate scheduling and inspect `cron.job_run_details` | ⏸️ |

## 4. Environment Variables

### 4.1 Vercel (Web)

| Variable | Source/requirement | Status |
|----------|--------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API settings | ⏸️ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project API settings | ⏸️ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project API settings; secret | ⏸️ |
| `RELATIONSHIP_MEMORIES_COUPLE_ID` | Production couple UUID | ⏸️ |
| `NEXT_PUBLIC_APP_NAME` | Fixed app value | ⏸️ |
| `NEXT_PUBLIC_APP_URL` | Production URL | ⏸️ |
| `NEXT_PUBLIC_ANNIVERSARY` | Fixed app value | ⏸️ |
| `CRON_SECRET` | Generate a 32+ character secret | ⏸️ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis; required for production rate limiting | ⏸️ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis secret | ⏸️ |
| `GEMINI_API_KEY` | Optional AI provider | ⏸️ |
| `OPENROUTER_API_KEY` | Optional AI provider | ⏸️ |
| `HUGGINGFACE_API_KEY` | Optional AI provider | ⏸️ |
| `NVIDIA_API_KEY` | Optional AI provider | ⏸️ |
| `CEREBRAS_API_KEY` | Optional AI provider | ⏸️ |
| `MISTRAL_API_KEY` | Optional AI provider | ⏸️ |
| `COHERE_API_KEY` | Optional AI provider | ⏸️ |
| `GROQ_API_KEY` | Required for voice transcription; also an AI fallback | ⏸️ |
| `CLOUDFLARE_API_KEY` | Required only when Cloudflare AI fallback is enabled | ⏸️ |
| `CLOUDFLARE_ACCOUNT_ID` | Required with Cloudflare AI fallback | ⏸️ |
| `NEXT_PUBLIC_GIPHY_API_KEY` | GIPHY chat integration | ⏸️ |
| `SENTRY_DSN` | Optional server monitoring | ⏸️ |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional client monitoring | ⏸️ |
| `SENTRY_ORG` | Required for source-map upload | ⏸️ |
| `SENTRY_PROJECT` | Required for source-map upload | ⏸️ |
| `SENTRY_AUTH_TOKEN` | Required for source-map upload; secret | ⏸️ |
| `NEXT_PUBLIC_CARTO_TILE_URL` | Web map tiles | ⏸️ |
| `EXPO_PUBLIC_CARTO_STYLE_URL` | Shared/mobile map style configuration | ⏸️ |

At least one AI provider key must be configured; configure Cloudflare account ID together with its API key when that provider is enabled.

### 4.2 Mobile (`mobile/.env.local`)

| Variable | Source/requirement | Status |
|----------|--------------------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Same Supabase project as Web | ⏸️ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same Supabase project as Web | ⏸️ |
| `EXPO_PUBLIC_GIPHY_API_KEY` | GIPHY chat integration | ⏸️ |
| `EXPO_PUBLIC_APP_NAME` | Fixed app value | ⏸️ |
| `EXPO_PUBLIC_APP_VERSION` | Release version | ⏸️ |
| `EXPO_PUBLIC_CARTO_STYLE_URL` | Mobile map style | ⏸️ |

## 5. Storage Buckets

Verify each bucket exists and that RLS/policies allow only couple-scoped access:

| ID | Bucket | Used by | Verification | Status |
|----|--------|---------|--------------|--------|
| M-STORAGE-1 | `memories` | Memories/journal photos and voice-related uploads | Bucket plus couple-scoped read/write | ⏸️ |
| M-STORAGE-2 | Chat media buckets | Chat photos, files, and voice messages | Inventory actual bucket names, then verify policies | ⏸️ |
| M-STORAGE-3 | Vault assets | Vault file storage, if enabled | Confirm whether used; verify if present | ⏸️ |

## 6. App Icons + Assets

| ID | Task | Status |
|----|------|--------|
| M-ICON-1 | Verify Web PWA icons (`public/icon-192x192.png`, `public/icon-512x512.png`) | ⏸️ |
| M-ICON-2 | Verify Mobile Android adaptive icon assets | ⏸️ |
| M-ICON-3 | Verify Mobile iOS icon configuration and asset | ⏸️ |
| M-ICON-4 | Verify Web and Mobile splash screens | ⏸️ |

## 7. E2E Testing (Phase 20)

| ID | Test | Status |
|----|------|--------|
| M-TEST-1 | Geofence enter, exit, and debounce on Mobile and Web | ⏸️ |
| M-TEST-2 | Battery 20% threshold, charging skip, and debounce | ⏸️ |
| M-TEST-3 | Missed check-in expiry, partner notification, and contacts | ⏸️ |
| M-TEST-4 | Journal create/edit/delete, AI reflection, voice, and TTS | ⏸️ |
| M-TEST-5 | Push preferences for geofence, battery-low, and missed-checkin | ⏸️ |
| M-TEST-6 | Web geofence events list and Mobile parity | ⏸️ |
| M-TEST-7 | Saved-place circles on the Mobile map using meter-based distance | ⏸️ |
| M-TEST-8 | SOS trigger, acknowledge, and resolve | ⏸️ |

## 8. Deploy Order (Execute Sequentially)

| Step | Action | Notes |
|------|--------|-------|
| 1 | Run SQL `00_core.sql` through `11_sos_constraint.sql` in order | Supabase SQL Editor; use a fresh DB |
| 2 | Deploy the 8 Edge Functions | Supabase CLI commands above |
| 3 | Set Web/Vercel environment variables and secrets | Include `CRON_SECRET` |
| 4 | Set Mobile `mobile/.env.local` values | Use the same Supabase project |
| 5 | Enable pg_cron, store secrets, and schedule 3 jobs | Verify job runs before cutover |
| 6 | Remove Vercel cron entries | Commit, push, and redeploy |
| 7 | Deploy Web to Vercel | Confirm build and runtime configuration |
| 8 | Build Mobile with EAS | Verify release assets and environment |
| 9 | Run E2E tests M-TEST-1 through M-TEST-8 | Record failures before release |
| 10 | Verify pg_cron execution and notifications | Inspect `cron.job_run_details` and app behavior |

## 9. Skipped Phases (Documented)

| Phase | Reason |
|-------|--------|
| Phase 15 (Telegram Bot) | Not in current scope |
| Phase 13 (My Suggestions) | Existing generate-and-save flow is sufficient |

## 10. Known Limitations (from AI-CONTEXT.md)

- Mobile onboarding is login-first; there is no onboarding wizard.
- Memory Map is Mobile-only by design.
- Web implements more games than Mobile; Mobile has TicTacToe and LoveCalculator while other games are coming soon.
- i18n has approximately 831 hardcoded strings across feature files.
- Web settings top-level toggles are local-only visual placeholders.
- AI usage logging is incomplete for `surprise`, `mediate`, and `intimacy`.
- Mobile About/Help/Privacy lacks the Web Help page's external mailto support link.
