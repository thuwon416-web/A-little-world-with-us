# Current State

Owner: Project maintainers
Update when: release gates or verification evidence change
Last Updated: 2026-10-08

## 1. Current Release
Final production close-out audit.

## 2. Current Phase
Phase 6 — Final Production Audit + User Verification.

## 3. Overall Status
PENDING RELEASE VERIFICATION.

## 4. COMPLETED
Web/Mobile foundations; Korean Levels 4–6 implementation foundation; AI provider profiles; Google Drive Web OAuth state hardening; Supabase memory metadata; prior CI/security hardening; canonical documentation migration.

## 5. VERIFIED
- Live Supabase migration head: `20261007121841 — restore_rls_helper_execute`, checked directly on 2026-10-08.
- Bootstrap prefixes 33/51/52: distinct SQL changes reconciled against live timestamped migration history on 2026-10-08.
- Web shared-memory storage precedence: Drive first when the authenticated Drive connection is active, then Cloudinary, then encrypted Supabase fallback; code and Vercel environment inventory checked 2026-10-08. Live `public.memories` currently has zero rows, so actual provider-use distribution is not claimed.
- Korean 4–6 runtime build: production deployment `dpl_6CnQ1obMNiPZ2oweVqethGQix2bi` reached READY from runtime baseline `1c3f78fa8fe34c518cb21b5834fbafa055892b82` on 2026-10-08. GitHub compare shows the later commits to current main are documentation-only.
- Korean 4–6 structural parity: Web and Mobile advanced curriculum files at the verified runtime baseline each contain 12 advanced lesson entries, 4 each for Levels 4, 5, and 6. This is implementation evidence, not a substitute for human content QA.

## 6. VERIFY
1. **Google Cloud production Drive callback registration.** Required URI: `https://a-little-world-with-us.vercel.app/api/drive/callback`. The code uses `GOOGLE_DRIVE_REDIRECT_URI`; Vercel has production/preview/development entries, but secret values are masked and Google Cloud OAuth client registration is not readable through the available tools. **Exact manual step:** Owner must log into Google Cloud Console → OAuth Client → Authorized redirect URIs → add/verify the required URI. Then complete one real connect/callback test.

## 7. IN PROGRESS
- **Drive OAuth E2E:** code path is implemented, but no authenticated real-Google-account connect → consent → callback → Connected result is available in the tool environment.
- **Drive-backed memory E2E:** upload route writes `storage_provider=google_drive` and `drive_file_id`, and retrieval route reads the file by ID; live `memories` has zero rows, so upload/re-render has not been live-verified.
- **Final Web ↔ Mobile smoke:** implementation exists on both platforms, but no current authenticated cross-platform/device run is available.
- **Korean 4–6 content QA:** structural parity is verified, but no human QA artifact or executed content-review log is available.
- **Final Memories UI pass:** code is present; visual/device regression evidence is unavailable in the current tool environment.
- **Period/fertility real-user scenario:** cycle calculation code and parity tests exist, but no authenticated real-user scenario/test dataset is available.
- **Dependabot alert refresh:** repository dependency state can be inspected, but the available GitHub connector does not expose the repository's Security/Dependabot alert API, so the live alert count cannot be asserted.

## 8. PENDING / BLOCKED
| Gate | Status | Exact blocker |
| --- | --- | --- |
| Google Cloud callback registration | VERIFY | Google Cloud Console OAuth client configuration is not readable through available tools. |
| Drive OAuth E2E | PENDING | Requires authenticated browser + real Google account consent/callback. |
| Drive memory upload/re-render E2E | PENDING | Requires authenticated couple + Drive connection + actual upload; live memories table is empty. |
| Web ↔ Mobile smoke | PENDING | Requires authenticated cross-platform/device execution. |
| Android/iOS build verification | BLOCKED | Expo/EAS project is accessible, but build trigger returned `No repository found for appId e408249d-9b07-4d2f-8df3-6115e4d47bab`; current iOS build list is empty. Existing Android FINISHED builds are old and not current-main evidence. |
| Dependabot refresh | BLOCKED | GitHub connector exposes code/issues/PRs but not the repository Dependabot alert endpoint; web access could not authenticate to the private Security/Dependabot page. |
| Memories UI visual pass | PENDING | Requires visual/browser/device evidence; source inspection alone is insufficient. |
| Period/fertility real-user scenario | PENDING | Requires authenticated test data or a controlled test fixture and observed UI result. |
| Korean 4–6 content QA | PENDING | Structural parity is evidenced (12 lessons; 4 per Level 4–6 on Web/Mobile), but no executed human/content QA artifact exists. |

## 9. DEFERRED
Supabase index/FK optimization; platform-tier leaked-password protection; breaking framework/toolchain upgrades.

## 10. REMAINING RELEASE GATES
Google Cloud callback → authenticated Drive E2E → Drive memory upload/re-render → Web/Mobile smoke → native build/device verification → Memories visual verification → Period/fertility scenario → Korean content QA → Dependabot refresh.

## 11. VERIFICATION TRIGGER TABLE
| Trigger | Ownering evidence | Current action |
| --- | --- | --- |
| Google Cloud OAuth client/redirect change | Google Cloud OAuth client + Vercel env + authenticated callback | Require external Console evidence and real callback |
| Drive OAuth code/env change | Exact callback/start code + Vercel env + authenticated E2E | Re-run connect/callback |
| Drive memory storage/retrieval change | Upload route + Supabase `drive_file_id` + Drive file retrieval | Re-run upload/re-render/delete |
| Korean 4–6 source/data change | Exact commit + Vercel build + Web/Mobile content QA artifact | Build alone is not content QA |
| Mobile native configuration change | EAS build record for current commit + device smoke | Old artifacts do not count |
| Dependabot/security alert state change | GitHub Security/Dependabot alert list | Refresh live alert count before release |
| Memories UI/component change | Current browser/device screenshot or visual regression result | Source inspection alone is insufficient |
| Period/fertility logic/UI change | Controlled/authenticated scenario with observed result | Do not infer real-user correctness from unit tests alone |

## 12. LAST VERIFIED
2026-10-08 — Supabase head, bootstrap numbering, storage precedence/configuration, Korean runtime build, Korean structural parity, and current release blockers re-audited.

## 13. NEXT
Owner-side Google Cloud callback verification and authenticated Drive E2E are the first concrete external gates. After those, run the current mobile/device and real-user acceptance gates.

## 14. NON-RELEASE TECHNICAL BACKLOG FOUND IN FINAL AUDIT
- Mobile Jest coverage config still contains stale Sprint 4/Sprint 2 TODO wording; update the planning comment or raise thresholds after coverage work.
- Web Vitest excludes API routes until route-level API coverage is added.
- `check-missed-checkin` logs a would-email action rather than sending an email; an email provider integration is not implemented. Do not claim external emergency-email notification as complete until this is implemented and tested.
- No FIXME/HACK markers were found in the searched repository scope.
