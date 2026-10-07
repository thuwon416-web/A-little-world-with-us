# Mobile Release Runbook

Owner: Release Engineering
Update when: native release procedure changes
Last Updated: 2026-10-08

1. Confirm iOS and Android permission copy matches actual features.
2. Confirm EAS profile and signing credentials.
3. Verify notification permissions and push credentials.
4. Verify native Google OAuth where enabled.
5. Run Mobile typecheck, lint, tests, and intended native build.
6. Exercise background-location sharing with two test accounts where enabled.
7. Verify offline/reconnect and media recovery on a real device.

Historical detailed checklist is preserved in archive/legacy/mobile-release.md.