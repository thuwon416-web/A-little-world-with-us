# Changelog

## Unreleased

### Phase 1–6 release audit
- Completed a targeted Web/Mobile source audit for shared core features, sync, media, safety, notifications, and cycle/fertility behavior.
- Re-verified clean Web and Mobile installs plus Web lint/typecheck/tests/build and Mobile typecheck/lint/tests.
- Removed a remaining hardcoded private birthday reveal from the Memories page.
- Recorded the remaining device, authenticated E2E, database workload, and provider-dependent boundaries in docs/PROJECT_STATUS.md.

# Changelog

## Unreleased

### Korean curriculum roadmap
- Added the canonical Korean curriculum architecture in docs/KOREAN_CURRICULUM.md.
- Corrected the Yonsei relationship: Yonsei 1-1 / 1-2 / 2-1 / 2-2 etc. are external proficiency benchmarks for equivalent Our Korean levels, not copied lesson structure or app-created terms.
- Planned an original Our Korean progression benchmarked against Yonsei's numbered levels.
- Added Korea Life and Couple Korean as dedicated future learning tracks.
- Kept Korean expansion behind core app stabilization and release verification.

# Changelog

## Unreleased

### Korean curriculum roadmap
- Added the canonical Korean curriculum architecture in docs/KOREAN_CURRICULUM.md.
- Planned Our Korean Levels 1–10, with Structured Korean mapped to Beginner Levels 1–5 and Intermediate Levels 6–10.
- Planned paired sub-levels from 1-1 / 1-2 through 10-1 / 10-2.
- Added Korea Life and Couple Korean as dedicated future learning tracks.
- Defined the curriculum as original, app-specific content rather than copied Yonsei/course material.
- Kept Korean expansion behind core app stabilization and release verification.

## 2026-10-06 — E2E environment / Actions queue optimization

- Documented the two dedicated non-production Supabase secrets required to run the full GitHub Playwright E2E suite.
- Added workflow concurrency cancellation so stale runs are canceled when newer runs arrive for the same branch/PR.
- Added docs-only path filters so routine README/docs/changelog edits do not trigger the full Test, CodeQL, E2E, or Production Smoke workflows; secret scanning remains enabled.
- Documented Mobile runtime environment keys used by server-backed features and relationship-day configuration.

## 2026-10-06 — production smoke verification / database audit

- Added environment-aware Playwright configuration so the same suite can target either the local Next.js server or an external deployment.
- Added a Production Smoke E2E workflow that runs Chromium tests against the live Vercel production alias without requiring Supabase credentials.
- Verified the latest `main` commit with passing Test, CodeQL, Secret scan, Production Smoke E2E, and Dependabot update workflows.
- Verified the latest production Vercel deployment is READY and found no runtime error clusters in the verification window.
- Audited the live Supabase advisors: 121 unused-index findings remain intentionally deferred, and the nine authenticated SECURITY DEFINER RPC findings were reviewed as intentional functions with explicit `auth.uid()` checks and an empty search path.
- Updated the persistent project status and README to distinguish production smoke E2E from the still-pending dedicated non-production Supabase E2E environment.

## 2026-10-06 — public release-readiness / CI stabilization

- Fixed the Web Sentry Next.js configuration entrypoint so the production Vercel build succeeds.
- Fixed Mobile Expo FileSystem/cache compatibility and sync-service TypeScript issues; Web and Mobile CI checks now pass.
- Updated `source-map-js` to 1.2.2 in both Web and Mobile lockfiles to address the current security advisory.
- Merged the verified Web Dependabot update and superseded the Mobile Dependabot PR after applying the targeted lockfile update directly to `main`.
- Added `docs/PROJECT_STATUS.md` as the persistent release-readiness and documentation-maintenance checklist.
- Updated README guidance to keep code-side work on `main` and require documentation updates alongside material changes.

## 2026-10-06 — Phase A–D / provider configuration hardening

- Added the production Provider / API Configuration operator checklist for Supabase, Cloudinary, Backblaze B2, Google Drive, Upstash, AI, observability, web push, and Sentry.
- Documented the Vercel rule that `apps/web` remains the Root Directory and build/install/dev/output command overrides must remain empty.
- Documented that `apps/web/vercel.json` is retained only for cron definitions; a root build-config `vercel.json` must not be reintroduced.
- Added public-repository readiness rules for secret hygiene, CI secrets, Gitleaks, and provider credential boundaries.
- Reconciled design documentation with the implemented Phase A–D foundation while keeping final visual/accessibility regression testing open until evidence is collected.

## 2026-10-05 — final production hardening pass

- Aligned Mobile memory storage contracts with the Backblaze B2 metadata fields used by the shared backend.
- Optimized the final `messages` and `vault_credentials` RLS policies to evaluate `auth.uid()` once per statement without changing authorization semantics; the corresponding live Supabase performance advisor warnings are cleared.
- Confirmed the remaining Supabase security advisor warnings are the nine intentional authenticated SECURITY DEFINER RPCs plus the account-plan-dependent leaked-password warning.
- Reconnected the existing Vercel Git project to `main` with `apps/web` as the root and triggered a fresh deployment from the latest Web commit.

# Changelog

## 2026-10-05 — final code-side integration pass

- Finalized the tiered media storage model: Cloudinary for small memory/profile imagery, Supabase Storage for shared documents/chat attachments, Backblaze B2 for large shared media, and Google Drive for export/archive.
- Added B2 private upload/download authorization and provider metadata for large chat/media objects.
- Added Google Drive memory export support for provider-backed memories.
- Hardened live Supabase policies for location-address cache access, partner message deletion, and vault credential ownership, then verified the live state.
- Added Bearer-token support to the shared AI route auth wrapper so Mobile AI calls use the same server authorization boundary as Web.
- Hardened Google Drive upload rate limiting and removed raw provider errors from API responses.
- Corrected chat encryption wording so it no longer claims end-to-end encryption.
- Updated README and storage/operations documentation with the final architecture and verification boundary.

## 2026-10-01 — final UI parity pass

- Memory hub reordered to Photo Memories → Memory Map → Time Capsule → Add to Our Memories → Our Story, with the AI companion kept at the bottom.
- Memory previews now show five rotating items with an explicit View all action on Web and Mobile.
- Theme secondary text contrast was strengthened across shared theme tokens.
- Web reminders now refresh from realtime shared changes, matching Mobile behavior.
- Google Drive OAuth start/state failures now return controlled setup errors instead of uncaught 500 responses.

## [Unreleased] — Project completion and maintenance

The current `main` line contains the completed Web ↔ Mobile feature-parity, Care/Period, chat/realtime, location/safety, media, and reliability/security work tracked in the project plan.

### Completed

- Web and Expo Mobile feature parity for shared couple features.
- Care period-date persistence through the canonical `save_care_period_dates(uuid, date[])` RPC.
- Calendar-based cycle estimates with explicit uncertainty-aware pregnancy-chance wording.
- Chat media, voice, reactions/edit/reply support and realtime synchronization.
- Couple-scoped RLS and security hardening across shared data.
- Location sharing, realtime updates, geofence, battery and missed-check-in safety flows.
- Private media handling with signed access and versioned encryption helpers.
- Google Drive web OAuth preparation for optional Drive-backed memory media.
- Retention cleanup for location history (7 days) and temporary AI context (30 days).
- CI coverage for Web lint/typecheck/tests/A11Y and Mobile lint/typecheck/tests.

### Intentionally deferred

- Google Cloud/Vercel OAuth credentials and production Drive configuration require operator setup.
- Native Android/mobile Google Drive OAuth is a separate deployment setup step.
- Supabase unused-index cleanup remains an optimization decision.
- Remaining unindexed foreign-key warnings outside the already-covered indexes can be reviewed separately; `user_locations.couple_id` is intentionally excluded from the broader migration scope and has its own index migration.

### Verification

Before production release, run the repository CI checks and complete real-device smoke tests for authentication, couple linking, Memories, Care/Period, Calendar, Finance, Reminders, chat, and location permissions.

## 2026-10-06 — Security & quality alert remediation

- Fixed all five reported CodeQL findings on `main`: YouTube URL/origin validation, Cloudinary SHA-256 signing, and unbiased cryptographic random selection.
- Updated TanStack React Query devtools and pinned `seroval` to 1.6.8 to address the two critical Seroval advisories.
- Updated Mobile `sprintf-js` to 1.1.3 for the reported development-time DoS advisory.
- Documented the two remaining upstream/toolchain vulnerability cases (`braces` and `postcss-selector-parser`) as items to review individually rather than applying risky major dependency overrides.


## 2026-10-06 — final audit continuation

- Removed remaining hardcoded private relationship/birthday dates from Web source.
- Normalized shared Card padding to prevent nested CardHeader/CardContent spacing from becoming oversized.
- Made range controls theme-aware and improved Memories badge/delete contrast.
- Aligned Cloudflare Workers AI configuration with `CLOUDFLARE_API_TOKEN` while retaining `CLOUDFLARE_API_KEY` compatibility.
- Reverified Web clean install, lint, typecheck, unit tests, and production build after UI changes.
- Reverified production Vercel deployment and runtime-error window.
- Documented the remaining `sprintf-js` advisory as upstream/no-fixed-version and development-only, rather than forcing a breaking dependency change.
- Documented Korean Learning Levels 4–6 as content/data work still required; the current bundled curriculum is complete through Level 3.
