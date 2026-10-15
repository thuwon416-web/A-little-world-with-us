# Repository Structure

This is the canonical layout for active, tracked application code. It intentionally does not list generated files, local dependencies, runtime output, or historical material.

```text
A-little-world-with-us/
├── apps/
│   ├── mobile/                         # Expo / React Native application
│   └── web-platform/
│       ├── frontend/                   # Next.js web application and route handlers
│       └── backend/
│           ├── sql/                    # SQL verification and policy scripts
│           └── supabase/               # Supabase config, bootstrap SQL and Edge Functions
├── packages/shared/                    # Cross-app contracts
├── docs/                               # Current architecture, setup and operations docs
├── scripts/                            # Repository tooling and verification
├── .github/workflows/                  # CI and security workflows
└── archive/                            # Historical material; not active runtime code
```

## Placement rules

- Keep browser code in `apps/web-platform/frontend/` and mobile code in `apps/mobile/`.
- Keep backend-owned SQL, Supabase configuration and Edge Functions in `apps/web-platform/backend/`.
- Put reusable cross-surface contracts in `packages/shared/`.
- Keep project-wide policy, status and roadmap Markdown files at the repository root; place detailed current guides in `docs/`.
- Do not treat `archive/` as an active source, deployment or documentation path.

For the current verified status, see `../CURRENT_STATE.md`; for product delivery work, see `../ROADMAP.md`.
