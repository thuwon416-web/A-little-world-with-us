# Current State

Owner: Project maintainers
Update when: release gates or verification evidence change
Last Updated: 2026-10-08

## 1. Current Release
Final production close-out audit.

## 2. Current Phase
Phases 7–10 — Parallel final close-out; Phase 10 manual verification intentionally deferred.

## 3. Overall Status
PENDING RELEASE VERIFICATION.

## 4. COMPLETED
Web/Mobile foundations; Korean Levels 4–6 implementation foundation; AI provider profiles; Google Drive Web OAuth state hardening; Supabase memory metadata; prior CI/security hardening; canonical documentation migration; mobile test-config cleanup; Web Drive API route coverage and request-rate hardening; native Drive validation/upload-limit hardening; deeper Drive route security/rollback tests; Drive token-refresh/provider-error hardening; memory-delete CSRF/rate-limit hardening; native Drive callback deduplication; authenticated-user binding for mobile reminders; native Drive page-size ceiling; consolidated Phase 10 verification pack.

## 5. VERIFIED
- Live Supabase migration head: 20261007121841 — restore_rls_helper_execute, checked directly on 2026-10-08.
- Bootstrap prefixes 33/51/52: distinct SQL changes reconciled against live timestamped migration history on 2026-10-08.
- Web shared-memory storage precedence: Drive first when the authenticated Drive connection is active, then Cloudinary, then encrypted Supabase fallback; code and Vercel environment inventory checked 2026-10-08. Live public.memories currently has zero rows, so actual provider-use distribution is not claimed.
- Korean 4–6 runtime build: production deployment dpl_6CnQ1obMNiPZ2oweVqethGQix2bi reached READY from runtime baseline 1c3f78fa8fe34c518cb21b5834fbafa055892b82 on 2026-10-08.
- Korean 4–6 structural parity: Web and Mobile advanced curriculum files at the verified runtime baseline each contain 12 advanced lesson entries, 4 each for Levels 4, 5, and 6. This is implementation evidence, not a substitute for human content QA.
- Mobile Jest configuration cleanup: stale Sprint 2/Sprint 4 TODO wording removed and replaced with an explicit conservative baseline.

## 6. VERIFY
1. Google Cloud production Drive callback registration. Required URI: https://a-little-world-with-us.vercel.app/api/drive/callback. The code uses GOOGLE_DRIVE_REDIRECT_URI; Vercel has production/preview/development entries, but Google Cloud OAuth client registration is not readable through the available tools. Owner-side console verification is required at the final combined verification pass.

## 7. IN PROGRESS
- Drive OAuth E2E: code path is implemented, but no authenticated real-Google-account connect → consent → callback → Connected result is available in the tool environment.
- Drive-backed memory E2E: upload route writes storage_provider=google_drive and drive_file_id, and retrieval route reads the file by ID; live memories has zero rows, so upload/re-render has not been live-verified.
- Final Web ↔ Mobile smoke: implementation exists on both platforms, but no current authenticated cross-platform/device run is available.
- Korean 4–6 content QA: structural parity is verified, but no human QA artifact or executed content-review log is available.
- Final Memories UI pass: code is present; visual/device regression evidence is unavailable in the current tool environment.
- Period/fertility real-user scenario: cycle calculation code and parity tests exist, but no authenticated real-user scenario/test dataset is available.
- Dependabot alert refresh: repository dependency state can be inspected, but the available GitHub connector does not expose the repository Security/Dependabot alert API, so the live alert count cannot be asserted.

## 8. PENDING / BLOCKED
| Gate | Status | Exact blocker |
| --- | --- | --- |
| Google Cloud callback registration | VERIFY | Google Cloud Console OAuth client configuration is not readable through available tools. |
| Drive OAuth E2E | PENDING | Requires authenticated browser + real Google account consent/callback. |
| Drive memory upload/re-render E2E | PENDING | Requires authenticated couple + Drive connection + actual upload; live memories table is empty. |
| Web ↔ Mobile smoke | PENDING | Requires authenticated cross-platform/device execution. |
| Android/iOS build verification | BLOCKED | Expo/EAS project is accessible, but build trigger returned No repository found for the current appId; current iOS build list is empty. Existing Android FINISHED builds are old and not current-main evidence. |
| Dependabot refresh | BLOCKED | GitHub connector exposes code/issues/PRs but not the repository Dependabot alert endpoint; web access could not authenticate to the private Security/Dependabot page. |
| Memories UI visual pass | PENDING | Requires visual/browser/device evidence; source inspection alone is insufficient. |
| Period/fertility real-user scenario | PENDING | Requires authenticated test data or a controlled test fixture and observed UI result. |
| Korean 4–6 content QA | PENDING | Structural parity is evidenced (12 lessons; 4 per Level 4–6 on Web/Mobile), but no executed human/content QA artifact exists. |

## 9. DEFERRED
Supabase index/FK optimization; platform-tier leaked-password protection; breaking framework/toolchain upgrades.

## 10. REMAINING RELEASE GATES
Google Cloud callback → authenticated Drive E2E → Drive memory upload/re-render → Web/Mobile smoke → native build/device verification → Memories visual verification → Period/fertility scenario → Korean content QA → Dependabot refresh.

## 11. PARALLEL WORK RULE
Do not stop repository-side preparation while waiting for a manual gate. Continue the next code-side track in parallel; collect API keys/secret values from the owner only when the implementation is ready to wire them. Manual browser/device/console verification is intentionally batched at the end.

## 12. VERIFICATION TRIGGER TABLE
| Trigger | Ownering evidence | Current action |
| --- | --- | --- |
| Google Cloud OAuth client/redirect change | Google Cloud OAuth client + Vercel env + authenticated callback | Require external Console evidence and real callback |
| Drive OAuth code/env change | Exact callback/start code + Vercel env + authenticated E2E | Re-run connect/callback |
| Drive memory storage/retrieval change | Upload route + Supabase drive_file_id + Drive file retrieval | Re-run upload/re-render/delete |
| Korean 4–6 source/data change | Exact commit + Vercel build + Web/Mobile content QA artifact | Build alone is not content QA |
| Mobile native configuration change | EAS build record for current commit + device smoke | Old artifacts do not count |
| Dependabot/security alert state change | GitHub Security/Dependabot alert list | Refresh live alert count before release |
| Memories UI/component change | Current browser/device screenshot or visual regression result | Source inspection alone is insufficient |
| Period/fertility logic/UI change | Controlled/authenticated scenario with observed result | Do not infer real-user correctness from unit tests alone |

## 13. LAST VERIFIED
2026-10-08 — Supabase head, bootstrap numbering, storage precedence/configuration, Korean runtime build, Korean structural parity, current release blockers, Drive API coverage, Drive token-refresh/provider-error hardening, and memory-delete CSRF/rate-limit hardening re-audited. GitHub Actions for SHA `e0a4ebc0` reported Secret scan, CodeQL, E2E Tests, and Production Smoke E2E successful; the Test workflow failed Web TypeScript before the follow-up source fixes below. Local verification was then run after those fixes.

## 14. NEXT CODE-SIDE WORK
Continue the prepared close-out phases in parallel:
- Phase 7: Drive storage consistency/token-refresh coverage is hardened; remaining work is authenticated production E2E evidence.
- Phase 8: re-audit native OAuth/deep links, permissions, notifications, location, WebRTC, and offline recovery configuration; prepare current-main EAS verification inputs.
- Phase 9: memory deletion CSRF/rate-limit coverage is hardened; continue the highest-risk authenticated-route matrix and provider-neutral emergency email preparation.
- Phase 10: use `docs/FINAL_VERIFICATION.md` once Phases 7–9 are complete; perform the manual checks once, at the end.
These phases overlap intentionally; an external blocker on one track does not pause repository-side work on the others.
Owner-side manual verification remains last.

## 15. NON-RELEASE TECHNICAL BACKLOG FOUND IN FINAL AUDIT
- Web Vitest now includes API routes in coverage; Drive OAuth start/callback plus Drive status/upload/file/delete/disconnect route tests are present, covering auth, authorization, CSRF, rate limiting, and upload rollback.
- check-missed-checkin has push notification delivery, while emergency-contact email delivery remains provider-dependent. No fake email delivery is claimed; provider/API key wiring is the next code-side integration once the provider credentials are supplied.
- No FIXME/HACK markers were found in the searched repository scope.


## Close-out ledger
- Phase 7–9 remain parallel code-side tracks.
- Phase 10 manual verification is consolidated into `docs/FINAL_VERIFICATION.md` and remains last.
- Phases 11–15 are pre-staged in `docs/RELEASE_CLOSEOUT.md` for evidence-driven fixes, release freeze, monitoring, product evolution, and long-term hardening.


## Drive-first archive track (2026-10-08)
- Repository-side implementation now treats Google Drive as persistent original media/archive, with Supabase as metadata/index and local storage as cache/offline only.
- Added organized Drive folders for app-created Memories and Chat archives, external memory-folder sync, Drive-backed Web/Mobile chat images, daily chat archive indexing, and safe message deletion that preserves Drive originals.
- Added Supabase archive/index migration and updated release evidence rules.
- Remaining gates are authenticated production E2E, OAuth reauthorization under the broader Drive scope, current-main native/device verification, and regression/CI evidence. These are not marked complete by source changes alone.


## 2026-10-08 Drive-first implementation checkpoint
- Latest repository-side Drive-first archive work is on `main`; the Supabase live project now has the Drive archive/index migrations applied and verified.
- A Vercel build from commit `8c42ae5` exposed four TypeScript errors in the new Drive archive work; those source errors were fixed on subsequent commits. No successful Vercel rebuild of the corrected latest SHA is available yet because the Vercel Hobby deployment API hit its daily deployment limit. Do not treat the latest code as production-verified until a new build succeeds.
- The corrected architecture includes Drive-first Memory uploads, organized couple/year folders, external Drive-memory sync, Drive-backed chat images, daily chat archives, explicit permanent Drive deletion, partner Drive-folder sharing, and partner-connection fallback for reads after owner connection loss.


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
- Local verification on the working tree: Web TypeScript passes; Web Vitest passes 26 files / 100 tests, including the new chat-archive regression suite; Mobile TypeScript passes; Mobile Jest passes 5 suites / 17 tests. A fresh GitHub Actions run for the eventual commit is still required.
- Vercel work is intentionally paused per owner request. No new deployment attempted as part of this continuation.

- Additional permanent-delete audit fix: `/api/drive/delete` now applies same-origin protection and removes ownerless retained archive index rows by archive ID after the shared-couple authorization helper has approved the purge. Added a regression case for this account-erasure edge case; the Drive delete route suite passed 4/4 locally.


## 2026-10-09 grouped audit continuation
- Fixed the Web TypeScript failure in the archive message type by aligning its optional fields with the message objects passed by chat; Web typecheck now passes.
- Fixed route-test infrastructure/root causes in one group: the server-only Drive helper now has an explicit test mock; the Drive status test mocks `getDriveConnectionInfo`; the OAuth callback test checks the response cookie deletion; and multipart upload tests use the Node runtime to avoid jsdom cross-realm `File`/`FormData` failures.
- Fixed B2 NUL validation to reject an actual NUL byte (not a literal backslash-zero sequence). Added coverage proving cross-couple object names are denied.
- Added same-origin protection to Drive chat image upload and daily archive write routes. Fixed archive date validation, including impossible calendar dates, and expanded daily JSON records to preserve reply, encryption, edit/delivery/seen metadata and media duration.
- Settings now exposes the Drive full-folder reauthorization state and a reconnect action when the connected grant needs broader scope.
- Verification evidence from this working tree: Web typecheck PASS; Web Vitest PASS (25 files / 97 tests, plus the newly added chat-archive suite PASS 3/3); Mobile typecheck PASS; Mobile Jest PASS (5 suites / 17 tests). Web ESLint completes with 0 errors and 33 existing warnings. These are local working-tree results; the post-commit GitHub Actions run and production authenticated E2E remain pending.
- Vercel remains intentionally paused; no deployment was triggered.
