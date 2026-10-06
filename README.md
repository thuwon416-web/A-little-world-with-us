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

GitHub Actions also runs a **Production Smoke E2E** workflow against the live production alias. This verifies the public homepage and unauthenticated private-route redirects with a real Chromium browser. The separate Supabase-backed E2E workflow remains gated on dedicated non-production Supabase secrets.

## Documentation

- [Project status & maintenance checklist](docs/PROJECT_STATUS.md)
- [Documentation hub](docs/README.md)
- [Architecture overview](docs/architecture/overview.md)
- [Local setup](docs/SETUP.md)
- [Deployment](docs/deployment/DEPLOYMENT.md)
- [Google Drive setup](docs/setup/google-drive.md)
- [Data retention and storage](docs/security/data-retention.md)
- [Korean curriculum roadmap](docs/KOREAN_CURRICULUM.md)

## Database

The maintained database scripts are in [backend/supabase/bootstrap](backend/supabase/bootstrap/README.md).

**Important:** `backend/supabase/bootstrap/00_core.sql` is a destructive reset and must only be used for a fresh or disposable database. Never use it to repair an existing production database.

## Storage architecture

Supabase PostgreSQL is the metadata/source of truth. Media is routed by size and purpose:

- **Cloudinary:** memory images, profile pictures, and thumbnails under 10 MB.
- **Supabase Storage:** shared documents and chat attachments up to 50 MB.
- **Backblaze B2:** large shared media and memory backups over 50 MB, up to the application's 5 GB upload limit.
- **Google Drive:** optional memory export/archive and connected Drive-backed memories.
- Provider IDs/paths are stored in Supabase so media can be resolved later; uploads are not treated as write-only artifacts.

See [storage architecture](docs/ops/storage-architecture.md) for routing, access, deletion, and provider setup.

## Storage and security

Supabase remains the application data source of record. Shared media remains available to the remaining partner when an account is erased; private identity/security data is removed or revoked according to the deletion model.

Chat/media encryption is application-level encryption, not end-to-end encryption. Never commit OAuth client secrets, refresh tokens, encryption keys, cron secrets, or provider API keys.

## Project principles

- Keep deployable applications self-contained under `apps/`.
- Put genuinely shared contracts/utilities under `packages/` only when both apps use them.
- Keep Supabase operational definitions under `backend/supabase/`.
- Do not archive active runtime code.
- Preserve Web ↔ Mobile behavior parity.
- Treat Supabase RLS and authorization checks as security boundaries.
- Run automated checks after structural changes.
## Development workflow

Code-side work is currently maintained directly on `main` to keep the repository state simple and avoid unnecessary branches. Changes should still be small, verified by the relevant CI checks, and documented in the same work session. See [Project status & maintenance checklist](docs/PROJECT_STATUS.md) for the persistent release checklist and documentation-update rules.

## CI and release verification

GitHub Actions runs Web and Mobile lint/typecheck/tests, Web accessibility tests, and the Web production build. The separate Supabase-backed Playwright E2E suite requires dedicated non-production Supabase secrets; when they are unavailable, that workflow reports the environment as unavailable instead of treating E2E as passed.

The production smoke workflow runs Playwright against the live Vercel alias without requiring database secrets. Production/device verification is still required for external services and native capabilities such as Google Drive OAuth, background location, notifications, maps, media permissions, and WebRTC calling.

## Provider / API configuration

External provider setup is intentionally kept out of source control. Use [Provider / API Configuration](docs/setup/provider-api-configuration.md) for the production checklist covering Supabase, Cloudinary, Backblaze B2, Google Drive, Upstash, AI/observability providers, and Vercel configuration.

## Final verification boundary

Code-side work is maintained directly on `main`. Vercel is enabled for the current production verification pass; avoid unnecessary redeploys. Project-level build/install/dev/output overrides are cleared so the Next.js app uses the repository defaults. Remaining operator/device verification covers provider credentials and configuration (Backblaze B2 bucket/CORS, Google OAuth, Axiom, Umami, uptime monitoring), E2E staging secrets, and native capabilities such as notifications, background location, maps, media permissions, and WebRTC.
