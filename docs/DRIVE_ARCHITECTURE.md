# Google Drive-first media and archive architecture

Owner: Backend / Storage
Status: repository-side implementation in progress; authenticated/device E2E remains a release gate.
Last Updated: 2026-10-08

## Canonical model

Google Drive is the persistent original-media/archive store.

Supabase remains the application metadata/index source of truth:
- memory ownership, couple scope, dates, captions, categories and locations
- Drive file/folder IDs
- chat message metadata and Drive media references
- daily chat archive index

Local Web/Mobile storage is cache/offline recovery only. It is not the canonical copy.

## Drive layout

App-created shared data is organized as:

```
A Little World With Us/
└── Couples/
    └── {couple-id}/
        ├── Memories/
        │   └── {year}/
        │       └── {memory-id}/
        │           └── original-image
        └── Chat/
            └── {year}/
                └── {month}/
                    ├── {date}.json
                    └── chat-image files
```

The Drive root ID is stored on the user's `google_drive_connections.root_folder_id`. Couple folders are shared with the partner's profile email when app-created content is first stored, so the partner can retain access through their own Drive connection. Normal memory deletion moves the Drive original to `Archive/Deleted Memories` and records it in `drive_media_archive`; sync skips the Archive branch so the deleted memory is not resurrected.

## External Drive memory import

A connected user can manually create a folder such as `Kalaw 2026` under the app's Drive root and place images in it.

The Memories page calls `POST /api/drive/sync-memories` and indexes previously unseen image files into `public.memories` with:
- `storage_provider=google_drive`
- `drive_file_id`
- `drive_folder_id`
- the external folder name as the memory title/group label
- Drive modified date as the memory date

The sync is duplicate-safe by `drive_file_id` and skips the Chat/System archive branches.

## Chat media

Chat images prefer Google Drive when the authenticated Drive connection is active and the image is within the Drive chat-image limit. Larger/non-image paths keep their existing storage tiers.

Supabase `messages` stores:
- `media_storage_provider`
- `media_storage_path`
- `media_storage_file_id`
- `media_size_bytes`

A Drive-backed chat message is rendered through the authenticated `/api/drive/file` route.

## Chat deletion policy

Deleting a chat message is a message/UI operation. It does not delete a Drive-backed original.

Permanent Drive deletion is a separate operation and must be explicit.

This prevents normal message deletion from destroying the archive.

## Daily chat archive

The Web chat archives the currently visible day's decrypted chat content to:

`Chat/{year}/{month}/{date}.json`

The archive is updated rather than creating duplicate daily files. `chat_archive_days` stores the Drive file/folder IDs, owner, date and message count so the app can browse/index archives by month/day.

The archive contains message text and Drive media references; it is an archive copy, not the operational chat source.

## OAuth scope

External folder synchronization requires broader Drive access than `drive.file`. The OAuth start route now requests:

`https://www.googleapis.com/auth/drive`

Existing connections obtained under the old `drive.file` scope must be re-authorized before external-folder sync can be relied on. This is an owner-side verification/reconnect step, not a reason to stop repository-side work.

## Migration

`backend/supabase/bootstrap/53_drive_first_archive.sql` adds:
- `google_drive_connections.root_folder_id`
- `memories.drive_folder_id`
- `chat_archive_days` archive index

A follow-up migration adds `chat_archive_days.owner_id` for authenticated Drive ownership.

## Safety rules

1. Never treat a local cache copy as the canonical original.
2. Never delete a Drive original as a side effect of normal chat deletion.
3. Do not index Drive files outside the connected app root unless an explicit import flow is added.
4. Keep Supabase IDs and ownership checks for every Drive retrieval.
5. Shared couple media must survive account deletion. Erasure revokes only the deleting user's private Drive OAuth connection; Drive files are not deleted as a side effect. Retained archive ownership can become ownerless while the remaining partner's connected Drive account provides access.
6. Permanent Drive deletion is explicit; an owner or, after owner erasure, an accepted couple member can purge a retained archive file.
5. Do not claim Drive upload/import/archive E2E is complete until authenticated production evidence exists.
