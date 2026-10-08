# Roadmap

Owner: Project maintainers
Update when: phase scope or release gates change
Last Updated: 2026-10-08

## Completed phases
Core architecture/parity foundations; CI/security hardening; Korean curriculum architecture and Levels 4–6 implementation foundation; Google Drive Web OAuth hardening; canonical documentation migration.

## Active phase — Final Production Audit + User Verification
Acceptance: production READY; authenticated E2E; Drive connect/upload/retrieve; Web↔Mobile parity; native/device verification; real-user period/fertility scenario; Korean content QA; dependency alert refresh; manual acceptance.

## Ledger B — release gate register
1. Runtime CI/build verification for Korean 4–6 — VERIFIED (2026-10-08 production deployment `dpl_6CnQ1obMNiPZ2oweVqethGQix2bi`).
2. Real Google Drive OAuth flow — IN PROGRESS.
3. Register production Drive callback in Google Cloud — VERIFY.
4. Drive connect → consent → callback → Connected — IN PROGRESS.
5. Drive-backed memory upload + Supabase `drive_file_id` + re-render — IN PROGRESS.
6. Native Android/iOS Google OAuth setup — FUTURE.
7. Native Drive connect/disconnect — FUTURE.
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
- Google Cloud production Drive callback registration: **VERIFY**. Required URI `https://a-little-world-with-us.vercel.app/api/drive/callback`; external Google Cloud OAuth client state is not readable through available tools.

## Evidence notes
- Korean 4–6 structural parity: Web and Mobile runtime-baseline advanced curriculum each contain 12 advanced lesson entries, 4 per Level 4–6. This does not close human content QA.
- Android EAS history contains older FINISHED internal artifacts, but no current-main build evidence. iOS build history is empty.
- Never infer live OAuth, device, or security-alert state from code/config alone.
