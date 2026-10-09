# Testing

Owner: Engineering / QA
Update when: tests or acceptance criteria change
Last Updated: 2026-10-09

Test layers: Web lint/TypeScript/unit/accessibility/build; Mobile TypeScript/lint/Jest; GitHub Secret Scan/CodeQL; production smoke/E2E; Supabase-backed authenticated E2E; native/device/offline verification.

Automated PASS is evidence for the tested revision only. Full authenticated cross-device flows, Drive E2E, native permissions, offline/media recovery, visual UI regression, and real-user period/fertility scenarios remain release-boundary checks until exercised.

## Current close-out evidence
- Local Web checks on the current working tree: `npm --prefix apps/web test` PASS (26 files / 102 tests); `npm --prefix apps/web run typecheck` PASS; `npm --prefix apps/web run lint` PASS with 0 errors and 33 warnings.
- Local Mobile checks: `npm --prefix apps/mobile run typecheck` PASS; `npm --prefix apps/mobile test -- --runInBand` PASS (5 suites / 17 tests).
- These results apply to the tested working tree; GitHub Actions must be rerun after the resulting commit, and no production authenticated Drive E2E is implied.
- Korean 4–6 Web/Mobile structural parity: runtime-baseline advanced curriculum contains 12 advanced lessons on each platform, 4 each for Levels 4, 5, and 6. Human content QA is still pending.
- Korean runtime production build: Vercel deployment dpl_6CnQ1obMNiPZ2oweVqethGQix2bi reached READY on 2026-10-08.
- Period/fertility: cycle logic and parity tests exist, but no authenticated real-user scenario is available.
- Memories: source inspection confirms Drive upload writes drive_file_id and retrieval reads it; no live memory row exists for E2E evidence.
- Mobile Jest: stale Sprint 2/Sprint 4 planning comments were removed; the current configuration uses an explicit conservative 5% global line baseline until the suite is expanded.

## Verification Trigger Table
| Change trigger | Required evidence refresh |
| --- | --- |
| Korean 4–6 source/data changes | Current Vercel production/preview build log + Web/Mobile content QA artifact |
| Google Drive OAuth env or Google Cloud client changes | Exact redirect URI registration + authenticated connect/callback E2E |
| Storage provider code/env changes | Provider configuration inventory + upload/retrieve/delete evidence |
| Drive chat archive/upload changes | Web route tests + valid/invalid date, same-origin, couple authorization, archive merge, media reference, and image/PDF attachment checks |
| Supabase bootstrap/migration changes | Live migration list + schema/RLS/advisor checks |
| UI token/component changes | Web/Mobile lint/typecheck/tests + current visual/device evidence |
| Mobile native config/build changes | EAS build for current commit + device smoke |
| Dependabot alert state changes | Live GitHub Security/Dependabot alert list + remediation/dismissal evidence |
| Period/fertility logic/UI changes | Controlled authenticated scenario with observed UI output |

## Evidence rule
DONE means implementation exists and relevant automated checks pass. VERIFIED requires environment evidence appropriate to the claim. Configuration is not live behavior.

- Drive memory sync ownership coverage: same-origin protection, selected-couple-only traversal, and skipping a Drive file ID already indexed to another couple.

- Cookie-authenticated mutation CSRF audit: AI generation routes, couple export, feedback, and browser push-subscription POST/DELETE now enforce same-origin checks; focused regression tests cover AI Guardian, export, feedback, and push-subscription rejection before session lookup.

- Additional mutation-route CSRF tests cover Drive memory export and media upload, alongside the earlier AI Guardian, export, feedback, and push-subscription cases.

- Verified exact revision `8485837835d74a181746a1693f6e7b7341703d21`: all five GitHub Actions workflows passed; Web coverage suite passed 31 files / 110 tests and Mobile tests passed 1 suite / 3 tests. Mutation-route source scan found zero API `POST`/`PUT`/`PATCH`/`DELETE` handlers without an explicit same-origin guard.
