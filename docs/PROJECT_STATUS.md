# Project Status & Maintenance Checklist

This file is the working checklist for the current **A Little World With Us** release-readiness pass.

## Current workflow

- **Primary development branch: `main`.**
- Code-side fixes are applied directly to `main` unless a temporary branch is explicitly required for a safety reason.
- Do not create unnecessary feature/cleanup branches.
- After every material change, run the relevant automated checks before considering the change complete.
- Keep Web ↔ Mobile behavior and data-flow parity in scope when changing shared features.
- Never commit secrets, OAuth credentials, encryption keys, provider tokens, or real private relationship data.

## Documentation update rule

Update documentation as part of the same code-side change when behavior or project state changes:

- **README.md** — update when repository structure, setup, major architecture, deployment, or user-facing project behavior changes.
- **docs/PROJECT_STATUS.md** (this file) — update the checklist/status after each major audit, deployment, security, CI, database, or release-readiness milestone.
- **CHANGELOG.md** — update for meaningful user-facing behavior, fixes, dependency/security changes, or release-relevant changes.
- Relevant focused docs under **docs/** — update when provider setup, storage, security, deployment, architecture, or operational instructions change.

Do not leave documentation updates as a forgotten final step. Treat them as part of the implementation.

## Release-readiness checklist

### Repository / public readiness
- [x] Repository is public.
- [x] No real credentials found in the current source tree during the public-readiness audit.
- [x] Private relationship date removed from source/test fixtures and moved to configuration.
- [x] Public-repository security scan passes.

### Web / Vercel
- [x] Production Vercel build is READY.
- [x] Production alias resolves to the current deployment.
- [x] Web lint passes.
- [x] Web TypeScript check passes.
- [x] Web unit tests pass.
- [x] Web accessibility tests pass.
- [x] Web production build passes.
- [x] Basic unauthenticated production smoke checks pass.
- [x] Production Playwright smoke E2E passes against the live production alias.
- [ ] Full production Google Drive OAuth flow still needs real-user/device verification.

### GitHub Actions / security
- [x] Test workflow passes on `main`.
- [x] Secret scan passes.
- [x] CodeQL passes.
- [x] Mobile typecheck passes.
- [x] Mobile lint passes.
- [x] Mobile tests pass.
- [ ] Verify the full Supabase-backed E2E run now that the dedicated GitHub secrets have been supplied; the current docs-only curriculum commit did not trigger the E2E workflow.

### Dependabot
- [x] Web `source-map-js` updated to 1.2.2 and PR #59 merged after all PR checks passed.
- [x] Mobile `source-map-js` updated directly on `main` to 1.2.2.
- [x] Dependabot mobile PR #60 closed as superseded because its lockfile contained unrelated churn; the targeted security update was applied directly to `main`.
- [ ] Re-check the Dependabot alert list after GitHub refreshes the alerts.
- [ ] Investigate any remaining alerts individually; do not delete/suppress an alert merely to make the count zero.

### Database
- [ ] 121 unused-index findings remain in the live advisor; no indexes were dropped blindly.
- [ ] Review foreign-key index recommendations against real query paths before adding/removing indexes.
- [x] Reviewed the nine SECURITY DEFINER RPC findings: they are intentional authenticated RPCs with `SECURITY DEFINER`, explicit `auth.uid()` authorization checks, and `SET search_path TO ''`.
- [ ] Keep leaked-password protection deferred per the current project constraint/plan.
- [ ] Revisit database optimization after Web ↔ Mobile parity and end-to-end flows are stable.

### Device / native verification
- [ ] Android/iOS build verification.
- [ ] Camera/media permissions.
- [ ] Notifications.
- [ ] Background location and maps/location permissions.
- [ ] Native Google OAuth / Google Drive flow.
- [ ] WebRTC calling.
- [ ] Offline recovery and media retrieval on a real device.

### Final product verification
- [ ] Full Web ↔ Mobile feature parity audit.
- [ ] Memories/media retrieval, not only upload.
- [ ] Calendar / Plans / Finance flows.
- [ ] Location / Safety flows.
- [ ] Notifications / offline recovery.
- [ ] Memories UI final pass, including card alignment, pin interaction, theme contrast, and requested page ordering.
- [ ] Period/fertility calculation and wording final verification.
- [x] Final production smoke test after the latest code changes: live Playwright smoke E2E passed and Vercel reported no runtime errors in the verification window.

## Working rule for future sessions

Before making a new change:

1. Check this file and the current `main` state.
2. Make the smallest safe code-side change.
3. Run the relevant checks.
4. Update this file and the relevant README/docs/changelog in the same work session.
5. Re-check production/CI status.
6. Only then mark the item complete.

Manual-only provider/device actions should be kept separate from code-side work and listed explicitly when they remain.

## 2026-10-06 — E2E secrets / Actions queue optimization

- Dedicated Supabase-backed E2E remains gated on two GitHub repository secrets: `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY`. These must point to a non-production Supabase project; do not use production credentials for E2E.
- The DB RLS regression workflow also accepts the separate `STAGING_DATABASE_URL` secret for its staging database check.
- Added workflow-level concurrency with `cancel-in-progress: true` so a newer run for the same branch/PR cancels stale queued/in-progress work.
- Docs-only changes now skip the main Test, CodeQL, full E2E, and Production Smoke workflows; Secret scan still runs, while database policy checks already run only for database-related paths.
- Added missing Mobile environment documentation for `EXPO_PUBLIC_WEB_URL` and `EXPO_PUBLIC_COUPLE_START`. Native Google Drive client IDs remain device/EAS setup values, not Vercel variables.
- Current Vercel production environment has the core application variables configured. Server-side `SENTRY_DSN`, `AXIOM_TOKEN`, `AXIOM_DATASET`, and `NEXT_PUBLIC_GA_ID` are not configured; these are observability/analytics features rather than blockers for the core production app.
- GitHub Security and quality currently reports additional alerts, but the current connector cannot retrieve the repository's private alert-detail endpoints. No alert was dismissed blindly; exact alert titles/details must be reviewed before fixing or dismissing.

## 2026-10-06 — Security & quality alert remediation

- Reviewed the GitHub Security & quality screenshots: 5 CodeQL code-scanning alerts and 5 Dependabot vulnerability alerts were confirmed.
- Fixed the 5 CodeQL findings in source: strict YouTube host/protocol validation, strict YouTube `postMessage` origin/source validation, SHA-256 Cloudinary request signing, and unbiased `crypto.randomInt()` description selection.
- Updated the Web TanStack React Query devtools stack and pinned the transitive `seroval` package to 1.6.8; the two critical Seroval advisories are no longer present in local `npm audit` results.
- Updated Mobile `sprintf-js` from 1.0.3 to 1.1.3 for the reported development-tool DoS advisory.
- The remaining `braces` alert is not currently fixable without a major upstream/toolchain change: the project already uses the latest 3.0.3 release available for the affected dependency path. It should be individually reviewed/dismissed as a development-only, no-fixed-version risk rather than forcing a breaking Expo/Tailwind upgrade.
- The remaining `postcss-selector-parser` alert is a moderate development/build-tool finding. The current Tailwind 3.4.17 toolchain constrains the dependency to the 6.x line; upgrading it to the fixed 7.x line would require a broader Tailwind/PostCSS compatibility change. Do not force that change during release hardening; review/dismiss individually if GitHub still reports it after refresh.
- No security alert was mass-dismissed.


## 2026-10-06 — final audit continuation

- Removed the remaining hardcoded private relationship/birthday dates found in the Web constants/dashboard; current values must come from configured/runtime data.
- Normalized the shared Web Card primitive so CardHeader/CardContent do not inherit a second outer padding layer.
- Updated range-control styling to use the active theme accent instead of a hardcoded gold color.
- Improved Memories category/delete badge contrast, including Monochrome-safe foreground behavior.
- Verified the latest Web tree with clean install, lint, TypeScript, unit tests, and production build in a clean Vercel sandbox after the UI changes.
- Latest production Vercel deployment for `main` is READY and the runtime-error window reports no runtime errors.
- Vercel environment audit: all core Supabase, Drive OAuth, encryption, Redis, storage, push, and AI provider variables used by the current production code are present except Cloudflare's account ID. The existing `CLOUDFLARE_API_TOKEN` is now accepted by the code; `CLOUDFLARE_ACCOUNT_ID` still needs to be supplied if Cloudflare Workers AI is intended to be an active fallback.
- Optional observability/analytics variables remain absent: server `SENTRY_DSN`/Sentry release-upload credentials, Axiom, and Google Analytics. These do not block core app operation.
- Dependabot `sprintf-js` advisory #21 remains open because the GitHub advisory currently lists no patched version; the vulnerable package is development-only through `argparse`. Do not force a breaking toolchain upgrade just to make the alert count zero.
- Supabase performance advisor still reports 121 unused-index candidates; no indexes were dropped without workload evidence.
- Native Android/iOS, full Supabase-backed E2E, and physical-device verification remain release-boundary checks and cannot be truthfully marked complete from the current hosted tool access.
- Korean Learning already defines levels 1–7 in Web/Mobile types/UI, but the current bundled lesson/vocabulary seed data only covers Levels 1–3. Levels 4–6 require new curriculum lessons, vocabulary/examples, quizzes, translations/audio, and corresponding seed/migration data on both Web and Mobile before those levels are genuinely complete.


## 2026-10-07 — Korean curriculum architecture locked for future implementation

- Added docs/KOREAN_CURRICULUM.md as the canonical Korean-learning roadmap.
- Planned Our Korean Levels 1–10.
- Structured Korean is planned as Beginner = Our Korean Levels 1–5 and Intermediate = Our Korean Levels 6–10.
- Each level is planned as two terms/sub-levels, x-1 and x-2, giving a clear 1-1 → 1-2 → 2-1 → 2-2 style progression.
- Added four future curriculum layers: Our Korean, Structured Korean, Korea Life, and Couple Korean.
- Levels 1–5 are the Beginner progression, with Level 5 as the bridge toward Intermediate. Levels 6–10 are the Intermediate progression, with Level 10 as the bridge toward future Upper-Intermediate/Advanced content.
- Captured grammar, vocabulary, skills, exercise, AI, data-model, Web/Mobile parity, and definition-of-done requirements in the Korean curriculum document.
- Yonsei is treated only as structural inspiration/reference; all lessons, dialogues, examples, exercises, images, and audio must be original.
- Korean expansion remains a post-stabilization implementation phase and does not take priority over core app release-readiness.
- Future Korean ideas captured in the roadmap include Korea Life, Couple Korean, adaptive review, speaking practice, richer audio, and AI tutoring.


## 2026-10-07 — corrected Yonsei benchmark model

- Corrected the Korean roadmap so Yonsei 1-1 / 1-2 / 2-1 / 2-2 etc. are treated as **external level/difficulty benchmarks**, not as the app's own term naming convention.
- The intended model is: create an original Our Korean course that is approximately equivalent in learner ability to each referenced Yonsei level.
- The curriculum must not copy Yonsei textbook lessons, dialogues, exercises, images, audio, or answer keys.
- Current official Yonsei KLI information confirms Level 1 uses 1-1/1-2 materials and Level 2 uses 2-1/2-2 materials across vocabulary/grammar, speaking/writing, and listening/reading; higher-level equivalence will be researched and validated before being locked.


## 2026-10-07 — Phase 1–6 release audit continuation

### Phase 1 — Core app / parity
- Targeted source audit confirms Web and Mobile implementations exist for Memories/media, Finance, Calendar/Plans, Care/Cycle, Location/Safety, Notifications, and shared realtime/offline sync.
- Memories uses shared Supabase metadata and supports Google Drive media retrieval paths on both platforms.
- Full end-to-end parity remains a release verification item because real authenticated cross-device testing is not available through the repository tools.

### Phase 2 — CI / security
- Clean Web install: PASS.
- Web lint: PASS with existing warnings only.
- Web TypeScript: PASS.
- Web unit/accessibility suite: 13 files / 52 tests PASS.
- Web production build: PASS with audit-only placeholder Supabase environment values in the sandbox; no source secrets were used.
- Mobile clean install: PASS.
- Mobile TypeScript: PASS.
- Mobile ESLint: PASS with existing formatting warnings.
- Mobile Jest: 5 suites / 17 tests PASS.
- Mobile npm audit still reports Expo/toolchain ecosystem findings with major-version remediation paths; no breaking upgrade was forced during release hardening.

### Phase 3 — Database / backend
- No destructive index changes were made.
- Existing RLS, realtime, offline-sync, and FK-index hardening migrations remain in place.
- Unused-index and FK-advisor findings remain deferred until real workload evidence is available.

### Phase 4 — UI
- Existing Card/theme/contrast fixes remain intact.
- Source-level audit found no new compile/type blockers.
- Final visual/device verification remains separate because it requires an actual browser/device session.

### Phase 5 — Period / fertility
- Web and Mobile share the uncertainty-aware cycle model and matching higher/lower pregnancy-chance wording.
- Web cycle parity tests and Mobile cycle calculator tests pass.
- The UI includes the calendar-based estimate disclaimer.
- Real-user cycle-history scenarios still require final authenticated verification.

### Phase 6 — Reliability / recovery
- Mobile offline queue, network-state sync, media cache, and shared realtime infrastructure are present in source.
- Real device offline/reconnect/media-recovery verification remains pending.
- Missed-check-in push notification path exists; emergency-contact email delivery remains provider-dependent and is intentionally not faked.

### Privacy cleanup
- Removed the remaining hardcoded private birthday reveal from the Memories page. Private occasion data must come from runtime/configured data rather than source literals.
- Latest production deployment for the cleanup commit is still building; it must reach READY before that deployment is treated as verified.


## 2026-10-07 — Phase 7–8 implementation

### Phase 7 — Korean curriculum foundation
- Locked the app to **6 learner-facing Korean levels**: Beginner Levels 1–2, Intermediate Levels 3–4, Advanced Levels 5–6.
- Each app level now carries an explicit Yonsei benchmark pair: 1-1+1-2 through 6-1+6-2.
- Web and Mobile Korean level types/UI no longer expose the old Level 7 model.
- AI Korean quiz validation now accepts levels 1–6 only.
- Supabase Korean learning bootstrap constraints now target levels 1–6; the live Korean lesson/vocabulary tables were checked and currently contain no rows, so no existing Level 7 production data was altered.
- Existing bundled lesson/vocabulary content remains Levels 1–3 only; Levels 4–6 still require original authored curriculum content and QA before being marked complete.

### Phase 8 — Release gate
- Final release gate is now documented as: latest `main` build/CI green → production READY → authenticated smoke/E2E → Web/Mobile parity → device/offline verification → manual acceptance.
- No claim of full device or authenticated cross-device verification is made until those environments are actually exercised.



## 2026-10-07 — Web audit follow-up

- Production investigation traced the Location/private-page failures to an RLS helper privilege mismatch in Supabase.
- The live database already contains the required application tables and an accepted couple link for the two test accounts.
- The RLS helper grant was corrected so authenticated sessions can evaluate the existing policies while anonymous access remains restricted.
- Original Korean Level 4–6 bundled lesson/vocabulary content was added and wired into Web/Mobile learning and quiz flows.
- Web verification remains the gate before native-device work and API/provider key entry.


## Final web gate verification — 2026-10-07

- Supabase logs after the RLS grant fix show **0** occurrences of `permission denied for function is_linked_user` and no Postgres `ERROR` records in the verification window.
- GitHub final code commit verification: Secret scan **PASS**, CodeQL **PASS**, Web/Mobile Test workflow **PASS**, Production Smoke E2E **PASS**, and full Supabase-backed E2E **PASS**.
- Vercel production deployment for the final docs state is **READY**; production runtime errors in the latest verification window are **0**.
- No native-device or native Google OAuth claim is made yet; those remain the next stage only after the Web gate is accepted.


## 2026-10-07 — Google Drive OAuth audit/fix

- Found a second Drive-specific issue: the app's Drive flow uses `/api/drive/callback`, while the previously documented/entered Google OAuth callback was `/api/auth/callback/google`. These are different endpoints, and Google requires the redirect URI to exactly match an authorized URI. The correct Drive callback is `https://a-little-world-with-us.vercel.app/api/drive/callback`.
- Corrected the Vercel Production/Preview/Development `GOOGLE_DRIVE_REDIRECT_URI` configuration targets without exposing secret values.
- Found a Preview-specific flow issue: Vercel preview hosts cannot use the production host's cookies during the canonical Google callback. The OAuth state is now HMAC-signed with the originating return origin, and the production callback can safely complete the connection and return to the originating approved Vercel preview host.
- Added the preview callback handling and documented the exact Google Cloud redirect URI requirement.
- Google Cloud Console still needs the exact Drive callback URI registered on the Web OAuth client before an end-to-end Google consent test can succeed.
