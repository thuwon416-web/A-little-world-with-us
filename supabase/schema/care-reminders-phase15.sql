-- ============================================
-- Phase 15: Care Reminders Table
-- ============================================

-- Care Reminders Table
CREATE TABLE IF NOT EXISTS care_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (
    reminder_type IN ('pms', 'period', 'fertile', 'symptom')
  ),
  enabled BOOLEAN DEFAULT true,
  scheduled_date DATE,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_care_reminders_user_id ON care_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_care_reminders_type ON care_reminders(reminder_type);

-- Enable RLS
ALTER TABLE care_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own reminders
CREATE POLICY "Users can view own reminders"
ON care_reminders FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert own reminders
CREATE POLICY "Users can insert own reminders"
ON care_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update own reminders
CREATE POLICY "Users can update own reminders"
ON care_reminders FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can delete own reminders
CREATE POLICY "Users can delete own reminders"
ON care_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE care_reminders IS 'Smart reminders for PMS, period, fertile days, and symptom check-ins';
