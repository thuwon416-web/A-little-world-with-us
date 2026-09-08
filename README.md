# A Little World With Us

A private couple app for shared memories, chat, Care, planning, wellness, and an admin-only location dashboard.

## Local setup

1. Install web dependencies with `npm install` and mobile dependencies with `npm install --prefix mobile`.
2. Copy `.env.example` to `.env.local` and add Supabase, Upstash, AI provider, notification, and Sentry values as needed.
3. Run the web app with `npm run dev`; run checks with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

## Database

The only database bootstrap source is [supabase/bootstrap/20260111_reset_and_bootstrap.sql](supabase/bootstrap/20260111_reset_and_bootstrap.sql).

Before running it, empty every existing Supabase Storage bucket in the Dashboard. The script preserves the two verified Auth accounts, recreates public data/RLS, directly links the couple, and imports Flo cycle history. It does not delete Storage files itself.

## Maps and monitoring

Web location uses Leaflet with CARTO/OSM tiles; no map API key is required. Sentry is optional but recommended in production. Keep DSNs and auth tokens in ignored local files or Vercel Environment Variables, never in Git.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the production sequence and [mobile/BUILD_INSTRUCTIONS.md](mobile/BUILD_INSTRUCTIONS.md) for native builds.
