-- Bound direct Supabase Storage uploads while preserving encrypted payloads
-- (application/octet-stream) and legacy MIME types from existing app clients.
-- Large chat attachments above 50 MiB already use the Backblaze B2 path.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = case id
      when 'chat_files' then array[
        'application/octet-stream', 'image/*', 'audio/*',
        'application/pdf', 'text/plain'
      ]::text[]
      when 'chat_photos' then array[
        'application/octet-stream', 'image/*'
      ]::text[]
      when 'voice_messages' then array[
        'application/octet-stream', 'audio/*'
      ]::text[]
      when 'gallery' then array[
        'application/octet-stream', 'image/*'
      ]::text[]
      when 'memories' then array[
        'application/octet-stream', 'image/*', 'audio/*', 'application/pdf'
      ]::text[]
      when 'surprises' then array[
        'application/octet-stream', 'image/*', 'application/pdf'
      ]::text[]
      else allowed_mime_types
    end
where id in (
  'chat_files',
  'chat_photos',
  'voice_messages',
  'gallery',
  'memories',
  'surprises'
);

-- Surprise attachments are validated by the app at 5 MiB.
update storage.buckets
set file_size_limit = 5242880
where id = 'surprises';
