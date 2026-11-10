-- Durable, independently retryable emergency-contact email delivery.
CREATE TABLE IF NOT EXISTS public.safety_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.safety_checkins(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  status public.safety_notification_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checkin_id, contact_id)
);

CREATE INDEX IF NOT EXISTS safety_email_outbox_pending_idx
  ON public.safety_email_outbox(next_attempt_at)
  WHERE status = 'pending';

ALTER TABLE public.safety_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.safety_email_outbox FROM anon, authenticated;
GRANT ALL ON public.safety_email_outbox TO service_role;


-- Backfill pending email work for check-ins that were already expired before
-- this outbox was installed. Existing contacts remain the source of addresses.
INSERT INTO public.safety_email_outbox(checkin_id, contact_id)
SELECT checkins.id, contacts.id
  FROM public.safety_checkins AS checkins
  JOIN public.emergency_contacts AS contacts
    ON contacts.couple_id = checkins.couple_id
 WHERE checkins.status = 'expired'
   AND contacts.is_active = true
   AND contacts.notify_on_checkin_missed = true
ON CONFLICT (checkin_id, contact_id) DO NOTHING;
