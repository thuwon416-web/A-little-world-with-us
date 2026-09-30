# A Little World With Us

A private couple app for shared memories, chat, Care, planning, wellness, and an admin-only location dashboard.

## Repository structure

```text
.
├── apps/
│   ├── web/             # Next.js web app + Route Handlers
│   └── mobile/          # Expo / React Native app
├── packages/
│   └── shared/          # Shared domain type contracts
├── backend/
│   └── supabase/        # Supabase bootstrap SQL + Edge Functions
├── docs/                # Architecture, setup, deployment, security
├── scripts/             # Repository-level maintenance/import tooling
├── .github/             # CI workflows
├── CHANGELOG.md
├── SECURITY.md
└── package.json         # Root command shortcuts; app dependencies stay app-local
```

The repository uses an app-oriented monorepo layout. Web and mobile keep their own dependency manifests and lockfiles, while stable cross-app contracts live in `packages/shared`. Supabase is kept under `backend/supabase` as the backend boundary.

## Start locally

Install each app's dependencies once:

```bash
npm run web:install
npm run mobile:install
```

Run the web app:

```bash
npm run dev
```

Run the mobile app:

```bash
npm run mobile:dev
```

Web environment files belong in `apps/web/`; mobile environment files belong in `apps/mobile/`.

## Checks

Web:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run test:e2e
```

Mobile:

```bash
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
```

## Documentation

- [Documentation hub](docs/README.md)
- [Architecture overview](docs/architecture/overview.md)
- [Local setup](docs/SETUP.md)
- [Deployment](docs/deployment/DEPLOYMENT.md)
- [Google Drive setup](docs/setup/google-drive.md)
- [Data retention and storage](docs/security/data-retention.md)

## Database

The maintained database scripts are in [backend/supabase/bootstrap](backend/supabase/bootstrap/README.md).

**Important:** `backend/supabase/bootstrap/00_core.sql` is a destructive reset and must only be used for a fresh or disposable database. Never use it to repair an existing production database.

## Storage and security

Supabase remains the application data source of record. When Google Drive is connected, memory image binaries can be stored in Drive while memory metadata and the Drive file reference remain in Supabase.

Never commit OAuth client secrets, refresh tokens, encryption keys, cron secrets, or provider API keys.

## Project principles

- Keep deployable applications self-contained under `apps/`.
- Put genuinely shared contracts/utilities under `packages/` only when both apps use them.
- Keep Supabase operational definitions under `backend/supabase/`.
- Do not archive active runtime code.
- Preserve Web ↔ Mobile behavior parity.
- Treat Supabase RLS and authorization checks as security boundaries.
- Run automated checks after structural changes.
