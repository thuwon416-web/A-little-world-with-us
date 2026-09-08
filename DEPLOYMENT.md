# Deployment

## 1. Supabase reset

1. Confirm the existing project contains the two intended Auth accounts.
2. In Supabase Dashboard > Storage, empty every current bucket. This permanently removes old files.
3. Run [supabase/bootstrap/20260111_reset_and_bootstrap.sql](supabase/bootstrap/20260111_reset_and_bootstrap.sql) in SQL Editor.
4. Confirm the final result says `Reset complete`, then sign out and sign back in on both accounts.

The bootstrap creates the accepted pair directly, imports Flo periods, scopes shared content to the pair, and limits `/location` data to `thuwon416@gmail.com`.

## 2. Vercel environment variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Production services as used: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, selected server-side AI keys, VAPID keys, and optional `NEXT_PUBLIC_GIPHY_API_KEY`.

For Sentry set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. Set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` only when source-map upload is enabled. Do not use any `NEXT_PUBLIC_` value for private provider keys or tokens.

Leaflet/CARTO/OSM needs no map key. Do not add obsolete Google Maps or Mapbox values.

## 3. Deploy and verify

Push the verified commit to GitHub, then deploy through Vercel. Verify `/location` as the admin and verify the partner is redirected. Test shared Care, Memories, Plans, Calendar, Finance, Reminders, chat location pin, and Sentry event capture.

Native background GPS still requires a new Android/iOS build and permission testing on two real devices.
