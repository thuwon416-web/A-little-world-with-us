# Storage

Owner: Backend / Storage
Update when: media providers, retention, encryption, or retrieval paths change
Last Updated: 2026-10-08

Supabase stores application metadata/source-of-truth references.

## Verified shared-memory precedence

For Web shared-memory photo uploads, the current code path is:

1. **Google Drive first** when the authenticated user's Drive connection reports connected.
2. **Cloudinary second** when Drive is not connected and Cloudinary is configured.
3. **Encrypted Supabase Storage fallback** when the Cloudinary media API is unavailable.

This is the behavior implemented by `apps/web/src/app/(private)/memories/page.tsx`, `apps/web/src/app/api/drive/upload/route.ts`, and `apps/web/src/app/api/media/upload/route.ts`.

Live Vercel configuration was checked on 2026-10-08. Production/preview/development entries exist for the required Google Drive OAuth variables, Cloudinary variables, and Backblaze B2 variables. Secret values were not exposed. The live `public.memories` table currently has zero rows, so actual provider-use distribution cannot be inferred from live data.

Evidence:
- [Memory upload selection code](https://github.com/thuwon416-web/A-little-world-with-us/blob/1c3f78fa8fe34c518cb21b5834fbafa055892b82/apps/web/src/app/(private)/memories/page.tsx)
- [Cloudinary memory upload API](https://github.com/thuwon416-web/A-little-world-with-us/blob/1c3f78fa8fe34c518cb21b5834fbafa055892b82/apps/web/src/app/api/media/upload/route.ts)
- [Vercel project](https://vercel.com/thuwon416-web/a-little-world-with-us)

## Other storage paths

- Backblaze B2 is a separate large-media tier where the corresponding message/media path is active; real upload/download/authorization remains a release gate.
- Supabase Storage remains the encrypted fallback/private document path where configured.
- Google Drive also has explicit per-memory upload/retrieval/export routes and is not the same thing as native mobile OAuth tooling.

Existing encryption documentation describes application-level encryption, not end-to-end encryption. Retention must be provider-aware.
