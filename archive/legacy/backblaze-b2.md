# Backblaze B2 production setup

The application already implements the B2 Native API flow for large media (>50 MB and <=5 GB). Provider configuration stays outside the repository.

## Required Vercel environment variables

- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_ID`
- `B2_BUCKET_NAME`

Never expose the B2 application key to browser/mobile code.

## Bucket CORS

Configure the B2 bucket CORS for the production Web origin and the direct-upload methods/headers used by the app.

Production origin:
- `https://a-little-world-with-us.vercel.app`

Required methods:
- `POST`
- `OPTIONS`

Required request headers include:
- `Authorization`
- `Content-Type`
- `X-Bz-File-Name`
- `X-Bz-Content-Sha1`
- `X-Bz-Server-Side-Encryption` (if enabled)

Expose at least:
- `Authorization`
- `X-Bz-File-Id`
- `X-Bz-Upload-Timestamp`

Prefer an explicit production origin instead of `*`.

## Verification

1. Upload a >50 MB test file from Web.
2. Confirm the browser can upload to the returned B2 upload URL without a CORS error.
3. Confirm Supabase stores `backblaze_b2` metadata.
4. Confirm the app resolves a short-lived private download URL.
5. Confirm an unauthorized user cannot resolve the same B2 object.

B2 is the large-media tier, not a silent fallback for Cloudinary/Supabase uploads.