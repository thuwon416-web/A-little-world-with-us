-- ============================================
-- Phase 10 Update: Chat Files Storage Bucket
-- ============================================

-- Create chat_files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'chat_files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Coupled users can upload chat files
CREATE POLICY "Coupled users can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_files'
  AND EXISTS (
    SELECT 1 FROM couple_links cl
    WHERE cl.status = 'accepted'
      AND (
        cl.inviter_id = auth.uid()
        OR cl.accepted_by = auth.uid()
      )
  )
);

-- RLS Policy: Coupled users can view chat files
CREATE POLICY "Coupled users can view chat files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_files'
  AND EXISTS (
    SELECT 1 FROM couple_links cl
    WHERE cl.status = 'accepted'
      AND (
        cl.inviter_id = auth.uid()
        OR cl.accepted_by = auth.uid()
      )
  )
);

-- RLS Policy: Users can delete their own chat files
CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat_files'
  AND auth.uid() = owner
);

-- Note: Chat files bucket created for file uploads in chat feature
