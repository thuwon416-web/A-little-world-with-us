# Roadmap

Owner: Project maintainers
Update when: phase scope or release gates change
Last Updated: 2026-10-08

## Working rule for close-out
Code-side work is completed and prepared as far as repository access allows before owner-side/manual verification. External credentials, API keys, Google Cloud/Vercel/Supabase console values, authenticated user flows, and physical-device evidence are collected at the end as one verification pass.

## Completed phases
Core architecture/parity foundations; CI/security hardening; Korean curriculum architecture and Levels 4–6 implementation foundation; Google Drive Web OAuth hardening; canonical documentation migration; mobile test-config cleanup.

## Active phase — Final Production Audit + User Verification
Acceptance: production READY; authenticated E2E; Drive connect/upload/retrieve; Web↔Mobile parity; native/device verification; real-user period/fertility scenario; Korean content QA; dependency alert refresh; manual acceptance.

## Parallel close-out tracks
These tracks can be worked continuously in parallel. A manual gate does not stop repository-side preparation for the next track.
- **Track A — Drive/Memory:** OAuth callback, Drive E2E, memory upload/retrieve/delete.
- **Track B — Mobile/native:** native OAuth structure, build configuration, permissions, notifications, location, WebRTC, offline recovery.
- **Track C — Reliability/testing:** Web API coverage, mobile coverage growth, safety notification provider integration, CI/security refresh.
- **Track D — Product QA:** Web↔Mobile feature parity, Memories UI, Period/Fertility, Korean 4–6 content QA, accessibility.

## Prepared next phases

### Phase 7 — Drive/Memory Reliability Close-out
**Goal:** finish repository-side Drive robustness before the final authenticated pass.
- Route-level coverage for Drive OAuth start/callback is now in place.
- Deep route coverage now includes status/upload/file/delete/disconnect authentication, authorization, CSRF, rate-limit, and rollback paths.
- Mobile/native Drive audit continues in parallel; manual OAuth/device evidence remains deferred to Phase 10.
- Re-audit token refresh, disconnect/revocation, upload rollback, metadata consistency, and shared-memory retrieval.
- [x] Added fail-closed expired-token behavior, provider-401 retry, refresh persistence error handling, and trusted resumable-upload session URL validation.
- [x] Added Drive helper regression coverage for signed state, malformed token exchange, refresh failure, and provider-401 retry.
- Manual gate remains one final production connect → upload → render → delete scenario.

### Phase 8 — Mobile Native + Cross-platform Readiness
**Goal:** make current-main native configuration and shared-memory behavior release-ready without waiting for a device.
- Re-audit native Google Drive PKCE, deep-link handling, SecureStore token lifecycle, and platform client-ID configuration.
- Re-audit camera/media, notifications, background location, maps, WebRTC, and offline/media recovery configuration.
- Prepare the exact EAS current-main build inputs and device smoke sequence; do not count historical artifacts as current evidence.

### Phase 9 — Reliability / Safety Delivery
**Goal:** close automated reliability gaps and prepare safety notification delivery.
- Expand Web API coverage to the highest-risk authenticated routes; Drive status/upload/file/delete/disconnect coverage is now present.
- [x] Hardened memory deletion with same-origin enforcement, per-user rate limiting, and owner-only regression tests.
- Vercel is auto-building the latest main commits; current production deployment state is monitored separately and is not treated as READY until the final revision is complete.
- Expand mobile coverage where existing behavior can be exercised without a device.
- Keep emergency-contact email delivery provider-neutral until the owner supplies the chosen provider/API credentials; then wire and test the provider.
- Recheck CI/security workflows on the final release revision.
- Native Drive client validation and a 25 MB mobile upload guard are now in code; this is repository-side hardening, not device evidence.

### Phase 10 — Product QA + Final Verification Pack
A single combined checklist is prepared in `docs/FINAL_VERIFICATION.md`; it is intentionally not a request to perform manual checks yet.
**Goal:** turn remaining evidence gates into one owner-side verification pass.
- Web ↔ Mobile smoke: Auth → Couple → Chat → Period → Memories/Media → Calendar/Plans/Finance → Location/Safety → Notifications/Offline → AI → Drive.
- Memories visual pass, Period/Fertility controlled scenario, Korean 4–6 human QA, accessibility checks.
- Google Cloud callback registration, Drive E2E, native builds/device checks, Dependabot refresh, and B2 verification where active.
- Produce one final evidence-backed release checklist; no manual gate is requested before repository-side work is complete.

## Continue rule
Phase 7, Phase 8, Phase 9, and Phase 10 preparation are intentionally overlapping. When one track hits an external/manual blocker, continue the other repository-side tracks rather than pausing the close-out.

## Ledger B — release gate register
1. Runtime CI/build verification for Korean 4–6 — VERIFIED (2026-10-08 production deployment dpl_6CnQ1obMNiPZ2oweVqethGQix2bi).
2. Real Google Drive OAuth flow — IN PROGRESS.
3. Register production Drive callback in Google Cloud — VERIFY.
4. Drive connect → consent → callback → Connected — IN PROGRESS.
5. Drive-backed memory upload + Supabase drive_file_id + re-render — IN PROGRESS.
6. Native Android/iOS Google OAuth setup — FUTURE / repository preparation can proceed now.
7. Native Drive connect/disconnect — FUTURE / repository preparation can proceed now.
8. Final Web↔Mobile smoke — IN PROGRESS.
9. GitHub E2E/CodeQL/Secret Scan final state — PENDING current-release recheck.
10. Dependabot alert refresh — BLOCKED by unavailable Security/Dependabot alert API.
11. Individual Dependabot assessment — PENDING until alert list is accessible.
12. 121 unused-index findings — DEFERRED.
13. FK-index recommendations — DEFERRED.
14. Database optimization revisit — DEFERRED.
15. Leaked-password protection — DEFERRED.
16. Android/iOS build verification — BLOCKED by EAS repository connection for current build trigger; old Android artifacts do not count.
17. Camera/media permission verification — PENDING device evidence.
18. Notification verification — PENDING device evidence.
19. Background-location/maps verification — PENDING device evidence.
20. WebRTC verification — PENDING device evidence.
21. Real-device offline/media recovery — PENDING device evidence.
22. Full feature-parity audit — PENDING.
23. Memories/media retrieval — IN PROGRESS through Drive E2E gate.
24. Calendar / Plans / Finance — PENDING final smoke.
25. Location / Safety — PENDING final smoke.
26. Notifications / offline recovery — PENDING final smoke.
27. Final Memories UI pass — PENDING visual/device evidence.
28. Period/fertility final verification — PENDING authenticated scenario.
29. Korean Levels 4–6 content QA gate — PENDING human/content QA artifact.
30. Korean curriculum grammar sequencing — FUTURE.
31. Korean curriculum vocabulary sequencing — FUTURE.
32. Korea Life curriculum layer — FUTURE.
33. Couple Korean curriculum layer — FUTURE.
34. Adaptive review — FUTURE.
35. Speaking practice — FUTURE.
36. Richer audio — FUTURE.
37. AI Korean tutoring — FUTURE.
38. Accessibility placeholder/disabled/link/status checks — PENDING evidence work.
39. Real Backblaze B2 upload/download/authorization verification — PENDING if B2 is active.
40. Wellness theme-awareness option — FUTURE.

## VERIFY / blocked-by-evidence
- Google Cloud production Drive callback registration: VERIFY. Required URI https://a-little-world-with-us.vercel.app/api/drive/callback; external Google Cloud OAuth client state is not readable through available tools.

## Non-release technical backlog discovered during final audit
These are repository follow-ups, not current release blockers:
- Web Vitest now includes API routes in coverage; Drive OAuth start/callback route tests were added, and Drive file access/delete endpoints now have request-rate limits. Continue expanding coverage for higher-risk authenticated routes.
- check-missed-checkin currently has push notification delivery but emergency-contact email delivery remains provider-dependent; no email provider is hard-coded or faked. A provider/API key can be wired when the owner supplies the chosen provider credentials.
- No other FIXME/HACK markers were found in the searched repository scope.

## Close-out continuation rule

Phases 7–9 continue in parallel until their code-side gates are exhausted. Phase 10 remains a single owner/manual verification pass and is not performed incrementally. Phases 11–15 are pre-staged so defects, release freeze, monitoring, and post-release product work can continue without reopening the roadmap structure.

Detailed ledger: `docs/RELEASE_CLOSEOUT.md`.

## Evidence notes
- Korean 4–6 structural parity: Web and Mobile runtime-baseline advanced curriculum each contain 12 advanced lesson entries, 4 per Level 4–6. This does not close human content QA.
- Android EAS history contains older FINISHED internal artifacts, but no current-main build evidence. iOS build history is empty.
- Mobile Jest coverage config now has an explicit conservative baseline rather than stale Sprint 2/Sprint 4 TODO wording.
- Drive file read/delete routes now have per-user request-rate limits; this is code-side hardening, not live abuse-test evidence.
- Never infer live OAuth, device, or security-alert state from code/config alone.
