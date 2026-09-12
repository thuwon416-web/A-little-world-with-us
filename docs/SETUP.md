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

Run [`supabase/bootstrap/20260111_reset_and_bootstrap.sql`](../supabase/bootstrap/20260111_reset_and_bootstrap.sql) in the Supabase SQL Editor only after reviewing its reset behavior. Apply additive upgrade scripts in the order documented in the root README.

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
