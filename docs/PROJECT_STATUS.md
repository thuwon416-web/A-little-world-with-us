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
- [ ] Full production Google Drive OAuth flow still needs real-user/device verification.

### GitHub Actions / security
- [x] Test workflow passes on `main`.
- [x] Secret scan passes.
- [x] CodeQL passes.
- [x] Mobile typecheck passes.
- [x] Mobile lint passes.
- [x] Mobile tests pass.
- [ ] Real Supabase-backed E2E environment still needs its dedicated GitHub secrets before Playwright can run as a real E2E test.

### Dependabot
- [x] Web `source-map-js` updated to 1.2.2 and PR #59 merged after all PR checks passed.
- [x] Mobile `source-map-js` updated directly on `main` to 1.2.2.
- [x] Dependabot mobile PR #60 closed as superseded because its lockfile contained unrelated churn; the targeted security update was applied directly to `main`.
- [ ] Re-check the Dependabot alert list after GitHub refreshes the alerts.
- [ ] Investigate any remaining alerts individually; do not delete/suppress an alert merely to make the count zero.

### Database
- [ ] Classify unused indexes before dropping anything.
- [ ] Review foreign-key index recommendations against real query paths.
- [ ] Keep intentional SECURITY DEFINER RPCs and verify their authorization/search_path boundaries.
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
- [ ] Final production smoke test after the last code changes.

## Working rule for future sessions

Before making a new change:

1. Check this file and the current `main` state.
2. Make the smallest safe code-side change.
3. Run the relevant checks.
4. Update this file and the relevant README/docs/changelog in the same work session.
5. Re-check production/CI status.
6. Only then mark the item complete.

Manual-only provider/device actions should be kept separate from code-side work and listed explicitly when they remain.
