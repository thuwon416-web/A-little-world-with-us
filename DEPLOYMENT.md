# Deployment

## 1. Supabase schema

For an existing production database, do not run `00_core.sql`: it drops and recreates the public schema. Apply only the reviewed additive SQL needed by that release. To resolve the missing media column, review and run [15_media_mime_types.sql](supabase/bootstrap/15_media_mime_types.sql); it adds `memories.mime_type`, `messages.media_mime_type`, and `time_capsule_attachments.mime_type`.

For a new, empty database only, use the ordered scripts in [supabase/bootstrap/README.md](supabase/bootstrap/README.md). The bootstrap `00_core.sql` includes the shared occasion and voice transcript schema; the old standalone reset/upgrade filenames are not present in this repository.

## 2. Vercel environment variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Set the matching web, server, and mobile chat-encryption configuration from the existing deployment value. Do not generate a different value for an app that must decrypt existing messages. `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` and `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` are shipped with their client apps; they are not secret keys. Keep server-only provider keys and tokens out of client variables.

Production services as used: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, a selected server-side AI key such as `GROQ_API_KEY`, and optional `NEXT_PUBLIC_GIPHY_API_KEY`.

For Sentry set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. Set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` only when source-map upload is enabled. Do not use any `NEXT_PUBLIC_` value for private provider keys or tokens.

Leaflet/CARTO/OSM needs no map key. Do not add obsolete Google Maps or Mapbox values.

## 3. Deploy and verify

Push the verified commit to GitHub, then deploy through Vercel. Verify `/location` as the admin and verify the partner is redirected. Test shared Care, Memories, Plans, Calendar, Finance, Reminders, chat location pin, and Sentry event capture.

## 4. Native location release

Deploy the Supabase Edge Functions before testing notifications and labels:

```bash
supabase functions deploy reverse-geocode
supabase functions deploy location-alerts
supabase functions deploy reveal-surprises
```

Set `SURPRISE_REVEAL_SECRET` for `reveal-surprises` in Supabase Edge Function secrets. Configure a Supabase scheduled Edge Function invocation (or `pg_cron` plus a protected HTTP invocation) every five minutes with that secret in the `x-job-secret` header. Do not place this secret in web or mobile environment variables. Confirm one scheduled capsule reveals only for its recipient and sends an Expo push to a registered physical device.

Then build the Android preview APK from `mobile`. MapLibre/CARTO is the mobile map stack and needs no Google, Mapbox, or tile API key. Each person must deliberately enable **Settings > Privacy > Share my location in background**; this cannot be enabled remotely. Android background tracking is unavailable in Expo Go and may stop after a user force-stops the app, as required by Android/device-vendor restrictions.

## 5. Voice transcript check

The maintained bootstrap schema already defines `messages.transcript` and shared occasions. After confirming the deployed database has those fields, deploy the web and mobile apps, then verify voice-note transcription with both accounts. Audio is submitted to Groq only after a person taps **Transcribe**.
