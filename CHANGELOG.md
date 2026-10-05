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

