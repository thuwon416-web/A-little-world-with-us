-- Durable audit trail for access to Drive media, including orphaned media.
CREATE TABLE IF NOT EXISTS public.drive_media_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('drive_orphan_media_access', 'drive_media_access')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('read', 'delete')),
  outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied')),
  record_type text,
  record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_media_access_audit_created_idx
  ON public.drive_media_access_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS drive_media_access_audit_file_idx
  ON public.drive_media_access_audit(file_id, created_at DESC);

ALTER TABLE public.drive_media_access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.drive_media_access_audit FROM anon, authenticated;
GRANT ALL ON public.drive_media_access_audit TO service_role;
