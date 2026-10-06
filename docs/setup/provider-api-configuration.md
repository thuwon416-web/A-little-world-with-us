# Provider / API Configuration

This is the production operator checklist for external services used by the application. **Never commit real credentials, tokens, private keys, refresh tokens, or service-role keys.**

## Vercel environment variables

Configure production values in **Vercel → Project → Settings → Environment Variables**.

### Core providers

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `CRON_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` — server-only
- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY` — server-only
- `B2_BUCKET_ID`
- `B2_BUCKET_NAME`

### Google Drive Web OAuth

Set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` — server-only
- `GOOGLE_DRIVE_REDIRECT_URI`
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` — server-only
- `GOOGLE_OAUTH_STATE_SECRET` — server-only

Production callback:

```text
https://a-little-world-with-us.vercel.app/api/drive/callback
```

In Google Cloud, enable Google Drive API, configure the OAuth consent screen, create a Web application OAuth client, and add the exact production callback URI. The web integration uses the `drive.file` scope.

### Optional providers

Configure only when the related feature is enabled:

- AI: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`, `NVIDIA_API_KEY`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `COHERE_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Web push: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`
- Observability: `AXIOM_TOKEN`, `AXIOM_DATASET`, `AXIOM_INGEST_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- Sentry: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`
- GIF search: `NEXT_PUBLIC_GIPHY_API_KEY`

## Backblaze B2

Create/use a **private** B2 bucket and configure the four B2 variables above.

Production browser origin:

```text
https://a-little-world-with-us.vercel.app
```

Configure bucket CORS for the direct upload flow. The required methods and headers are maintained in [backblaze-b2.md](backblaze-b2.md).

Verification:
1. Upload a real file larger than 50 MB.
2. Confirm the browser upload succeeds without a CORS error.
3. Confirm Supabase records `backblaze_b2` metadata.
4. Confirm the app returns only a short-lived private download URL.
5. Confirm an unauthorized account cannot resolve the object.

## Google Drive

After adding the Web OAuth values in Vercel:
1. Open Settings → Connect Google Drive.
2. Complete Google OAuth.
3. Verify the callback succeeds without a 500/setup error.
4. Export/archive one memory.
5. Confirm the Drive file is created and the Supabase memory metadata remains readable.
6. Disconnect and confirm encrypted local connection state is removed.

Android/native Drive OAuth is a separate device credential/deep-link setup and is not considered complete from this web configuration alone.

## Supabase

Supabase PostgreSQL remains the application's source of truth for metadata and shared state.

- Client-safe URL/anon key may be public.
- Service-role key stays server-side.
- Existing production databases receive reviewed additive migrations only.
- Never run `backend/supabase/bootstrap/00_core.sql` against live data.

## Vercel — important override rule

The repository intentionally has **no root `vercel.json` build configuration**.

Do not add:

```json
"buildCommand": "npm run build",
"devCommand": "npm run dev",
"installCommand": "npm install",
"framework": "nextjs",
"outputDirectory": ".next"
```

Vercel Project Settings should remain:

- Root Directory: `apps/web`
- Framework: Next.js
- Build Command: default / empty
- Install Command: default / empty
- Development Command: default / empty
- Output Directory: default / empty

The only repository Vercel JSON currently retained is `apps/web/vercel.json`, which contains cron schedules. It is not a build override.

**This rule applies even if the Vercel project is disabled and later enabled again.** Re-enabling Vercel must not be used as a reason to restore repository or project-level command overrides.

## GitHub / public visibility readiness

The codebase is designed to work safely as either public or private.

Before switching to public:
- keep `.env` and local secret files ignored;
- confirm example environment files contain placeholders only;
- confirm no real provider credentials, private keys, refresh tokens, service-role keys, or production logs are committed;
- keep E2E/staging credentials in GitHub Secrets;
- keep Gitleaks enabled;
- keep server secrets out of `NEXT_PUBLIC_*` variables;
- do not publish private couple/user data or screenshots/logs.

Switching visibility itself is a GitHub repository setting, not an application code change. After changing visibility, CI should be allowed to run and any newly exposed security findings should be fixed before merging further changes.
