# Mobile build instructions

## Prerequisites

Install the mobile dependencies with `npm install --prefix mobile`, configure the same Supabase project values in the mobile environment, and sign in with either accepted account.

## Native builds

Use EAS from the `mobile` directory:

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Create a new native build whenever location permissions, background location configuration, notifications, or native dependencies change. Expo Go cannot validate production background tracking.

## Two-device verification

1. Install the build on both linked accounts and grant location permission on both devices.
2. Confirm each device writes its latest location while only the admin sees the Location dashboard.
3. Test offline queue/reconnect, a one-time chat location pin, battery/network state, and the seven-day history retention.
4. Confirm shared Care, Memories, Plans, Calendar, Finance, and Reminders data appears for both users.
