# A Little World With Us

A private couple app for shared memories, chat, Care, planning, wellness, and an admin-only location dashboard.

## Repository structure

```text
.
├── src/                 # Next.js web application
├── public/              # Web static assets
├── mobile/              # Expo / React Native application
├── supabase/            # PostgreSQL bootstrap + Edge Functions
├── docs/                # Architecture, setup, deployment, security
├── scripts/             # Project automation and maintenance
└── .github/             # CI workflows
```

The web application intentionally remains at the repository root because it is a full-stack Next.js application: UI and server Route Handlers live together under `src/`. Moving it into `web-platform/frontend` would require changing the Vercel project root, build/install paths, CI assumptions, and local tooling for no functional gain.

## Start locally

### Web

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the required Supabase, chat-encryption, AI, and optional integration values.
4. Run `npm run dev`.

### Mobile

1. Copy `mobile/.env.example` to `mobile/.env`.
2. Install and start with:

```bash
npm install --prefix mobile
npm start --prefix mobile
```

## Checks

Web:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

Mobile:

```bash
cd mobile
npm run typecheck
npm run lint
npm run test:coverage
```

## Documentation

- [Documentation hub](docs/README.md)
- [Architecture overview](docs/architecture/overview.md)
- [Local setup](docs/SETUP.md)
- [Deployment](docs/deployment/DEPLOYMENT.md)
- [Google Drive setup](docs/setup/google-drive.md)
- [Data retention and storage](docs/security/data-retention.md)
- [Mobile build instructions](mobile/BUILD_INSTRUCTIONS.md)
- [Supabase bootstrap](supabase/bootstrap/README.md)

## Database

The maintained database scripts are in [supabase/bootstrap](supabase/bootstrap/README.md).

**Important:** `supabase/bootstrap/00_core.sql` is a destructive reset and must only be used for a fresh or disposable database. Never use it to repair an existing production database. Existing production databases should receive reviewed additive changes only.

## Storage

Supabase remains the application data source of record. When Google Drive is connected, memory image binaries can be stored in Drive while the memory metadata and Drive file reference remain in Supabase. The application reads Drive-backed media through authenticated server routes.

## Security

Chat and media encryption are client-side protections for data stored in Supabase; they are not end-to-end encryption. Client-prefixed environment variables are bundled into the client and must not be treated as private server secrets.

Never commit OAuth client secrets, refresh tokens, encryption keys, cron secrets, or provider API keys.

## Project principles

- Keep active framework conventions intact.
- Prefer small, reviewable structural changes over broad rewrites.
- Do not archive active runtime code.
- Preserve Web ↔ Mobile behavior parity.
- Treat Supabase RLS and authorization checks as security boundaries.
- Run automated checks after structural changes.
