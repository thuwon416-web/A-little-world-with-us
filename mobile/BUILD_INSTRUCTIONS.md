# Mobile build instructions

## Prerequisites

Install the mobile dependencies with `npm install --prefix mobile`, configure the same Supabase project values in the mobile environment, and sign in with either accepted account.

## Native builds

Use EAS from the `mobile` directory:

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Create a new native build whenever location permissions, background location configuration, notifications, or native dependencies change. MapLibre is a native dependency, so Expo Go cannot load the Location map or validate production background tracking.

## Location release setup

1. In Supabase Storage, empty old buckets, then run the canonical bootstrap SQL once from the repository root.
2. Deploy `location-alerts` and `reverse-geocode` from `supabase/functions`. The first sends Expo Push alerts; the second caches Nominatim place labels on a roughly 200m grid.
3. Build an Android preview APK. The app requests precise foreground permission first, then Android background permission; each person must explicitly enable **Settings > Privacy > Share my location in background**.
4. Do not expect Android to restart tracking after a user force-stops the app. Opening the app again resumes the registered task when sharing is enabled. Device vendors may impose additional battery restrictions.

## Two-device verification

1. Install the build on both linked accounts and grant location permission on both devices.
2. Confirm each device writes its latest location while only the admin sees the Location dashboard.
3. Test offline queue/reconnect, a one-time chat location pin, battery/network state, and the seven-day history retention.
4. Confirm shared Care, Memories, Plans, Calendar, Finance, and Reminders data appears for both users.
