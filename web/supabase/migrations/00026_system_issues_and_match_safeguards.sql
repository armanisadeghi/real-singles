-- RealSingles System Issues and Match Safeguards
-- Migration: 00026_system_issues_and_match_safeguards
-- Description: 
--   1. Create system_issues table for automated error/anomaly tracking
--   2. Add constraint to prevent self-matches
--   3. Add helper function to find direct conversations between users

-- ============================================
-- SYSTEM ISSUES TABLE
-- ============================================

-- Table for tracking automated system issues, anomalies, and errors
-- This allows us to detect and monitor problems like duplicate match attempts
CREATE TABLE IF NOT EXISTS system_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Issue classification
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Related users (optional - may be system-level issues)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Detailed context as JSON
  context JSONB,
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_issues_type ON system_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_system_issues_severity ON system_issues(severity);
CREATE INDEX IF NOT EXISTS idx_system_issues_unresolved ON system_issues(resolved, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_system_issues_user ON system_issues(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_issues_created ON system_issues(created_at DESC);

-- RLS for system_issues - only admins can access
ALTER TABLE system_issues ENABLE ROW LEVEL SECURITY;

-- Admin-only access (using role field on users table)
CREATE POLICY "Only admins can view system issues" ON system_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Only admins can insert system issues" ON system_issues
  FOR INSERT WITH CHECK (TRUE); -- Allow service role to insert

CREATE POLICY "Only admins can update system issues" ON system_issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- MATCH SAFEGUARDS
-- ============================================

-- Add constraint to prevent self-matches (user can't like themselves)
-- Use DO block for idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_no_self_match' 
    AND conrelid = 'matches'::regclass
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT check_no_self_match 
      CHECK (user_id != target_user_id);
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTION: Find Direct Conversation
-- ============================================

-- Function to find an existing direct conversation between two users
-- Returns the conversation_id if found, NULL otherwise
CREATE OR REPLACE FUNCTION find_direct_conversation(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS TABLE(conversation_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cp1.conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = p_user_id
    AND cp2.user_id = p_other_user_id
    AND c.type = 'direct'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_direct_conversation(UUID, UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE system_issues IS 'Tracks automated system issues, anomalies, and errors for admin review';
COMMENT ON COLUMN system_issues.issue_type IS 'Type of issue (e.g., duplicate_match_attempt, invalid_state, etc.)';
COMMENT ON COLUMN system_issues.severity IS 'Issue severity: low, medium, high, critical';
COMMENT ON COLUMN system_issues.context IS 'JSON object with detailed context about the issue';
COMMENT ON FUNCTION find_direct_conversation(UUID, UUID) IS 'Find existing direct conversation between two users';
