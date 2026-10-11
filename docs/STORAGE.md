# Storage

Owner: Backend / Storage
Update when: media providers, retention, encryption, or retrieval paths change
Last Updated: 2026-10-11

Supabase stores application metadata/source-of-truth references.

## Verified Drive-first shared-memory behavior

For Web shared-memory photo uploads, the current code path is:

1. **Google Drive first** when the authenticated user's Drive connection reports connected.
2. App-created uploads are organized under `A Little World With Us/Couples/{couple-id}/Memories/{year}/{memory-id}/`.
3. Supabase stores the memory metadata and Drive IDs; it does not hold the canonical image binary.
4. External image folders under the app Drive root can be indexed with `POST /api/drive/sync-memories`.
5. Existing Cloudinary/encrypted Supabase paths remain readable fallbacks for older/non-Drive records.

Chat image attachments also prefer Drive when connected. Daily chat text archives are stored as `Chat/{year}/{month}/{date}.json`.

## Other storage paths

- Backblaze B2 is a separate large-media tier where the corresponding message/media path is active; real upload/download/authorization remains a release gate.
- Supabase Storage remains the encrypted fallback/private document path where configured.
- Google Drive also has explicit per-memory upload/retrieval/export routes and is not the same thing as native mobile OAuth tooling.

Existing encryption documentation describes application-level encryption, not end-to-end encryption. Retention must be provider-aware.


## Drive E2E close-out status

Code-level behavior is implemented, but live Drive behavior is not yet verified. A live Supabase query on 2026-10-11 found 51 memory metadata rows; their provider files and rendering have not been individually reconciled. The available environment cannot authenticate a real Google account or inspect Google Cloud OAuth client registration. A real upload/re-render test must demonstrate:
1. connected Drive account,
2. upload succeeds,
3. `memories.storage_provider=google_drive`,
4. non-null `memories.drive_file_id`,
5. retrieval through `/api/drive/file`,
6. image renders again,
7. cleanup/delete behavior succeeds.


See [docs/DRIVE_ARCHITECTURE.md](./DRIVE_ARCHITECTURE.md) for the canonical folder, import, chat archive and deletion rules.


## Legacy Gallery migration safety (2026-10-11)

The legacy `/gallery` page still reads objects from the Supabase Storage `gallery` bucket, while `/memories` uses `public.memories` plus provider-specific storage. Keep both visible until a safe, idempotent bridge has been implemented and tested. Do not delete or move legacy objects as part of indexing. Before migration, record per-couple object counts and paths, reconcile metadata/provider IDs, check duplicates and file reachability, and retain a rollback path. The live `public.memories` table contains 51 rows as of 2026-10-11; earlier zero-row statements are stale.
