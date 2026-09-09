# Deployment

## 1. Supabase reset

1. Confirm the existing project contains the two intended Auth accounts.
2. In Supabase Dashboard > Storage, empty every current bucket. This permanently removes old files.
3. Run [supabase/bootstrap/20260111_reset_and_bootstrap.sql](supabase/bootstrap/20260111_reset_and_bootstrap.sql) in SQL Editor.
4. Confirm the final result says `Reset complete`, then sign out and sign back in on both accounts.

The bootstrap creates the accepted pair directly, imports Flo periods, scopes shared content to the pair, and limits `/location` data to `thuwon416@gmail.com`.

## 2. Vercel environment variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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

## 5. Release 2 upgrade and verification

Run [supabase/bootstrap/20260909_f1_f6_schema_upgrade.sql](supabase/bootstrap/20260909_f1_f6_schema_upgrade.sql), then [supabase/bootstrap/20260909_release2_upgrade.sql](supabase/bootstrap/20260909_release2_upgrade.sql). The second script adds the shared occasion calendar and the `messages.transcript` field used by explicit Groq transcription. Deploy after setting `GROQ_API_KEY`, then verify a voice-note transcription with both accounts. Audio is submitted to Groq only after a person taps **Transcribe**.
