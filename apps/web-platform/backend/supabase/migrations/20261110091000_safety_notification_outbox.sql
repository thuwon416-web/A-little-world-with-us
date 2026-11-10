DO $$ BEGIN
  CREATE TYPE public.safety_notification_status AS ENUM ('pending', 'processing', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.safety_checkins
  ADD COLUMN IF NOT EXISTS notification_status public.safety_notification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_notification_error text;

CREATE TABLE IF NOT EXISTS public.safety_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.safety_checkins(id) ON DELETE CASCADE,
  status public.safety_notification_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checkin_id)
);

INSERT INTO public.safety_notification_outbox(checkin_id)
SELECT id FROM public.safety_checkins WHERE status = 'expired'
ON CONFLICT (checkin_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS safety_notification_outbox_pending_idx
  ON public.safety_notification_outbox(next_attempt_at)
  WHERE status = 'pending';

ALTER TABLE public.safety_notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.safety_notification_outbox FROM anon, authenticated;
GRANT ALL ON public.safety_notification_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_missed_checkin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status IS DISTINCT FROM 'expired' THEN
    INSERT INTO public.safety_notification_outbox(checkin_id)
    VALUES (NEW.id)
    ON CONFLICT (checkin_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS safety_checkin_notification_outbox ON public.safety_checkins;
CREATE TRIGGER safety_checkin_notification_outbox
AFTER UPDATE OF status ON public.safety_checkins
FOR EACH ROW EXECUTE FUNCTION public.enqueue_missed_checkin_notification();
