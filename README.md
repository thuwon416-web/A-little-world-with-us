# A Little World With Us

A private couple app for shared memories, chat, Care, planning, wellness, and an admin-only location dashboard.

## Local setup

1. Install web dependencies with `npm install` and mobile dependencies with `npm install --prefix mobile`.
2. Copy `.env.example` to `.env.local` and add Supabase, Upstash, the existing matching web/server chat-encryption value, an optional server-side AI provider (such as `GROQ_API_KEY`), and Sentry values as needed. Copy `mobile/.env.example` to `mobile/.env` and use the same chat-encryption value there.
3. Run the web app with `npm run dev`; run checks with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

## Database

The current database scripts are in [supabase/bootstrap](supabase/bootstrap/README.md). The first script, `00_core.sql`, is a destructive reset and must only be used for a fresh or disposable database. Never run it against data you need to keep.

For an existing database with the missing `memories.mime_type` column, review and apply the additive [15_media_mime_types.sql](supabase/bootstrap/15_media_mime_types.sql) script. It adds the media type columns used by the app. This is a database change and must be applied to the Supabase project separately from deploying web or mobile code.

## Maps and monitoring

Web location uses Leaflet with CARTO/OSM tiles; no map API key is required. Sentry is optional but recommended in production. Keep DSNs and auth tokens in ignored local files or Vercel Environment Variables, never in Git.

Keep the matching chat encryption values in ignored local environment files and the deployment environment. `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` is included in browser code and is not a private server secret; do not treat it as protection from someone who can inspect the app bundle. See [DEPLOYMENT.md](DEPLOYMENT.md) for the production sequence and [mobile/BUILD_INSTRUCTIONS.md](mobile/BUILD_INSTRUCTIONS.md) for native builds.

For a complete local setup and validation checklist, see [docs/SETUP.md](docs/SETUP.md). Contributors should also read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
