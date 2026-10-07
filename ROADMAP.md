# Roadmap

Owner: Project maintainers
Update when: phase scope or release gates change
Last Updated: 2026-10-08

## Completed
Core architecture/parity foundations; CI/security hardening; Korean curriculum architecture and Levels 4–6 foundation; Google Drive Web OAuth hardening.

## Active: Final Production Audit + User Verification
Acceptance: release-commit CI green, production READY, authenticated E2E, Drive connect/upload/retrieve, Web↔Mobile parity, device/offline verification, manual acceptance.

## Release gate backlog
1. Korean 4–6 runtime CI/build.
2. Real Google Drive OAuth.
3. Register exact production Drive callback.
4. Verify Drive connect/consent/callback/Connected.
5. Verify Drive memory upload, drive_file_id, and re-render.
6. Native Android/iOS Google OAuth.
7. Native Drive connect/disconnect.
8. Final Web↔Mobile smoke.
9. Final GitHub E2E/CodeQL/Secret Scan.
10. Dependabot refresh.
11. Individual Dependabot assessment.
12. Android/iOS builds.
13. Camera/media permissions.
14. Notifications.
15. Background location/maps.
16. WebRTC.
17. Real-device offline/media recovery.
18. Full feature parity.
19. Memories/media retrieval.
20. Calendar/Plans/Finance.
21. Location/Safety.
22. Notifications/offline recovery.
23. Final Memories UI.
24. Period/fertility verification.
25. Korean Levels 4–6 content QA.
26. B2 upload/download/authorization where active.

## Future Korean
Grammar/vocabulary sequencing, Korea Life, Couple Korean, adaptive review, speaking, richer audio, and AI tutoring are subordinate to this master roadmap and live in docs/features/korean-curriculum.md.

## Deferred
Supabase unused-index/FK optimization; leaked-password protection; breaking Tailwind/Expo/Jest modernization.

## VERIFY
Live Supabase migration head; duplicate bootstrap numbering intent; exact Google Cloud Drive callback registration; live storage-provider precedence.