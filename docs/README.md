# Project Documentation

Documentation for **A Little World With Us**.

## Guides

- [Architecture](architecture/overview.md) — platform boundaries and data flow.
- [Setup](SETUP.md) — local development and environment configuration.
- [Deployment](deployment/DEPLOYMENT.md) — production release and verification.
- [Google Drive](setup/google-drive.md) — optional Web OAuth and Drive-backed memory storage.
- [Data retention and storage](security/data-retention.md) — retention rules and storage responsibilities.
- [Media encryption](MEDIA-ENCRYPTION.md) — encrypted media format and limitations.

## Repository rules

- Keep operational documentation under `docs/` unless a root-level policy file is required.
- Never document real credentials, tokens, OAuth secrets, encryption keys, or production environment values.
- Keep Web ↔ Mobile behavior aligned.
- Treat Supabase RLS and server-side authorization as security boundaries.
- Use additive, reviewed database migrations for existing production databases.
