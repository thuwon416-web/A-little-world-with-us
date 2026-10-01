# Mobile build instructions

## Prerequisites

Run all Mobile commands from `apps/mobile` or use the repository-root shortcuts.

```bash
cd apps/mobile
npm ci
```

Configure the same Supabase project values in the Mobile environment, then sign in
with either accepted account.

## Native builds

From `apps/mobile`:

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Keep the checked-in EAS configuration and app metadata aligned when changing EAS
profiles or native settings.

Create a new native build whenever location permissions, background location
configuration, notifications, or native dependencies change. MapLibre is a native
dependency, so Expo Go cannot load the Location map or validate production
background tracking.

## Location release setup

1. Ensure the target Supabase project uses reviewed additive migrations and required
   Edge Functions. Do not run the destructive `backend/supabase/bootstrap/00_core.sql`
   against an existing production database.
2. Build an Android/iOS development or preview artifact with the native configuration.
3. Grant the required location permissions on the test device and verify foreground
   and background behavior according to the platform.
4. Do not expect Android to restart tracking after a user force-stops the app. Opening
   the app again resumes the registered task when sharing is enabled. Device vendors
   may impose additional battery restrictions.

## Two-device verification

1. Install the build on both linked accounts and grant the required permissions.
2. Confirm each device writes its latest location while only the authorized admin
   surface can see the Location dashboard.
3. Test offline queue/reconnect, a one-time chat location pin, battery/network state,
   and the seven-day history retention.
4. Confirm shared Care, Memories, Plans, Calendar, Finance, and Reminders data appears
   for both users.
5. Confirm chat/realtime updates recover after reconnecting the app.

## Google Drive

Google Drive is optional. Web OAuth preparation is documented in
`docs/setup/google-drive.md`. Native Mobile Drive OAuth requires the corresponding
Google Cloud OAuth client and platform configuration before it can be verified on a
device. Never commit OAuth client secrets or refresh tokens.