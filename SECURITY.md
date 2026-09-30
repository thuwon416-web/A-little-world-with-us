# Security Policy

## Supported Versions

The `main` branch is the actively maintained development line.

| Version / branch | Security support |
| --- | --- |
| `main` | :white_check_mark: |
| Older releases | :x: |

## Reporting a Vulnerability

Please do not disclose a suspected security vulnerability in a public GitHub issue.

Instead, use the repository's available private/security reporting channel. Include:

- A clear description of the vulnerability.
- The affected component or file, if known.
- Reproduction steps or a minimal proof of concept.
- The potential security impact.
- Any relevant logs or screenshots, with secrets and personal data removed.

Do not include passwords, OAuth client secrets, refresh tokens, encryption keys, service-role keys, or other credentials in a report.

## Security Boundaries

This project treats Supabase Row Level Security (RLS), server-side authorization, and server-only environment variables as security boundaries. Client-prefixed environment variables are bundled into the client and must not contain private credentials.

Google Drive integration uses server-side OAuth handling and encrypted connection state. Drive-backed memory files are accessed through authenticated application routes rather than exposed as public file URLs.

Media encryption used by the application is **not end-to-end encryption**; client applications can access the key needed to decrypt media available to the account.

## Production Safety

- Never commit credentials or tokens.
- Review database/RLS changes before production deployment.
- Do not run the destructive `backend/supabase/bootstrap/00_core.sql` against a database containing real data.
- Keep VAPID private keys, cron secrets, OAuth secrets, and provider API keys server-side.