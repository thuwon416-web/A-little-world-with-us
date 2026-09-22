# Media Encryption — End-to-End

## Overview

All media (photos, voice messages, files) is encrypted at rest in Supabase Storage using AES-GCM with couple-specific keys. This ensures that even if storage is compromised, media content remains private to the couple.

## Format

**Encrypted blob structure:**
```
[version=2][iv_12_bytes][ciphertext]
```

- **Version byte:** `2` (for future format changes)
- **IV:** 12 random bytes (AES-GCM standard)
- **Ciphertext:** AES-GCM encrypted media

## Key Derivation

Encryption keys are derived from the couple ID, shared with chat encryption:

```typescript
const key = await deriveChatKey(coupleId)
```

This ensures that:
- Both partners can decrypt shared media
- Couples have separate encryption keys
- Key rotation can be done by changing the derivation function

## Upload Pattern

**Web:**
```typescript
import { encryptAndUpload } from '@/lib/mediaEncryption'

const { path: storedPath, mimeType } = await encryptAndUpload(
  file,
  coupleId,
  'memories',
  'user/photo.jpg',
  { cacheControl: '3600', upsert: false }
)

// Store in DB:
await supabase.from('memories').insert({
  storage_path: storedPath,
  mime_type: mimeType,  // Store original MIME type for decryption
  // ...
})
```

**Mobile:**
```typescript
import { encryptMedia } from '@/lib/mediaEncryption'

const encrypted = await encryptMedia(new Uint8Array(fileBytes), coupleId)
await supabase.storage.from('memories').upload(path, encrypted, {
  contentType: 'application/octet-stream',
  upsert: false,
})
```

## Download Pattern

**Web:**
```typescript
import { getCachedDecryptedUrl } from '@/lib/mediaEncryption'

const [imageUrl, setImageUrl] = useState<string>()

useEffect(() => {
  let mounted = true
  getCachedDecryptedUrl(coupleId, 'memories', path, mimeType)
    .then(url => mounted && setImageUrl(url))
    .catch(err => console.error('[Media] decrypt failed:', err))
  return () => { mounted = false }
}, [coupleId, path, mimeType])

<img src={imageUrl} alt="" />
```

**Mobile:**
```typescript
import { downloadDecryptAndCache } from '@/lib/mediaEncryption'

const [uri, setUri] = useState<string>()

useEffect(() => {
  let mounted = true
  downloadDecryptAndCache(coupleId, 'memories', path, mimeType)
    .then(fileUri => mounted && setUri(fileUri))
    .catch(err => console.warn('[Media] decrypt failed:', err))
  return () => { mounted = false }
}, [coupleId, path, mimeType])

<Image source={{ uri }} />
```

## Legacy Fallback

For existing unencrypted media (before deployment), `decryptMediaSafe` attempts decryption and falls back to returning the original blob on failure:

```typescript
const blob = await decryptMediaSafe(encryptedBlob, coupleId, mimeType)
// Returns decrypted blob OR original blob if decryption fails
```

## MIME Type Handling

Encrypted blobs lose their original type. The original MIME type is stored in the database:

- `memories.mime_type` — for memory photos/videos
- `messages.media_mime_type` — for chat media
- `time_capsule_attachments.mime_type` — for surprise attachments

For gallery (no DB table), `guessMimeTypeFromPath()` infers type from file extension.

## External URLs

External URLs (http/https) are not encrypted and continue to use signed URLs:

```typescript
if (isExternalUrl(path)) {
  const { data } = await supabase.storage.from('bucket').createSignedUrl(path, 3600)
  return data.signedUrl
}
```

This preserves support for:
- GIFs (hosted externally)
- Legacy external URLs
- Public avatars/profiles

## Skipped Files

The following files intentionally use signed URLs and are not encrypted:

- `src/features/chat/FileUpload.tsx` — Upload preview (temporary, not persisted)
- `mobile/components/ImageUpload.tsx` — Upload preview (temporary, not persisted)
- `src/app/api/export/route.ts` — Server-side export API (separate use case)

## Migration

Database migration `supabase/bootstrap/15_media_mime_types.sql` adds `mime_type` columns to support decryption:

```sql
ALTER TABLE memories ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_mime_type TEXT;
ALTER TABLE time_capsule_attachments ADD COLUMN IF NOT EXISTS mime_type TEXT;
```

Existing rows default to `image/jpeg` (best guess).

## Buckets

Encrypted media is stored in these Supabase Storage buckets:

- `memories` — Memory photos/videos
- `gallery` — Shared gallery
- `chat_photos` — Chat photos
- `chat_files` — Chat files
- `voice_messages` — Voice recordings
- `surprises` — Time capsule attachments

## Security Notes

- Keys are derived from couple ID, not stored directly
- IV is unique per encryption (12 random bytes)
- Decryption failures fall back to plaintext for legacy compatibility
- External URLs remain unencrypted (they're public anyway)
