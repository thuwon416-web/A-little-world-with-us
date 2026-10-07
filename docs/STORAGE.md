# Storage

Owner: Backend / Storage
Update when: media providers, retention, encryption, or retrieval paths change
Last Updated: 2026-10-08

Supabase stores application metadata/source-of-truth references.

Provider paths currently documented include Cloudinary for normal/small media, Backblaze B2 for large media where active, Google Drive for connected shared-memory storage when enabled, and Supabase Storage for documents/chat attachments where configured.

The exact precedence between Cloudinary, B2, Drive, and Supabase Storage is VERIFY because historical documentation conflicted and live configuration must be checked.

Drive Web callback is /api/drive/callback. Production OAuth is host-bound. Shared-memory uploads must persist provider state and Supabase metadata, and retrieval must work through authenticated application paths.

Existing encryption documentation describes application-level encryption, not end-to-end encryption. Retention must be provider-aware.

B2 setup is provider-specific; real upload/download/authorization remains a verification item if B2 is active.