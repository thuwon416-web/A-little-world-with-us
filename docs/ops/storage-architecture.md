# Media storage architecture

| Media class | Primary storage | Limit | Purpose |
| --- | --- | --- | --- |
| Memory images, profile pictures, thumbnails | Cloudinary | < 10 MB | Image optimization + CDN |
| Shared documents, chat attachments | Supabase Storage | < 50 MB | Encrypted object storage and simple Supabase access |
| Large shared media, memory backups | Backblaze B2 | > 50 MB | Lower-cost durable shared-media/archive tier |
| Memory export / archive | Google Drive | User-controlled | Export/archive into the user's own Drive |

## Rules

- Supabase PostgreSQL remains the metadata/source of truth.
- Never put provider secrets in client code.
- Cloudinary is the image tier, not the generic document tier.
- Supabase Storage remains the normal private document/chat tier.
- B2 is private by default; the server issues scoped upload/download authorization.
- Google Drive is an export/archive destination, not the primary media store.
- Account deletion must not remove shared couple media solely because one user's identity is deleted.
- Provider references belong in metadata so media can be migrated without changing the product record.
- Files above the intended provider limit must be rejected rather than silently falling back to a more expensive or less suitable provider.

## B2 large-file handling

The web app prepares a scoped B2 upload target after authenticating the user and verifying accepted couple membership. The client can upload directly to that target so large bodies do not have to pass through a serverless API route. B2 upload targets and download authorizations are temporary.

Backblaze's Native API requires a get-upload-url call before upload and supports scoped download authorization for private buckets. Multipart upload is available for large files.
