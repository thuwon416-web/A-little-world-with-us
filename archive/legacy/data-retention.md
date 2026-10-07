# Data Retention and Storage

## Retention

The current retention policy is intentionally conservative:

| Data | Retention |
| --- | --- |
| Location history | 7 days |
| Temporary AI context | 30 days |
| Memories | No automatic deletion |
| Chat history | No automatic deletion |
| User media | No automatic deletion |

Retention jobs must not be broadened to memories or chat without an explicit product decision.

## Storage

Supabase remains the system of record for application metadata, permissions, and references.

For Drive-backed memory media:

- binary image data is stored in the user's Google Drive;
- Supabase stores the Drive file ID and storage provider;
- application access is authenticated and ownership-checked;
- Drive is not used as a replacement for chat/memory metadata.

## Security boundaries

- Never commit OAuth client secrets, refresh tokens, encryption keys, cron secrets, or provider API keys.
- Client-prefixed environment variables are public to the built client and must not be treated as server secrets.
- Server-only secrets stay in Vercel/Supabase environment configuration.
- Database RLS remains the authorization boundary for application data.
