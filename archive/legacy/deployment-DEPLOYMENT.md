# Deployment

## Repository layout

- Web: apps/web
- Mobile: apps/mobile
- Supabase: backend/supabase
- Shared contracts: packages/shared

The Vercel project should use apps/web as its Root Directory. The web app keeps its own package manifest, lockfile, Next.js configuration, and environment examples.

## Supabase schema

For an existing production database, do not run backend/supabase/bootstrap/00_core.sql. It is a destructive reset for a fresh or disposable database only.

Apply reviewed additive SQL from backend/supabase/bootstrap for existing production databases.

## Environment

Required web variables include NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

Google Drive web OAuth configuration is documented in docs/setup/google-drive.md. Never commit OAuth client secrets or application encryption secrets.

## Verification

Before release:

- Web typecheck, lint, tests, and build pass.
- Mobile typecheck, lint, and tests pass.
- Supabase schema and RLS changes are reviewed.
- Google Drive OAuth is verified separately if enabled.
- Production smoke tests cover authentication, couple linking, Memories, Care, Calendar, Finance, Reminders, chat, and location permissions.

Do not change the existing Vercel ignored-build-step behavior as part of repository cleanup.
