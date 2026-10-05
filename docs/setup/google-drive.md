# Google Drive Setup

Google Drive is an optional media-storage integration for the web application. The app keeps memory metadata in Supabase and stores the image binary in the user's Drive when the integration is connected.

## Google Cloud

1. Create or select the Google Cloud project used by the web app.
2. Enable the **Google Drive API**.
3. Configure the OAuth consent screen / Google Auth Platform.
4. Create a **Web application** OAuth client.
5. Add the production callback URI:

```text
https://YOUR_WEB_DOMAIN/api/drive/callback
```

6. Keep the OAuth client ID and client secret outside Git.

The application requests the `drive.file` scope so it can work with files created/selected through the integration without requesting unrestricted Drive access.

## Vercel environment variables

Configure these in the Vercel project:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=https://YOUR_WEB_DOMAIN/api/drive/callback
GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY=
GOOGLE_OAUTH_STATE_SECRET=
```

The last two values are application security secrets, not Google credentials. Generate strong random values and keep them server-side.

## Web flow

```text
Settings
  -> Connect Google Drive
  -> Google OAuth
  -> /api/drive/callback
  -> encrypted token storage
  -> Drive upload
  -> memories.drive_file_id
```

OAuth state is bound to a short-lived HTTP-only browser cookie and verified before the callback is accepted.

## Memory behavior

- Cloudinary is the primary shared-memory storage; Google Drive is reserved for export/archive. Legacy Drive-backed memories remain readable through the authenticated Drive route.
- Drive not connected: the existing Supabase storage path remains the fallback.
- Reading a Drive-backed memory goes through the authenticated application route; the raw Drive file is not exposed as a public URL.
- Deleting a Drive-backed memory also removes the associated Drive file before the database record is removed.
- Disconnecting Drive removes the local encrypted connection state and attempts token revocation.

## Important

Android/mobile Drive OAuth is a separate native credential/setup step and is intentionally not represented as complete by this web setup guide.
