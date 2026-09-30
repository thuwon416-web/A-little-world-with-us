# Setup Guide

## Prerequisites

- Node.js 24.3.x (the repository requires Node 24; see the `engines` fields).
- npm.
- A Supabase project.
- Expo tooling/native development environment for Mobile.
- Google Cloud OAuth configuration only if Google Drive integration is enabled.

## Repository layout

- Web: `apps/web`
- Mobile: `apps/mobile`
- Shared contracts: `packages/shared`
- Supabase: `backend/supabase`
- Documentation: `docs`

## Environment

Web environment files belong in `apps/web/`. Mobile environment files belong in `apps/mobile/`.

Client variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Chat encryption uses matching values for Web and Mobile when existing encrypted messages must remain readable:

```text
NEXT_PUBLIC_CHAT_ENCRYPTION_KEY=
CHAT_ENCRYPTION_KEY=
EXPO_PUBLIC_CHAT_ENCRYPTION_KEY=
```

Client-prefixed values are bundled into the client and are not private secrets. Server-only AI, Sentry, Upstash, OAuth, cron, VAPID, and provider credentials must remain server-side.

## Install and run

Web:

```bash
npm run web:install
npm run dev
```

Mobile:

```bash
npm run mobile:install
npm run mobile:dev
```

## Checks

Web:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
```

Mobile:

```bash
npm run mobile:lint
npm run mobile:typecheck
npm run mobile:test
```

## Database

The maintained Supabase bootstrap run order is documented in `backend/supabase/bootstrap/README.md`.

**Never run `backend/supabase/bootstrap/00_core.sql` against an existing database containing data.** Use reviewed additive migrations for existing environments.

## Google Drive

Google Drive is optional. Web OAuth and Drive-backed memory setup is documented in `docs/setup/google-drive.md`. Production OAuth credentials are operator-managed and must never be committed.

## Production smoke test

Verify authentication, couple linking, Memories, Care/Period, Calendar, Finance, Reminders, chat, realtime updates, and location permissions on the target Web and Mobile builds.
