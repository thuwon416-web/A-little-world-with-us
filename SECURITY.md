# Security Policy

Owner: Security / Engineering
Update when: security boundaries, threat model, provider handling, or incident procedures change
Last Updated: 2026-10-08

## Supported versions

The main branch is the actively maintained development line.

## Reporting

Do not disclose suspected vulnerabilities in a public issue. Use the repository's available private/security reporting channel. Remove credentials and personal data from evidence.

## Threat model and boundaries

Supabase Row Level Security, server-side authorization, authenticated couple/ownership checks, and server-only environment variables are security boundaries. Client-prefixed variables are public to the client and must never contain private credentials.

Google Drive OAuth is handled server-side. The Drive flow uses authenticated, host-bound OAuth state and authenticated application routes for Drive-backed memory retrieval. The production callback is /api/drive/callback.

Media encryption is application-level encryption, not end-to-end encryption. Do not describe it as E2E encryption.

## Secrets

Never commit OAuth secrets, refresh tokens, encryption keys, service-role keys, cron secrets, VAPID private keys, or provider API credentials. Store them in the appropriate deployment/provider secret store.

## Database safety

Review RLS and authorization changes before deployment. Never run backend/supabase/bootstrap/00_core.sql against an existing production database containing real data. Use additive reviewed migrations for existing environments.

## Storage and privacy

Supabase remains the metadata/source-of-truth layer. Provider-specific media paths must retain authorization and ownership checks. Retention is provider-aware; non-critical data may have shorter retention only where explicitly configured.

## Vercel

Vercel Root Directory is apps/web. There is no root vercel.json; apps/web/vercel.json contains application configuration such as cron definitions. Do not introduce unnecessary build/install/output overrides.

## Incident handling

Contain the affected credential/session/data path, rotate compromised secrets, preserve sanitized evidence, review authorization boundaries, and document the verified remediation. Never hide a security issue by suppressing an alert without understanding its impact.

## Deferred

Platform-tier leaked-password protection remains deferred per the current project constraint. Dependency findings that require breaking framework upgrades remain individually assessed rather than force-upgraded.

## Verification checklist

- Secret scan passes for the release revision.
- CodeQL/security checks pass or have individually reviewed exceptions.
- RLS/authz paths are tested.
- OAuth state and callback are verified.
- Media retrieval enforces authenticated ownership/couple access.
- Release claims distinguish configured from actually verified behavior.
