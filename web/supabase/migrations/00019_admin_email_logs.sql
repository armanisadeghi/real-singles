-- Migration: Admin Email Logs
-- Tracks emails sent from the admin portal for audit purposes

-- Create the admin_email_logs table (idempotent)
DROP TABLE IF EXISTS admin_email_logs;

CREATE TABLE admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES users(id) NOT NULL,
  recipient_count INTEGER NOT NULL,
  subject TEXT NOT NULL,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_sent_by ON admin_email_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_created_at ON admin_email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE admin_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow admins/moderators to view all logs
DROP POLICY IF EXISTS "Admins can view email logs" ON admin_email_logs;
CREATE POLICY "Admins can view email logs"
  ON admin_email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'moderator')
    )
  );

-- RLS Policy: Allow admins/moderators to insert logs
DROP POLICY IF EXISTS "Admins can insert email logs" ON admin_email_logs;
CREATE POLICY "Admins can insert email logs"
  ON admin_email_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Grant service role full access (for admin client which bypasses RLS)
GRANT ALL ON admin_email_logs TO service_role;
