-- ============================================
-- Phase 10 Update: Messages Table Enhancements
-- ============================================

-- Add reply_to column to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Add message_type column if not exists with proper constraints
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT CHECK (
    message_type IN ('text', 'voice', 'photo', 'sticker', 'gif', 'file')
  ) DEFAULT 'text';

-- Index for reply_to
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);

-- Comments
COMMENT ON COLUMN messages.reply_to IS 'References parent message for threaded replies';
COMMENT ON COLUMN messages.message_type IS 'Type of message content';
