# Release Evidence Pack

Updated: 2026-10-09

This file is the single evidence template for the final release sequence. It records facts only; an unchecked item must not be described as verified.

## Phase 10 — Owner verification

Repository-side Phase 8 hardening is complete; native/device checks below remain evidence gates because they require a current native build and runtime observation.

### Google Drive / Web
- [ ] Google Cloud OAuth client contains production callback:
  - `https://a-little-world-with-us.vercel.app/api/drive/callback`
- [ ] Sign in with a real Google account.
- [ ] Drive connect → Google consent → callback → Settings shows Connected.
- [ ] Drive disconnect removes the app connection and reconnects cleanly.

### Drive-backed Memories
- [ ] Upload one real image from Web.
- [ ] Confirm Supabase memory row contains `storage_provider=google_drive` and `drive_file_id`.
- [ ] Reload/re-render the memory successfully.
- [ ] Delete the memory/message and confirm the Drive object remains. Test explicit permanent Drive deletion separately.

### Web ↔ Mobile
- [ ] Auth
- [ ] Couple
- [ ] Chat
- [ ] Period
- [ ] Memories / Media
- [ ] Calendar / Plans / Finance
- [ ] Location / Safety
- [ ] Notifications / Offline recovery
- [ ] AI
- [ ] Drive

### Native
- [ ] Current-main Android build ID recorded.
- [ ] Current-main iOS build ID recorded.
- [ ] Native Drive PKCE/deep-link connect and disconnect.
- [ ] Camera/media permissions.
- [ ] Notifications/device registration.
- [ ] Background location/maps.
- [ ] WebRTC.
- [ ] Offline queue/retry/media recovery.

### Product QA
- [ ] Memories visual pass: cards, pin behavior, text contrast, loading/error states.
- [ ] Period/Fertility controlled scenario: recalculation after a delayed period and estimated chance wording.
- [ ] Korean Levels 4–6 human content QA.
- [ ] Accessibility checks.
- [ ] Dependabot/Security live snapshot.

## Phase 11 — Evidence-driven fixes

Only defects observed in Phase 10 belong here.

| Finding | Surface | Fix commit | Regression evidence | Recheck |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Phase 12 — Release Candidate freeze

Record all of the following from the same final revision:
- Final commit SHA:
- GitHub workflow/check evidence:
- Android build ID:
- iOS build ID:
- Vercel production deployment ID:
- Vercel deployment state:
- Production URL:
- Critical-path smoke result:
- Release decision:

## Phase 13 — Monitoring

For the first stability window, monitor:
- Drive OAuth/token refresh/upload/download/delete failures.
- Vercel runtime errors.
- Notification delivery and device registration.
- Background location/safety failures.
- Offline sync/retry/conflict failures.
- User-visible regressions.

Record incidents here only with observed evidence.

| Date | Surface | Evidence | Action | Status |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Phase 14 — Product evolution backlog

Do not start these as release blockers. Sequence after stability:
1. Korean grammar sequencing
2. Korean vocabulary sequencing
3. Korea Life
4. Couple Korean
5. Adaptive review
6. Speaking practice
7. Richer audio
8. AI Korean tutoring
9. Wellness enhancements

## Phase 15 — Long-term hardening

After release stability:
- Dependency/Dependabot remediation.
- Database index/FK optimization.
- Storage retention and cleanup.
- Observability dashboards and alert thresholds.
- Disaster recovery/export validation.
- Accessibility regression suite.

## Evidence rules

1. Code/config inspection is not a substitute for authenticated, device, or console evidence.
2. Historical native builds do not count as current-main evidence.
3. A missing provider credential is not a successful provider integration.
4. A READY deployment only proves that deployment is READY; it does not prove authenticated feature flows.
5. Keep this file synchronized with `docs/FINAL_VERIFICATION.md` and `docs/RELEASE_CLOSEOUT.md`.


### Drive-first archive additions
- [ ] Reconnect the Google OAuth grant with the broader Drive scope before testing external folder sync.
- [ ] Create `Kalaw 2026` under the app Drive root, add an image, run/trigger Drive sync, and confirm the image appears in Memories with `drive_file_id` and `drive_folder_id` metadata.
- [ ] Send a chat image and confirm it is stored in the Drive Chat year/month folder.
- [ ] Delete the chat message and confirm the Drive image remains.
- [ ] Confirm a daily chat archive file is created/updated under `Chat/{year}/{month}/` and is indexed by `chat_archive_days`.


### Latest Drive implementation build evidence
- A production Vercel build of commit `8c42ae5` reached the TypeScript stage but failed on four source errors in the new Drive archive implementation. Those errors were corrected afterward.
- The latest corrected `main` revision has not yet produced a successful Vercel build because the Hobby deployment API reached its daily deployment limit. Therefore current production deployment evidence must remain unchecked until a successful corrected build is observed.

- [ ] Delete a Drive-backed Memory from the app and confirm the original is moved to `Archive/Deleted Memories` and remains in Drive while the Memory disappears from the active app view.
- [ ] Reconnect/use the partner Drive connection and confirm retained shared media remains readable; do not delete shared media during account-erasure verification.
- [ ] Use the explicit permanent Drive-delete action on one test archive only and confirm the Drive object and archive index entry are removed.


## 2026-10-09 full infrastructure audit checkpoint
- GitHub: `main` is the only branch; latest audit fix is `d18e76c9fbeb57375f256cd17f629e9e195e8200` (Drive archive RLS/index performance hardening).
- Supabase live: all public tables have RLS enabled; direct table grants show 0 anon grants and 300 authenticated grants; latest performance audit no longer reports the Drive/chat archive unindexed-FK or auth-initplan findings after the 2026-10-09 migration. Remaining performance notices are the pre-existing unused-index backlog (122 at audit time) and are not being destructively removed before release stability.
- Supabase security audit still reports 12 intentionally callable SECURITY DEFINER RPCs and leaked-password protection disabled. The RPCs are application-facing authenticated functions and were not revoked because doing so would break intended app behavior; leaked-password protection remains an external Supabase plan/setting gate.
- Vercel: latest deployment attempts are failing at the build step because the connected Vercel Hobby build-rate limit is exhausted. The last observed build reached successful compilation but failed TypeScript on commit `8c42ae5`; the identified source errors were subsequently corrected, including the Drive sync authenticated-user bug fixed on `e62316ef`. A successful build of the corrected latest main has not yet been observed, so production-ready status remains unchecked.
- Vercel environment audit: production/preview/development contain the required server-side Drive OAuth, encryption, Supabase, cron, AI-provider and notification variables; values were not read or exposed. Mobile env search found no Supabase service-role or Google client-secret usage.
- Important security architecture note: chat encryption currently uses a `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` on Web and `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` on Mobile, so it is client-visible and must not be described as a secret/E2EE boundary. Changing it now would risk breaking existing message decryption; a future per-couple key-exchange hardening remains a separate post-stability security task.


### 2026-10-09 Vercel build boundary update
- Deployment `dpl_BAGGkwDaVFwK4chiJsid5j9paKm2` built commit `e62316ef`, compiled successfully, then failed TypeScript on five remaining source issues: Drive file nullable actor handling, chat archive message `media_url` typing, and Drive memory access query missing `id`. Those issues were corrected on subsequent `main` commits, latest code SHA now `d2af93d9c8c34b20e17a370cdefb95cce914e122`.
- A fresh deployment of that corrected SHA was attempted and Vercel returned HTTP 402 `api-deployments-free-per-day`: more than 100 deployments, retry after 24 hours. Therefore no production verification is possible for the corrected SHA until Vercel permits another deployment.


## 2026-10-09 continued non-Vercel close-out
- B2 download authorization now rejects client-supplied object names outside `couples/{requested-couple}/large-media/`, validates actual NUL bytes, and has route regression tests for cross-origin blocking, NUL rejection, cross-couple object denial, and successful scoped authorization.
- B2 upload route now applies same-origin protection and filename length/NUL validation before requesting an upload target.
- Drive memory upload now creates the Drive memory folder using the same UUID written as the Supabase memory row ID, matching the documented `Memories/{year}/{memory-id}/` convention.
- Drive upload route now applies same-origin protection; upload tests were repaired to mock the actual folder-helper dependencies and CSRF helper.
- Local verification on the working tree: Web TypeScript passes; Web Vitest passes 26 files / 102 tests, including Drive sync scope, same-origin, and PDF chat attachment regression coverage; Mobile TypeScript passes; Mobile Jest passes 5 suites / 17 tests. GitHub Actions for commit `b6c393f1ef532e21898142ef5ee678f84e28d737` all passed: Test, E2E Tests, Production Smoke E2E, Secret scan, and CodeQL. See the [Test run](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246729), [E2E run](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246741), [Production Smoke](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246750), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246730), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246737). Production authenticated Drive E2E and current-main Vercel/native evidence remain separate gates.
- Vercel work is intentionally paused per owner request. No new deployment attempted as part of this continuation.

- Drive memory import now skips file IDs already indexed under another couple and reports `skippedConflicts`; verified by all five GitHub Actions workflows on code revision `1fcf9036a4cc03bfe26dee6b9a51928699c8e46f`; production authenticated Drive E2E and Vercel/native evidence remain separate gates.

- Expanded same-origin protection across cookie-authenticated AI generation, couple export, feedback, and browser push-subscription mutations; focused tests assert early rejection before session lookup. Verify all workflow results against the exact commit before marking this security batch complete.

- Follow-up mutation sweep extends same-origin enforcement to AI chat, journal reflection, Korean quiz generation, voice transcription, Drive memory export, and media upload; focused tests assert early rejection on the two storage routes. GitHub Actions for code revision `8485837835d74a181746a1693f6e7b7341703d21` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950920), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950970), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950919), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950914), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950892). Web coverage run passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests. This does not substitute for authenticated production Drive E2E or current-main Vercel/native evidence.


## 2026-10-09 full mutation-route CSRF sweep — verified
- GitHub Actions for code revision `8485837835d74a181746a1693f6e7b7341703d21` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950920), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950970), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950919), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950914), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950892). Web coverage run passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests. This does not substitute for authenticated production Drive E2E or current-main Vercel/native evidence.
- Repository scan found zero `POST`/`PUT`/`PATCH`/`DELETE` route handlers without an explicit `isSameOriginRequest` guard. This is a source-level coverage check, not a substitute for endpoint-specific authorization testing.

- Memories UI upload now follows Drive → Cloudinary → encrypted Supabase fallback when the Drive endpoint has a provider/server failure; auth, validation, authorization, and rate-limit errors remain hard failures. GitHub Actions for code revision `48d35db6f32aecf4f5c41abd430582caa8cf8117` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484796), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484798), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484799), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484773), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484782). Web coverage passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests. Production authenticated Drive E2E remains open.

- Fallback hardening also handles Drive-status fetch failures and Cloudinary 5xx responses; the Cloudinary route attempts cleanup if an exception occurs after provider upload. Verified by all five workflows on code revision `48d35db6f32aecf4f5c41abd430582caa8cf8117`; production authenticated Drive E2E and Vercel/native evidence remain separate gates.

- Upload fallback now also handles network failures between the browser and the Drive/Cloudinary API routes, while preserving hard failure for non-5xx validation/auth/authorization/rate-limit responses.

- Chat attachment upload on Web/Mobile now falls back to encrypted Supabase when Drive status cannot be checked or the Drive upload endpoint returns 5xx; non-5xx errors remain hard failures.


## 2026-10-09 latest source verification
- GitHub Actions for code revision `48d35db6f32aecf4f5c41abd430582caa8cf8117` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484796), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484798), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484799), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484773), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37897484782). Web coverage passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests.
- A source scan covered 31 mutating API handlers (`POST`/`PUT`/`PATCH`/`DELETE`) and found zero route files missing explicit `isSameOriginRequest` enforcement.
- Drive and chat uploads now advance to configured fallback storage for provider/server failures; uncertain browser POST network failures do not automatically duplicate a file.
- Vercel remains paused at the owner’s request. No deployment was triggered; authenticated real-Drive E2E, current-main native builds, and manual release gates remain open.


## 2026-10-09 follow-up code/database checks
- [x] Live Supabase schema repaired additively: `public.memories` now has `latitude`, `longitude`, `location_label`, and `metadata`; verified columns and `memories_location_idx` / `memories_journal_recent_idx` exist. Live table had 0 memory rows at verification time.
- [x] Added bootstrap SQL `apps/web-platform/backend/supabase/bootstrap/55_restore_memory_location_and_journal_columns.sql` and recorded live migration `20261009073304` in `docs/DATABASE.md` and `CURRENT_STATE.md`.
- [x] Web Memories now stops and reports an uncertain upload response instead of blindly trying another provider after a network exception. This avoids possible duplicate uploads if the server completed the first request but the response was lost.
- [ ] Run GitHub Actions for the latest source/docs commits and inspect the results; do not treat the prior green workflows as evidence for later commits.
- [ ] After Vercel is explicitly unpaused and a corrected deployment is available, verify authenticated Memory Map, journal create/edit/reflection, Drive upload/readback and partner fallback in production.


## 2026-10-17 Telegram action gateway security evidence
- Fix commit: `0ba959a0bc803d9b87c5d8c58c4c008ebb7c2fe3`.
- Verification: all 9 exact-SHA GitHub checks passed, including Web, Mobile, Tests, Next.js Production Build & Tests, Smoke, Gitleaks, Database Migration Syntax Pre-flight, CodeQL, and Production Release Gate. [Exact-SHA checks](https://github.com/thuwon416-web/A-little-world-with-us/commit/0ba959a0bc803d9b87c5d8c58c4c008ebb7c2fe3/checks).
- Production deployment: `dpl_J41emJ7BN6u2uH5NqCSAQn3GvhWS`, READY, canonical alias `https://a-little-world-with-us.vercel.app`.
- Remaining config gate: `TELEGRAM_ACTION_SECRET` is absent from the Vercel environment inventory. Configure a new dedicated secret in Vercel Production and the same secret in the Cloudflare Gateway before expecting the action endpoint to accept calls. No secret values were read or changed.

## 2026-10-17 read-only production re-check
- Latest production deployment is READY for `7c3d6c8be0747af0151822333fce66ae0fd23237`; all 9 exact-SHA GitHub checks passed: [checks](https://github.com/thuwon416-web/A-little-world-with-us/commit/7c3d6c8be0747af0151822333fce66ae0fd23237/checks).
- The linked Vercel project's Production inventory did not contain `TELEGRAM_ACTION_SECRET` (61 visible variables; zero hidden production variables), and live `GET /api/telegram/daily-question` returned 503 `Action gateway is not configured.` The owner reports the secret was added; verify the exact project, Production target, spelling, and deployment environment. No env variables were changed.
- Google Drive OAuth/state/encryption variable names are present in Production, but the actual redirect URI value was not exposed by the metadata response. Confirm it matches `https://a-little-world-with-us.vercel.app/api/drive/callback` in the Vercel dashboard and Google Cloud OAuth client.
- The last 7-day runtime error clusters remain 24 Drive file lookup errors and 4 Drive memory-sync errors, last seen 2026-10-16 on old deployment `dpl_3EKyzLHevhxdKS9ZfhW2btgHrFqc`. Authenticated Drive end-to-end remains unverified.
- Supabase advisors: 12 SECURITY DEFINER warnings, leaked-password protection disabled, and 120 unused-index notices. No database changes were made; review before altering grants or indexes.


## 2026-10-17 automated production audit addendum

- Vercel: deployment `dpl_HwcYhvV3eszjsuk4aiesQiiGQ1a4` READY for commit `e73d0ecf42bff872e44c3bc93d54046bb1947957`; 10/10 GitHub checks passed. `/api/ai/usage` returned HTTP 200 with the requested AI providers configured.
- Telegram gateway: Production variable exists and was present before redeploy, but the authorized live request could not be executed with the available fetch interface; HTTP 200 and Telegram delivery remain unchecked.
- Supabase: live migration history now contains 42 entries after additive migrations `chat_pinned_messages_20261017` and `chat_pinned_messages_fk_indexes_20261017`. Verified pinned-message table, RLS, Realtime, and supporting indexes. No existing user/media/Drive rows were modified or deleted.
- RLS is enabled on the relevant existing message, relationship-memory, wellness, safety, vault, and Drive connection tables. Supabase advisors still report 12 callable SECURITY DEFINER warnings and disabled leaked-password protection; 123 unused-index INFO notices remain. Do not drop indexes or revoke function grants without reviewing actual usage/authorization intent.
- Storage, Google Drive, cron, TURN, VAPID, pooler and native/device checks are not all runtime-verified. In particular, authenticated Drive OAuth/decryption, storage-provider E2E, a real TURN peer connection, and current-main EAS/device smoke remain release gates.
- **Release decision: PENDING RELEASE VERIFICATION — not signed off.** See the 2026-10-17 checkpoint in `CURRENT_STATE.md` for details and limitations.


## 2026-10-17 owner decision — conditional production sign-off

**Decision: PRODUCTION READY — CONDITIONAL / OWNER-ACCEPTED POST-LAUNCH ITEMS.** This decision supersedes earlier blanket “PENDING RELEASE VERIFICATION” wording only for the limited production-launch scope described here; it does not assert that every feature has passed authenticated end-to-end verification.

- Final code revision reviewed: `e4594daa4478b3cba37410bd725c608514b3a530`.
- Exact-SHA GitHub checks: 9/9 completed successfully, including Production Release Gate, Web, Mobile, Next.js Production Build & Tests, smoke, tests, Gitleaks, CodeQL/TypeScript analysis, and Database Migration Syntax Pre-flight. [Exact-SHA checks](https://github.com/thuwon416-web/A-little-world-with-us/commit/e4594daa4478b3cba37410bd725c608514b3a530/checks).
- Vercel production deployment: `dpl_CBu6Rb5gqXoJ6nc5ztaTx7NYLLBP`, state `READY`, canonical URL `https://a-little-world-with-us.vercel.app`.
- Telegram gateway: owner reports that the live endpoint no longer returns the prior 503 and now returns HTTP 401 Unauthorized without valid credentials. This is consistent with a configured fail-closed auth gate, but is **owner-reported evidence**, not independently replayed here; it does not prove an authorized request returns 200 or that a Telegram message was delivered. Do not place the secret in chat or logs.
- Google Drive: owner plans to re-authorize through Production Web UI → Settings → Google Drive → Connect. This is still a **client-side post-sign-off action**, not a completed E2E result. Preserve existing connection rows and Drive originals; after consent, confirm Settings shows Connected and open an existing Drive-backed Memory to verify token decryption and media readback. Do not rotate the encryption key or delete rows as a first response.
- Database: the two additive `chat_pinned_messages` migrations and their RLS, Realtime, and FK-index checks are recorded above. No existing relationship, memory, media, or Drive connection rows were deleted or rewritten.
- Owner-accepted post-launch backlog: current-main Android/iOS EAS build and physical-device smoke; multipart/chunked large-media upload; and a live TURN peer-call test. These are **deferred**, not verified complete. The current B2 large-media route is single-request upload. AES-GCM-before-export is not universal across Drive/Cloudinary provider paths, so do not describe every media provider as end-to-end encrypted.
- Other known platform hardening follow-ups remain visible: Supabase leaked-password protection setting; review of 12 callable SECURITY DEFINER advisor findings; and measurement/review of 123 unused-index notices. No blanket grant revocation or index deletion is authorized by this sign-off.
- Scope/acceptance: the owner explicitly requests launch approval while accepting the above items as deferred work. This sign-off means the current web production deployment and automated CI gates are accepted for launch; it is **not** a certification that Google Drive re-auth, authenticated storage round-trip, live WebRTC, or native-device flows have already passed.


## 2026-10-17 owner-confirmed integration completion — native build queue

- Telegram: **owner-tested complete**. The owner reports a successful production test; this is accepted as completion evidence for the close-out ledger.
- Google Drive: **owner-tested complete**. The owner reports a successful production test; this is accepted as completion evidence for the close-out ledger.
- Current-main Android/iOS EAS builds and physical-device smoke remain the highest-priority open gate. Mobile app config is in `apps/mobile`, with Expo project ID `e408249d-9b07-4d2f-8df3-6115e4d47bab`. The previously attempted EAS trigger returned `No repository found for the current appId`; the build/project association must be diagnosed before a fresh build can be considered valid.
- Device-only checks remain pending until observed: login/session, chat, memory and Drive media readback, push notification delivery, offline/reconnect, camera/microphone/location permissions, and two-device WebRTC/TURN.
- Remaining code/operations backlog: provider-neutral media upload/read/delete round-trip and large-file reliability; review (not blindly remove) Supabase SECURITY DEFINER warnings and unused-index notices; enable leaked-password protection if supported; add production monitoring for Telegram, Drive, media, and mobile failures.
- Evidence note: Telegram/Drive completion is based on the owner's successful tests, not an independently replayed authenticated request in this environment.


## 2026-10-17 execution evidence — EAS build blocker and offline-sync security remediation

- Telegram and Google Drive are **owner-tested complete** per the owner's successful production tests.
- Added `.github/workflows/mobile-eas-build.yml` with separate Android and iOS preview build jobs. [First workflow run](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/39044384282) failed at the explicit secret check because GitHub Actions secret `EXPO_TOKEN` is missing. The EAS build commands were not run. Add the Expo token through repository Settings → Secrets and variables → Actions, then rerun the workflow; do not commit the token.
- Applied Supabase migration `harden_offline_operation_owner_scope_20261017` (version `20261017152114`) to harden `offline.apply_op`: cached operation results are bound to their owner, operation-ID reuse with different metadata is rejected, and a CREATE request cannot return a message row owned by another sender/couple. Source: [commit `b8b8a08`](https://github.com/thuwon416-web/A-little-world-with-us/commit/b8b8a08e33966842b723e9d4ee20eb7d283a6246), file `apps/web-platform/backend/supabase/bootstrap/57_harden_offline_operation_owner_scope.sql`.
- Live regression check passed for cross-user operation-ID replay and same-user operation-ID mismatch; the follow-up verification confirmed all three guards are present and no test fixture rows remain.
- Latest Supabase advisor snapshot: 12 authenticated-callable SECURITY DEFINER warnings, leaked-password protection disabled, 122 unused-index notices. Review functions individually; do not blanket-revoke or drop indexes.
- Historical Drive runtime decryption errors were last observed on old deployment `dpl_3EKyzLHevhxdKS9ZfhW2btgHrFqc` on 2026-10-16. The owner reports a successful post-fix test, so this is historical context rather than evidence of a current outage.
- Remaining: current-main Android/iOS EAS builds and physical-device smoke, media provider round-trip/large-file reliability, a live WebRTC/TURN call, leaked-password protection, and production monitoring/alerts.


## 2026-10-17 backend audit and scheduled-job fixes

- Three-pass read-only database audit: project `ACTIVE_HEALTHY`, PostgreSQL 17.6; all 78 public base tables have RLS and policies; all 143 public foreign keys and all check constraints are validated; 2 Auth users match 2 profiles; counts checked include 12 messages, 2,360 relationship memories, 1 Google Drive connection, and 4 Storage objects. No user or media data was deleted.
- Fixed a real `reveal-surprises` cron authentication failure: 170 prior 401 logs in the reviewed window. Deployed Edge Function v5 with app-level Vault-backed secret validation (service-role-only RPC), generated a random Vault secret, and changed cron to send `x-job-secret`. Scheduled run returned HTTP 200 with zero capsules revealed; wrong-secret verification fails as expected.
- Fixed routing/auth for `check-geofence`, `check-battery`, and `check-missed-checkin`: cron URLs now point to the matching Supabase Edge Functions instead of invalid `/api/cron/*` paths; each uses a distinct Vault secret and service-role-only verifier. Direct wrong-secret probes returned 401, proving the routes are reachable and protected. No notification-producing endpoint was manually run with valid credentials.
- Security advisor still reports 12 authenticated-callable SECURITY DEFINER functions and disabled leaked-password protection; performance advisor reports 120 unused-index notices. Function bodies were reviewed; do not blanket-revoke or drop indexes. Continue per-function authorization review and enable leaked-password protection through Auth settings.
- Historical Drive decryption errors (24 file lookups, 4 memory syncs) last occurred on old deployment `dpl_3EKyzLHevhxdKS9ZfhW2btgHrFqc` on 2026-10-16. Owner reports post-fix Drive tests passed; monitor for recurrence.
- Still open: verify the three repaired cron jobs' next scheduled HTTP responses; full media provider upload/read/delete and large-file test; live WebRTC/TURN call; Android/iOS EAS builds and device smoke (requires GitHub Actions secret `EXPO_TOKEN`); leaked-password protection setting.


## 2026-10-17 final verification of scheduled backend jobs

- After the missing table permissions were identified, migration `grant_scheduled_job_table_privileges_20261017` granted only the minimum service-role operations needed by scheduled handlers: SELECT/UPDATE `safety_checkins`, SELECT `emergency_contacts`, SELECT/INSERT `battery_alert_log`, and SELECT/INSERT/UPDATE `geofence_events`. No DELETE privileges were added.
- The 16:35 UTC scheduled cycle returned HTTP 200 for `check-geofence` (`checked=1, places=0, inserted=0, notified=0`), `check-missed-checkin` (`processed=0, notified=0, contactsConsidered=0`), and `reveal-surprises` (`revealed=0`). `check-battery` returned HTTP 200 at 16:30 UTC (`checked=0, sent=0`).
- The cron routing/authentication and service-role permission issues found during this audit are now verified fixed for observed scheduled cycles. Since no push devices, saved places, low-battery locations, expired check-ins, or due surprise capsules were present, no user notifications were sent. Actual push delivery remains untested.
- GitHub CI on commit `77ce9e554ead14a8dec6c978f37216af63e8ba0e`: production pipeline, smoke E2E, E2E tests, unit tests, CodeQL, and secret scan all passed.
- All six Storage buckets are private. Bucket-level file-size and MIME-type restrictions are unset; review application-level validation and decide whether provider limits should be configured.


## 2026-10-21 current-main observed evidence
- [x] Current-main Android EAS preview build succeeded for source SHA `38bbdc955fdccf13631f6f0b82ee8a86186071ce`: build `fe31b055-357b-4455-b95e-5b8eec04269e` (https://expo.dev/accounts/thuwon/projects/a-little-world-with-us/builds/fe31b055-357b-4455-b95e-5b8eec04269e).
- [x] Current-main iOS EAS simulator build succeeded for source SHA `38bbdc955fdccf13631f6f0b82ee8a86186071ce`: build `e689d59c-d59f-4881-a7cd-85036f5fddcd` (https://expo.dev/accounts/thuwon/projects/a-little-world-with-us/builds/e689d59c-d59f-4881-a7cd-85036f5fddcd).
- [x] Vercel Production deployment `dpl_7HmERGDoaV79a5S8HaTR9Ze5k6Dg` is READY for the same source SHA.
- [x] GitHub Actions on that SHA: Mobile EAS Build, E2E Tests, Secret scan, Production CI/CD Pipeline (Non-Docker), Production Smoke E2E, Test, and CodeQL all succeeded.
- [ ] Android 15 physical-device smoke remains open: the user-reported `Maximum update depth exceeded` has not yet been confirmed fixed on-device.
- [ ] Physical iOS build/signing and device smoke remain open; the recorded iOS artifact is simulator-only.
- [x] Owner reports Telegram and Google Drive setup/testing complete. This is owner-reported evidence; automation did not repeat authenticated end-to-end user flows.
- [ ] B2 upload/download round-trip (if enabled), real push delivery, two-device WebRTC, background location, offline recovery, Memories visual pass, controlled fertility scenario, Korean Levels 4–6 human QA, and refreshed Dependabot/security snapshot remain outstanding.
- Note: Vercel's latest aggregated Drive-not-connected errors observed during this check were associated with older deployment `dpl_ERULU7Y2hFxrPYgtZ1FPwB992HBi`; no conclusion about post-reconnection success/failure is inferred from those historical events.
