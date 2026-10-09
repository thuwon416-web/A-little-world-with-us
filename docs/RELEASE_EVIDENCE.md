# Release Evidence Pack

Updated: 2026-10-08

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

- Drive memory import now skips file IDs already indexed under another couple and reports `skippedConflicts`; verify the exact revision through CI before marking the ownership guard complete.
