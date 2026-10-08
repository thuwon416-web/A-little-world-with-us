# Roadmap

Owner: Project maintainers
Update when: phase scope or release gates change
Last Updated: 2026-10-08

## Completed phases
Core architecture/parity foundations; CI/security hardening; Korean curriculum architecture and Levels 4–6 foundation; Google Drive Web OAuth hardening; canonical documentation migration.

## Active phase — Final Production Audit + User Verification
Acceptance: release-commit CI green; production READY; authenticated E2E; Drive connect/upload/retrieve; Web↔Mobile parity; device/offline verification; manual acceptance.

## Ledger B — complete plan register
1. Runtime CI/build verification for Korean 4–6 commits — VERIFIED (2026-10-08 production build).
2. Real Google Drive OAuth flow — PENDING.
3. Register production Drive callback in Google Cloud — PENDING / VERIFY.
4. Verify Drive connect → consent → callback → Connected — PENDING.
5. Drive-backed memory upload + Supabase drive_file_id + re-render — PENDING.
6. Native Android/iOS Google OAuth setup — FUTURE.
7. Native Drive connect/disconnect — FUTURE.
8. Final Web↔Mobile smoke — PENDING.
9. GitHub E2E/CodeQL/Secret Scan final state — PENDING.
10. Dependabot alert refresh — PENDING.
11. Individual Dependabot assessment — PENDING.
12. 121 unused-index findings — DEFERRED.
13. FK-index recommendations — DEFERRED.
14. Database optimization revisit — DEFERRED.
15. Leaked-password protection — DEFERRED.
16. Android/iOS build verification — PENDING.
17. Camera/media permission verification — PENDING.
18. Notification verification — PENDING.
19. Background-location/maps verification — PENDING.
20. WebRTC verification — PENDING.
21. Real-device offline/media recovery — PENDING.
22. Full feature-parity audit — PENDING.
23. Memories/media retrieval — PENDING.
24. Calendar / Plans / Finance — PENDING.
25. Location / Safety — PENDING.
26. Notifications / offline recovery — PENDING.
27. Final Memories UI pass — PENDING.
28. Period/fertility final verification — PENDING.
29. Korean Levels 4–6 QA gate — PENDING.
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

## Deferred modernization
Tailwind/Expo/Jest dependency modernization remains deferred where remediation requires breaking framework/toolchain upgrades.

## Future Korean domain roadmap
The detailed Korean curriculum lives in docs/features/korean-curriculum.md and is subordinate to this master roadmap.

## VERIFY / blocked-by-evidence
- **Google Cloud production Drive callback registration:** VERIFY because Google Cloud OAuth client configuration cannot be read through the available live tools.

Resolved on 2026-10-08:
- Korean 4–6 runtime build: VERIFIED by production deployment `dpl_6CnQ1obMNiPZ2oweVqethGQix2bi` reaching READY from runtime baseline `1c3f78fa8fe34c518cb21b5834fbafa055892b82`; GitHub compare to current main shows documentation-only changes afterward.
- Live Supabase migration head: VERIFIED at `20261007121841 — restore_rls_helper_execute`.
- Bootstrap numbering intent for 33/51/52: VERIFIED by distinct SQL content and matching live migration history.
- Live storage precedence/configuration: VERIFIED at code/config level; live memory table currently has zero rows, so actual provider-use distribution is not asserted.

## Evidence rule
DONE means implementation exists. VERIFIED requires evidence appropriate to the item. Never infer live state from repository scripts or configuration alone.
