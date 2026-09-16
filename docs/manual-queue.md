# Manual Queue — A Little World With Us

Master list of manual actions to run BEFORE testing.
Coding အားလုံး ပြီးမှ တစ်ဆင့်ချင်း လုပ်ပါ။

## 1. SQL Migrations (Supabase SQL Editor)

| ID | File | Purpose | Status |
|----|------|---------|--------|
| M-SQL-1 | supabase/bootstrap/20260915_telegram_features.sql | Telegram-style chat features | ⏸️ |
| M-SQL-2 | supabase/bootstrap/20260915_wellness_entries.sql | Wellness entries table | ⏸️ |
| M-SQL-3 | supabase/bootstrap/20260915_korean_learning.sql | Korean learning tables | ⏸️ |
| M-SQL-4 | supabase/bootstrap/20260915_vault_credentials.sql | Vault credentials | ⏸️ |
| M-SQL-5 | supabase/bootstrap/20260915_memory_locations.sql | Memory locations | ⏸️ |
| M-SQL-6 | supabase/bootstrap/20260915_safety_tables.sql | Safety tables (geofence_events, etc.) | ⏸️ |
| M-SQL-7 | supabase/bootstrap/20260915_sos_resolution.sql | SOS resolution columns | ⏸️ |
| M-SQL-8 | supabase/bootstrap/20260915_battery_alert_log.sql | Battery alert log | ⏸️ |
| M-SQL-9 | supabase/bootstrap/20260915_finance_splitwise.sql | Finance splitwise | ⏸️ |
| M-SQL-10 | supabase/bootstrap/20260916_memories_metadata.sql | memories.metadata JSONB (Phase 17) | ⏸️ |

**Run order:** any order (each is idempotent with IF NOT EXISTS).

## 2. Edge Functions (Supabase Deploy)

| ID | Function | Reason | Status |
|----|----------|--------|--------|
| M-EDGE-8 | check-missed-checkin | New (Phase 21.4) | ⏸️ |
| M-EDGE-9 | check-geofence | Redeploy after Phase 21.2a bug fix | ⏸️ |
| M-EDGE-10 | check-battery | Redeploy after Phase 21.3a bug fix | ⏸️ |
| M-EDGE-1 | check-geofence | Verify deploy | ⏸️ |
| M-EDGE-2 | sos-resolved | Verify deploy | ⏸️ |
| M-EDGE-3 | location-alerts | Verify deploy | ⏸️ |
| M-EDGE-4 | reverse-geocode | Verify deploy | ⏸️ |
| M-EDGE-5 | reveal-surprises | Verify deploy | ⏸️ |
| M-EDGE-6 | checkin-notify | Verify deploy | ⏸️ |
| M-EDGE-7 | check-battery | Verify deploy | ⏸️ |

## 3. Vercel Cron + Env

| ID | Task | Status |
|----|------|--------|
| M-ENV-1 | Add `CRON_SECRET` to Vercel project env | ⏸️ |
| M-VERCEL-1 | Verify `/api/cron/check-geofence` */5 cron | ⏸️ |
| M-VERCEL-2 | Verify `/api/cron/check-battery` */15 cron | ⏸️ |
| M-VERCEL-3 | Verify `/api/cron/check-missed-checkin` */5 cron | ⏸️ |

## 4. Storage

| ID | Task | Status |
|----|------|--------|
| M-STORAGE-1 | Verify `memories` Supabase Storage bucket exists | ⏸️ |
| M-STORAGE-2 | Verify Storage RLS for `journal/{coupleId}/...` read/write | ⏸️ |

## 5. Environment Keys

| ID | Task | Status |
|----|------|--------|
| M-ENV-AI | Confirm `GROQ_API_KEY` set (needed for voice transcription) | ⏸️ |
| M-ENV-AI2 | Confirm at least one AI provider key (GROQ / GEMINI / OPENROUTER / etc.) | ⏸️ |
| M-CARTO-1 | Confirm `NEXT_PUBLIC_CARTO_TILE_URL` + `EXPO_PUBLIC_CARTO_STYLE_URL` set | ⏸️ |

## 6. Build & Release

| ID | Task | Status |
|----|------|--------|
| M-4.4 | App Icon Verify (Android + iOS) | ⏸️ |
| M-SKIP-1..5 | PIN flow tests (unlock, wrong PIN, reset) | ⏸️ |
| Phase 11 | Build & VPN (EAS build + production release) | ⏸️ |

## 7. E2E Testing (Phase 20 — after all coding)

| ID | Test | Status |
|----|------|--------|
| M-TEST-1 | Geofence: enter/exit/debounce (mobile + web) | ⏸️ |
| M-TEST-2 | Battery: 20% threshold + charging skip + debounce | ⏸️ |
| M-TEST-3 | Missed check-in: expiry + partner notify + contacts | ⏸️ |
| M-TEST-4 | Journal: create/edit/delete + AI reflection + voice + TTS | ⏸️ |
| M-TEST-5 | Push preferences: geofence / battery_low / missed_checkin toggles | ⏸️ |
| M-TEST-6 | Web geofence events list + Mobile parity | ⏸️ |
| M-TEST-7 | Saved-place circles on Mobile map (meter-based) | ⏸️ |
| M-TEST-8 | SOS trigger + acknowledge + resolve | ⏸️ |

## 8. Skipped Phases (decided during development)

| Phase | Reason |
|-------|--------|
| Phase 15 (Telegram Bot) | Not needed for current scope |
| Phase 13 (My Suggestions) | Existing generate+save flow is sufficient |

| Phase 20.2 | docs/AI-CONTEXT.md created for future AI sessions | ✅ |
