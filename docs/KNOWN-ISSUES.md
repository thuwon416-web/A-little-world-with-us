# Known Issues and Deferred Work

**Last Updated:** 2026-10-01

This document tracks work that is intentionally deferred or requires operator/device
verification. It is not a statement that the current application is incomplete.

## Dependency and upgrade notes

The current Web and Mobile manifests already use the current project targets:

- Web: Next.js 16, React 19, Vitest 5.
- Mobile: Expo SDK 57 / React Native 0.86.
- Node.js: 24.3.x through the repository engine constraint.

Dependency advisories should still be reassessed against the current lockfiles and
GitHub Security Advisories before a production release. Do not run
`npm audit fix --force` blindly; validate framework, Expo, native-module, and
toolchain compatibility after any major dependency change.

## Operator setup still required

These items require credentials, external consoles, or device access and therefore
cannot be completed safely from repository code alone:

- Google Cloud OAuth client configuration and production redirect URI setup.
- Vercel environment variables for production Google Drive OAuth.
- Native Android/mobile Google Drive OAuth configuration if Drive is enabled on Mobile.
- Production Supabase/Vercel secrets and deployment configuration.
- Physical-device validation for location/background tracking, notifications, maps,
  camera/media permissions, and WebRTC calling.

## Database warnings intentionally deferred

The remaining Supabase advisory cleanup is deliberately separate from the application
feature work:

- Unused-index warnings can be reviewed as a performance/storage optimization.
- Remaining unindexed foreign-key warnings should be reviewed table-by-table before
  adding indexes, based on actual query patterns and write/read trade-offs.
- `user_locations.couple_id` already has dedicated index coverage in the repository
  migrations; it should not be treated as an unhandled application defect.

Do not apply broad database cleanup directly to an existing production database
without reviewing the additive migration and its expected query/write impact.

## Verification that remains external

Repository CI covers the automated Web and Mobile checks. A production-ready release
still needs real environment/device verification:

- Web authentication and private-route redirects.
- Couple linking and shared-data synchronization.
- Memories and private media.
- Care/Period calculations and persistence.
- Calendar, Finance, Plans, and Reminders.
- Chat/realtime recovery.
- Location permissions, background behavior, and retention.
- Google Drive OAuth and Drive-backed memory media when enabled.

These checks are validation steps, not known functional defects.