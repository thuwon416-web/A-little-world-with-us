# Architecture Overview

## Repository boundaries

This repository is an app-oriented monorepo containing the web app, mobile app, shared contracts, and Supabase backend definitions.

| Area | Location | Responsibility |
| --- | --- | --- |
| Web | `apps/web/` | Next.js UI, App Router pages, and server Route Handlers |
| Mobile | `apps/mobile/` | Expo Router / React Native client |
| Shared | `packages/shared/` | Stable domain contracts used by both apps |
| Backend | `backend/supabase/` | PostgreSQL bootstrap SQL and Edge Functions |
| Documentation | `docs/` | Architecture, setup, deployment, and security guidance |
| CI | `.github/` | Automated web/mobile checks |
| Tooling | `scripts/` | Repository-level maintenance/import tooling |

The web application is full-stack Next.js, so UI and server Route Handlers intentionally remain together under `apps/web/src/`. The mobile app remains independent under `apps/mobile/`. There is no separate backend runtime to invent: Next.js Route Handlers and Supabase Edge Functions cover the server-side boundaries currently in use.

## Runtime flow

```text
Web
  -> Next.js UI / Route Handler
  -> Supabase Auth + Postgres / Storage
  -> Google Drive for Drive-backed memory media when connected

Mobile
  -> Expo Router screens/services
  -> Supabase Auth + Postgres / Storage
  -> Web API where a server-only capability is required

Supabase
  -> PostgreSQL / RLS
  -> Realtime
  -> Edge Functions / scheduled jobs
```

## Shared package rule

Only stable cross-app contracts belong in `packages/shared`. Feature implementation remains inside the owning app until both platforms genuinely need the same implementation.

## Storage rule

Memory records remain in Supabase so the application can query and render them. When Google Drive is connected, image binaries can live in Drive and the memory record keeps the Drive file reference.

## Refactoring rule

Structural cleanup must preserve Next.js App Router conventions, Expo Router conventions, Supabase bootstrap ordering, Vercel project configuration, existing import aliases, and Web ↔ Mobile contract compatibility.

A structural change is complete only after typecheck, lint, tests, build, and deployment-oriented smoke checks pass.
