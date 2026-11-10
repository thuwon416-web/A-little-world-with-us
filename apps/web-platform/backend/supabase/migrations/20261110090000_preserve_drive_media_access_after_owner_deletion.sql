-- Preserve the distinction between intentionally orphaned couple media and
-- records that never had an owner. This migration is NOT applied automatically.
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS owner_deleted_at timestamptz;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS owner_deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_drive_media_owner_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.memories
     SET owner_deleted_at = COALESCE(owner_deleted_at, now())
   WHERE user_id = OLD.id;
  UPDATE public.messages
     SET owner_deleted_at = COALESCE(owner_deleted_at, now())
   WHERE sender_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS mark_drive_media_owner_deleted_before_user_delete ON auth.users;
CREATE TRIGGER mark_drive_media_owner_deleted_before_user_delete
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.mark_drive_media_owner_deleted();
