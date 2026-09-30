# Architecture Overview

## Repository boundaries

This repository is a single Next.js web application plus an Expo mobile application and a Supabase backend definition.

| Area | Location | Responsibility |
| --- | --- | --- |
| Web | `src/`, `public/`, root Next.js config | Web UI, App Router pages, and server-side route handlers |
| Mobile | `mobile/` | Expo Router / React Native client |
| Database | `supabase/` | PostgreSQL bootstrap SQL, migrations, and Edge Functions |
| Documentation | `docs/` | Architecture, setup, deployment, security, and operational guidance |
| CI | `.github/` | Automated web/mobile checks |

### Why the web stays at repository root

The web application is currently a full-stack Next.js application: UI and server Route Handlers live together under `src/`. Moving it to `web-platform/frontend` without converting the repository into a true workspace/monorepo would change Vercel's project root, dependency installation, build paths, and CI assumptions for little practical benefit.

The safe structure is therefore:

```text
repository/
├── src/                 # Next.js web application
├── public/
├── mobile/              # Expo application
├── supabase/             # Database + Edge Functions
├── docs/                 # Maintained documentation
├── scripts/              # Project automation
├── .github/              # CI
└── root config files     # Next.js / TypeScript / npm / Vercel
```

If a separate backend service is introduced later, it should receive its own top-level boundary only when it has an independent runtime, package manifest, deployment target, or ownership model.

## Runtime flow

```text
Web browser
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

## Storage rule

Memory records remain in Supabase so the application can query and render them. When Google Drive is connected, the image binary can live in Drive and the memory record keeps the Drive file reference. Supabase remains the source of application metadata and authorization state.

## Safe refactoring rule

Repository cleanup must preserve:

1. Next.js App Router conventions.
2. Expo Router conventions.
3. Supabase migration/bootstrap ordering.
4. Vercel project root and build behavior.
5. Existing import aliases and test commands.

Structural cleanup is not considered complete until typecheck, lint, tests, and production-oriented smoke checks pass.
