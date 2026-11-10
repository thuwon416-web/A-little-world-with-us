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


-- Claim and finalize a notification in one database transaction so a worker
-- crash cannot leave the check-in and its outbox row in different states.
CREATE OR REPLACE FUNCTION public.claim_safety_notification(p_checkin_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempts integer;
BEGIN
  UPDATE public.safety_checkins
     SET status = 'expired',
         notification_status = 'processing',
         notification_attempts = notification_attempts + 1,
         last_notification_error = NULL,
         updated_at = now()
   WHERE id = p_checkin_id
     AND notification_status = 'pending'
     AND status IN ('pending', 'expired')
     AND expected_until < now()
  RETURNING notification_attempts INTO v_attempts;

  IF v_attempts IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.safety_notification_outbox
     SET status = 'processing', attempts = v_attempts, updated_at = now()
   WHERE checkin_id = p_checkin_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Safety notification outbox row missing for claimed check-in';
  END IF;
  RETURN v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_safety_notification_state(
  p_checkin_id uuid,
  p_status public.safety_notification_status,
  p_attempts integer,
  p_error text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.safety_checkins
     SET notification_status = p_status,
         notification_attempts = p_attempts,
         last_notification_error = left(p_error, 500),
         updated_at = now()
   WHERE id = p_checkin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Safety check-in not found while updating notification state';
  END IF;

  UPDATE public.safety_notification_outbox
     SET status = p_status,
         attempts = p_attempts,
         last_error = left(p_error, 500),
         updated_at = now(),
         next_attempt_at = CASE WHEN p_status = 'pending' THEN now() + interval '5 minutes' ELSE next_attempt_at END
   WHERE checkin_id = p_checkin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Safety notification outbox row missing while updating state';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_safety_notification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_safety_notification_state(uuid, public.safety_notification_status, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_safety_notification(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_safety_notification_state(uuid, public.safety_notification_status, integer, text) TO service_role;
