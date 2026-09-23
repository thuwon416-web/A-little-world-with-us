# Setup Guide

## Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- Expo tooling for native development

## Environment

Copy `.env.example` to `.env.local` for the web app and create `mobile/.env` from the native environment template. Keep API keys and tokens out of source control.

Required client variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only integrations such as AI providers, Upstash, and Sentry must remain server-side.

## Database

The maintained schema scripts and run order are listed in [`supabase/bootstrap/README.md`](../supabase/bootstrap/README.md). `00_core.sql` is destructive and is only for a fresh or disposable database. Never use it to repair an existing database. For an existing database missing media type columns, review and apply [`15_media_mime_types.sql`](../supabase/bootstrap/15_media_mime_types.sql) on its own.

For web chat encryption, configure matching `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` and server-side `CHAT_ENCRYPTION_KEY` values in the local ignored environment file. For mobile, set the same value as `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` in `mobile/.env`. Do not rotate these values if existing messages must remain readable. Client-prefixed values are bundled into the app and are not private secrets.

## Run locally

```bash
npm install
npm run dev
```

In a second terminal:

```bash
cd mobile
npm install
npm start
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
cd mobile
npm run typecheck
npm run lint
```
