-- ═══════════════════════════════════════════════════════════
-- Media Encryption Support — mime_type columns
--
-- Encrypted blobs lose their original type. We store the
-- original mime type in DB so we can restore it after decrypt.
-- ═══════════════════════════════════════════════════════════

-- memories table: photo/video uploads
ALTER TABLE IF EXISTS memories
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- messages table: chat media (photo/file)
ALTER TABLE IF EXISTS messages
  ADD COLUMN IF NOT EXISTS media_mime_type TEXT;

-- time_capsule_attachments table: surprise attachments
ALTER TABLE IF EXISTS time_capsule_attachments
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Leave existing rows NULL: encrypted legacy object paths do not reliably
-- reveal their original format. The app applies its backwards-compatible
-- fallback, while new uploads store their exact MIME type.

-- Documentation
COMMENT ON COLUMN memories.mime_type IS 
  'Original mime type of the media file (encrypted at rest)';
COMMENT ON COLUMN messages.media_mime_type IS 
  'Original mime type of chat media (encrypted at rest)';
COMMENT ON COLUMN time_capsule_attachments.mime_type IS 
  'Original mime type of surprise attachment (encrypted at rest)';
