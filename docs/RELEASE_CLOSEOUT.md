# Release Close-out Ledger

Updated: 2026-10-08

This ledger keeps the close-out work continuous without pretending that owner/device evidence exists before it is collected.

## Phase 7 — Drive / Memory reliability
Status: CODE-SIDE HARDENED
- [x] Drive status/upload/file/delete/disconnect route security tests.
- [x] Auth, authorization, CSRF, rate-limit and upload rollback coverage.
- [x] Native Drive client-ID/file-ID/upload-size validation.
- [x] Token-refresh, provider-401 retry, refresh persistence failure, and malformed token-response regression coverage.
- [ ] Final production OAuth/manual lifecycle evidence.

## Phase 8 — Mobile native / recovery
Status: CODE-SIDE AUDIT CONTINUES — final evidence still required
- [x] Native Drive PKCE/state cleanup path reviewed.
- [x] SecureStore token lifecycle reviewed.
- [x] Offline message queue/retry/conflict path reviewed.
- [x] Notification scheduling/device registration path reviewed.
- [x] Native Drive callback duplicate-delivery guard added.
- [x] Mobile reminder writes now bind to the authenticated user.
- [x] Native Drive list pagination is capped at 100 items.
- [ ] Current-main Android build evidence.
- [ ] Current-main iOS build evidence.
- [ ] Device verification for location, notifications, WebRTC and offline recovery.

## Phase 9 — Highest-risk API security
Status: CODE-SIDE HARDENED
- [x] Drive authenticated route coverage.
- [x] PIN auth/CSRF/rate-limit coverage.
- [x] Highest-risk memory deletion route now has CSRF + rate-limit + ownership regression coverage.
- [ ] Continue matrix across remaining authenticated data-mutating routes.
- [ ] Provider-backed emergency-contact email integration only after provider credentials are supplied.
- [ ] Final GitHub security/Dependabot snapshot.

## Phase 10 — Single manual verification
Status: PREPARED / DEFERRED
Source of truth: `docs/FINAL_VERIFICATION.md`
Evidence record: `docs/RELEASE_EVIDENCE.md`
Run once after Phases 7–9 code-side work settles. No owner-side step is repeated.

## Phase 11 — Evidence-driven fixes
Trigger: only defects recorded in Phase 10.
Process:
1. Fix code/config.
2. Add regression coverage.
3. Rebuild/redeploy affected surface.
4. Re-check only the affected evidence plus critical smoke.

## Phase 12 — Release Candidate freeze
1. Freeze final commit SHA only after Phase 10 evidence and any Phase 11 fixes.
2. Confirm GitHub checks for that SHA.
3. Confirm Android/iOS current-main build artifacts.
4. Confirm Vercel production deployment points to the frozen SHA and is READY.
5. Perform final critical-path smoke.
6. Record release evidence.

## Phase 13 — Post-release monitoring
Evidence record: `docs/RELEASE_EVIDENCE.md`
Monitor:
- Drive OAuth/upload/download/delete failures
- Vercel runtime errors
- notification delivery/device registration
- background location and safety flows
- offline sync/retry/conflict failures
- user-visible regressions

Deferred database/index cleanup remains behind production stability.

## Phase 14 — Product evolution
After release stability only:
1. Korean grammar sequencing
2. Korean vocabulary sequencing
3. Korea Life
4. Couple Korean
5. Adaptive review
6. Speaking practice
7. Richer audio
8. AI Korean tutoring
9. Wellness enhancements

These are deliberately not release-blocking until the core product is stable.

## Phase 14/15 preparation rule
Product and hardening backlog is pre-staged now, but completion is recorded only against observed work/evidence. Do not mark these phases complete merely because the backlog exists.

## Phase 15 — Long-term hardening
- Dependency/Dependabot remediation after current-main alert snapshot.
- Database index/FK optimization.
- Storage retention/cleanup policies.
- Observability dashboards and alert thresholds.
- Disaster recovery / export validation.
- Accessibility regression suite.


## Drive-first archive track (2026-10-08)
- Repository-side implementation now treats Google Drive as persistent original media/archive, with Supabase as metadata/index and local storage as cache/offline only.
- Added organized Drive folders for app-created Memories and Chat archives, external memory-folder sync, Drive-backed Web/Mobile chat images, daily chat archive indexing, and safe message deletion that preserves Drive originals.
- Added Supabase archive/index migration and updated release evidence rules.
- Remaining gates are authenticated production E2E, OAuth reauthorization under the broader Drive scope, current-main native/device verification, and regression/CI evidence. These are not marked complete by source changes alone.


## 2026-10-09 full infrastructure audit checkpoint
- GitHub: `main` is the only branch; latest audit fix is `d18e76c9fbeb57375f256cd17f629e9e195e8200` (Drive archive RLS/index performance hardening).
- Supabase live: all public tables have RLS enabled; direct table grants show 0 anon grants and 300 authenticated grants; latest performance audit no longer reports the Drive/chat archive unindexed-FK or auth-initplan findings after the 2026-10-09 migration. Remaining performance notices are the pre-existing unused-index backlog (122 at audit time) and are not being destructively removed before release stability.
- Supabase security audit still reports 12 intentionally callable SECURITY DEFINER RPCs and leaked-password protection disabled. The RPCs are application-facing authenticated functions and were not revoked because doing so would break intended app behavior; leaked-password protection remains an external Supabase plan/setting gate.
- Vercel: latest deployment attempts are failing at the build step because the connected Vercel Hobby build-rate limit is exhausted. The last observed build reached successful compilation but failed TypeScript on commit `8c42ae5`; the identified source errors were subsequently corrected, including the Drive sync authenticated-user bug fixed on `e62316ef`. A successful build of the corrected latest main has not yet been observed, so production-ready status remains unchecked.
- Vercel environment audit: production/preview/development contain the required server-side Drive OAuth, encryption, Supabase, cron, AI-provider and notification variables; values were not read or exposed. Mobile env search found no Supabase service-role or Google client-secret usage.
- Important security architecture note: chat encryption currently uses a `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` on Web and `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` on Mobile, so it is client-visible and must not be described as a secret/E2EE boundary. Changing it now would risk breaking existing message decryption; a future per-couple key-exchange hardening remains a separate post-stability security task.


## 2026-10-09 continued non-Vercel close-out
- B2 download authorization now rejects client-supplied object names outside `couples/{requested-couple}/large-media/`, validates actual NUL bytes, and has route regression tests for cross-origin blocking, NUL rejection, cross-couple object denial, and successful scoped authorization.
- B2 upload route now applies same-origin protection and filename length/NUL validation before requesting an upload target.
- Drive memory upload now creates the Drive memory folder using the same UUID written as the Supabase memory row ID, matching the documented `Memories/{year}/{memory-id}/` convention.
- Drive upload route now applies same-origin protection; upload tests were repaired to mock the actual folder-helper dependencies and CSRF helper.
- Local verification on the working tree: Web TypeScript passes; Web Vitest passes 26 files / 102 tests, including Drive sync scope, same-origin, and PDF chat attachment regression coverage; Mobile TypeScript passes; Mobile Jest passes 5 suites / 17 tests. GitHub Actions for commit `b6c393f1ef532e21898142ef5ee678f84e28d737` all passed: Test, E2E Tests, Production Smoke E2E, Secret scan, and CodeQL. See the [Test run](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246729), [E2E run](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246741), [Production Smoke](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246750), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246730), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37890246737). Production authenticated Drive E2E and current-main Vercel/native evidence remain separate gates.
- Vercel work is intentionally paused per owner request. No new deployment attempted as part of this continuation.

- Additional permanent-delete audit fix: `/api/drive/delete` now applies same-origin protection and removes ownerless retained archive index rows by archive ID after the shared-couple authorization helper has approved the purge. Added a regression case for this account-erasure edge case; the Drive delete route suite passed 4/4 locally.

- Drive memory import now skips file IDs already indexed under another couple and reports `skippedConflicts`; verified by all five GitHub Actions workflows on code revision `1fcf9036a4cc03bfe26dee6b9a51928699c8e46f`; production authenticated Drive E2E and Vercel/native evidence remain separate gates.

- Expanded same-origin protection across cookie-authenticated AI generation, couple export, feedback, and browser push-subscription mutations; focused tests assert early rejection before session lookup. Verify all workflow results against the exact commit before marking this security batch complete.

- Follow-up mutation sweep extends same-origin enforcement to AI chat, journal reflection, Korean quiz generation, voice transcription, Drive memory export, and media upload; focused tests assert early rejection on the two storage routes. GitHub Actions for code revision `8485837835d74a181746a1693f6e7b7341703d21` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950920), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950970), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950919), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950914), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950892). Web coverage run passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests. This does not substitute for authenticated production Drive E2E or current-main Vercel/native evidence.


## 2026-10-09 full mutation-route CSRF sweep — verified
- GitHub Actions for code revision `8485837835d74a181746a1693f6e7b7341703d21` passed all five workflows: [Test](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950920), [E2E Tests](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950970), [Production Smoke E2E](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950919), [Secret scan](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950914), and [CodeQL](https://github.com/thuwon416-web/A-little-world-with-us/actions/runs/37895950892). Web coverage run passed 31 files / 110 tests; Mobile tests passed 1 suite / 3 tests. This does not substitute for authenticated production Drive E2E or current-main Vercel/native evidence.
- Repository scan found zero `POST`/`PUT`/`PATCH`/`DELETE` route handlers without an explicit `isSameOriginRequest` guard. This is a source-level coverage check, not a substitute for endpoint-specific authorization testing.

- Memories UI upload now follows Drive → Cloudinary → encrypted Supabase fallback when the Drive endpoint has a provider/server failure; auth, validation, authorization, and rate-limit errors remain hard failures. Verify current code revision in CI and production E2E before closing this item.

- Fallback hardening also handles Drive-status fetch failures and Cloudinary 5xx responses; the Cloudinary route attempts cleanup if an exception occurs after provider upload. Verify the next exact SHA in CI.
