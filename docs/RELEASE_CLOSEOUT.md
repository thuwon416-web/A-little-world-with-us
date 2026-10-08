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
Status: CODE-SIDE AUDIT CONTINUES
- [x] Native Drive PKCE/state cleanup path reviewed.
- [x] SecureStore token lifecycle reviewed.
- [x] Offline message queue/retry/conflict path reviewed.
- [x] Notification scheduling/device registration path reviewed.
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
Run once after Phases 7–9 code-side work settles.

## Phase 11 — Evidence-driven fixes
Trigger: only defects recorded in Phase 10.
Process:
1. Fix code/config.
2. Add regression coverage.
3. Rebuild/redeploy affected surface.
4. Re-check only the affected evidence plus critical smoke.

## Phase 12 — Release Candidate freeze
1. Freeze final commit SHA.
2. Confirm GitHub checks for that SHA.
3. Confirm Android/iOS current-main build artifacts.
4. Confirm Vercel production deployment points to the frozen SHA and is READY.
5. Perform final critical-path smoke.
6. Record release evidence.

## Phase 13 — Post-release monitoring
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

## Phase 15 — Long-term hardening
- Dependency/Dependabot remediation after current-main alert snapshot.
- Database index/FK optimization.
- Storage retention/cleanup policies.
- Observability dashboards and alert thresholds.
- Disaster recovery / export validation.
- Accessibility regression suite.
