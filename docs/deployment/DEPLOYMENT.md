# Deployment

## 1. Supabase schema

For an existing production database, do not run `00_core.sql`: it drops and recreates the public schema. Apply only the reviewed additive SQL needed by that release. Review the maintained bootstrap files in [supabase/bootstrap/README.md](../../supabase/bootstrap/README.md).

For a new, empty database only, use the ordered scripts in [supabase/bootstrap/README.md](../../supabase/bootstrap/README.md).

## 2. Vercel environment variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Set the matching web, server, and mobile chat-encryption configuration from the existing deployment value. Do not generate a different value for an app that must decrypt existing messages. `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` and `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` are shipped with their client apps; they are not secret keys.

Production services as used: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, a selected server-side AI key such as `GROQ_API_KEY`, and optional `NEXT_PUBLIC_GIPHY_API_KEY`.

For Sentry set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. Set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` only when source-map upload is enabled.

For Google Drive, follow [Google Drive Setup](../setup/google-drive.md). Never commit OAuth client secrets or application encryption secrets.

## 3. Deploy and verify

Push the verified commit to GitHub, then deploy through Vercel. Verify authenticated web routes and shared Web ↔ Mobile data flows. Do not change the existing Vercel ignored-build-step behavior as part of repository cleanup.

## 4. Native location release

Deploy the required Supabase Edge Functions before testing notifications and labels:

```bash
supabase functions deploy reverse-geocode
supabase functions deploy location-alerts
supabase functions deploy reveal-surprises
```

Keep `SURPRISE_REVEAL_SECRET` server-side only. Build the Android preview APK from `mobile/` for native location/WebRTC verification.

## 5. Final verification

Before calling a release complete:

- Web typecheck, lint, tests, and build pass.
- Mobile typecheck, lint, and tests pass.
- Supabase schema/RLS changes are reviewed and production advisors checked.
- Google Drive OAuth is verified separately if enabled.
- Production smoke tests cover authentication, couple linking, Memories, Care, Plans, Calendar, Finance, Reminders, chat, and location permissions.
