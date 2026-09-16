# AI Context — A Little World With Us

Read this FIRST before working on this project. It contains locked decisions,
conventions, and gotchas that are NOT obvious from the code.

## 1. Project Identity

| Item | Value |
|------|-------|
| Project | A Little World With Us — Private Couple App |
| Stack | Next.js 15 + Expo (React Native) + Supabase |
| Repo | thuwon416-web/A-little-world-with-us |
| Local path | D:\Project\thuwon416@gmail.com\A little world with us\A little world with us |
| Supabase project | mktfnwdvzbdrxfcvnolp |
| Couple ID | 92da68b8-616b-450d-a595-1bd24e2df1e0 |
| Admin | thuwon416@gmail.com (900da207-67b7-4433-a105-90c4e4e6d9a4) |
| Partner | myintmyatthu.3792@gmail.com (693b63dc-2262-47c9-ad81-ab9d3d0646c4) |
| Expo | e408249d-9b07-4d2f-8df3-6115e4d47bab |

## 2. Locked Files (NEVER TOUCH)

| Item | Rule |
|------|------|
| vault_items / vault_credentials | NEVER modify |
| Korean tables | NEVER modify |
| Safety tables (16.1–16.6) | Locked |
| Admin-Only Location screen | Locked (thuwon416@gmail.com only) |
| mobile/components/ui/Modal.tsx | NAMED export { Modal } — reuse, don't modify |
| Phase 19 finance files (Web + Mobile) | Do NOT modify |
| 5 Themes / 20 Wellness Boards / 14 Games / 160 Korean | Locked |
| Existing Edge Functions | Locked (add new only) |

## 3. Project Conventions

- **Icons:** Lucide only — `lucide-react-native` (Mobile) / `lucide-react` (Web)
- **NO EMOJI** in mood / journal / semantic UI (emoji only in stickers + finance categories + cycle metadata)
- **Mood icons:** Smile / Meh / Frown / Heart / TriangleAlert
- **Journal storage:** `memories` table + `category='journal'` + `metadata` JSONB
- **metadata.mood_tag values:** 'happy' | 'okay' | 'sad' | 'loved' | 'anxious'
- **AI privacy:** `ai_privacy_settings.allow_ai_read_memories` (default false)
- **AI calls:** `generateAiResponse` from `@/lib/ai/providers` (no external SDK)
- **Mobile → Web API:** `EXPO_PUBLIC_WEB_URL` + Bearer token
- **Web → API:** session cookie
- **Edge function auth:** `Authorization: Bearer ${CRON_SECRET}`
- **Cron pattern:** route (401 / 500) → edge function (try/catch + JSON 500)
- **Myanmar language** for user-facing responses

## 4. Gotchas (things that bit us)

- `memories` service does NOT return `description` / `metadata` → use local enrichment query
- `memories.date` is DATE not timestamptz — use `new Date().toISOString().slice(0,10)`
- MapLibre `CircleLayer` is PIXEL-based (not meters) → use GeoJSON polygon for radius circles
- Mobile Location screen is admin-gated (`if (!isAdmin) return <Redirect href="/(tabs)" />`)
- Mobile Settings screen shows toggles that may not persist for users without a `push_devices` row
- `saved_places` RLS: admin-only update (not partner)
- Expo Push send: `https://exp.host/--/api/v2/push/send` (batch array)
- PostgREST default limit 1000 — paginate for history tables

## 5. Completed Phases

See CHANGELOG.md. All phases 1–21 complete (13 + 15 skipped).

## 6. Manual Queue

See docs/manual-queue.md. Run before testing.

## 7. Working Pattern

1. Assistant writes ONE definitive prompt (all facts pre-verified)
2. Copilot runs → reports
3. Verify → next slice
4. Manual tasks → queue only (do not run)
5. Commit only when user asks

## 8. Next

- Phase 20.3 — Manual E2E testing (see manual-queue.md)
- Phase 11 — Build & VPN release
