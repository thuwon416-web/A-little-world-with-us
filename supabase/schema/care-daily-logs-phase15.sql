-- ============================================
-- Phase 15: Care Daily Logs Table
-- ============================================

-- Care Daily Logs Table
CREATE TABLE IF NOT EXISTS care_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_links(id),
  log_date DATE NOT NULL,
  mood TEXT,
  symptoms TEXT[],
  sex TEXT[],
  medication_taken BOOLEAN,
  water_intake INTEGER,
  weight NUMERIC,
  temperature NUMERIC,
  notes TEXT,
  ovulation_test TEXT CHECK (ovulation_test IN ('Positive', 'Negative', 'Did not take')),
  activities TEXT[],
  other_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_care_daily_logs_user_id ON care_daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_care_daily_logs_date ON care_daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_care_daily_logs_couple_id ON care_daily_logs(couple_id);

-- Enable RLS
ALTER TABLE care_daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own logs
CREATE POLICY "Users can view own care logs"
ON care_daily_logs FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own logs
CREATE POLICY "Users can insert own care logs"
ON care_daily_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own logs
CREATE POLICY "Users can update own care logs"
ON care_daily_logs FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Partner can view logs (couple access)
CREATE POLICY "Partners can view each other's care logs"
ON care_daily_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM couple_links cl
    WHERE cl.status = 'accepted'
      AND (
        (cl.inviter_id = auth.uid() AND cl.accepted_by = user_id)
        OR (cl.accepted_by = auth.uid() AND cl.inviter_id = user_id)
      )
  )
);

-- Comment
COMMENT ON TABLE care_daily_logs IS 'Daily health and wellness logs for cycle tracking';
