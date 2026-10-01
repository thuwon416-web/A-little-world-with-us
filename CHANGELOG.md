# Changelog

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

