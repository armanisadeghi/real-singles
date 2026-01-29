-- RealSingles Database Schema
-- Migration: 00021_preserve_unmatch_history
-- Description: Add unmatch history tracking to prevent rediscovery after unmatch

-- ============================================
-- ADD UNMATCH TRACKING COLUMNS TO MATCHES
-- ============================================

-- Add columns to track unmatch state
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_unmatched BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS unmatched_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS unmatched_by UUID REFERENCES users(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS unmatch_reason TEXT;

-- Add index for efficient queries filtering out unmatched users
CREATE INDEX IF NOT EXISTS idx_matches_is_unmatched ON matches(user_id, target_user_id, is_unmatched);
CREATE INDEX IF NOT EXISTS idx_matches_unmatched_at ON matches(unmatched_at) WHERE unmatched_at IS NOT NULL;

-- ============================================
-- UPDATE RLS POLICIES TO EXCLUDE UNMATCHED
-- ============================================

-- Drop existing policies on matches table
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can create their own matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;
DROP POLICY IF EXISTS "Users can delete their own matches" ON matches;

-- Create new RLS policies that respect unmatch status
-- Users can view their own match actions (including unmatched for history)
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Users can create new matches (only if no unmatched history exists)
CREATE POLICY "Users can create their own matches" ON matches
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent re-matching if either user has unmatched
    NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE (
        (m.user_id = user_id AND m.target_user_id = target_user_id) OR
        (m.user_id = target_user_id AND m.target_user_id = user_id)
      )
      AND m.is_unmatched = true
    )
  );

-- Users can update their own match actions
CREATE POLICY "Users can update their own matches" ON matches
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Users cannot hard-delete matches anymore (soft delete only via is_unmatched)
-- But allow delete for cleanup by admins
CREATE POLICY "Only service role can delete matches" ON matches
  FOR DELETE USING (
    false -- Regular users cannot delete
  );

-- ============================================
-- HELPER FUNCTION TO SOFT-DELETE MATCHES
-- ============================================

CREATE OR REPLACE FUNCTION unmatch_user(
  p_user_id UUID,
  p_target_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_conversation_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user IDs'
    );
  END IF;
  
  IF p_user_id = p_target_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot unmatch yourself'
    );
  END IF;
  
  -- Check if match exists
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE (user_id = p_user_id AND target_user_id = p_target_user_id)
      OR (user_id = p_target_user_id AND target_user_id = p_user_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No match exists'
    );
  END IF;
  
  -- Soft-delete matches in both directions
  UPDATE matches
  SET 
    is_unmatched = true,
    unmatched_at = NOW(),
    unmatched_by = p_user_id,
    unmatch_reason = p_reason
  WHERE (user_id = p_user_id AND target_user_id = p_target_user_id)
     OR (user_id = p_target_user_id AND target_user_id = p_user_id);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Find and archive the conversation (if it exists)
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2 
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = p_user_id 
    AND cp2.user_id = p_target_user_id
  LIMIT 1;
  
  IF v_conversation_id IS NOT NULL THEN
    -- Mark conversation as archived by setting both users' is_archived flag
    -- This way each user can independently archive/unarchive
    UPDATE conversation_participants
    SET is_archived = true,
        last_read_at = NOW()
    WHERE conversation_id = v_conversation_id
      AND user_id IN (p_user_id, p_target_user_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'unmatched_count', v_updated_count,
    'conversation_archived', v_conversation_id IS NOT NULL,
    'conversation_id', v_conversation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD ARCHIVED FLAG TO CONVERSATION_PARTICIPANTS
-- ============================================

ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_archived ON conversation_participants(user_id, is_archived);

-- ============================================
-- HELPER FUNCTION TO CHECK IF USERS HAVE UNMATCH HISTORY
-- ============================================

CREATE OR REPLACE FUNCTION has_unmatch_history(
  p_user_id UUID,
  p_target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM matches
    WHERE (
      (user_id = p_user_id AND target_user_id = p_target_user_id) OR
      (user_id = p_target_user_id AND target_user_id = p_user_id)
    )
    AND is_unmatched = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- UPDATE EXISTING MATCH RECORDS
-- ============================================

-- Set default values for existing records (they're still active)
UPDATE matches
SET 
  is_unmatched = false,
  unmatched_at = NULL,
  unmatched_by = NULL,
  unmatch_reason = NULL
WHERE is_unmatched IS NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN matches.is_unmatched IS 'Soft delete flag - true if users have unmatched. Prevents rediscovery.';
COMMENT ON COLUMN matches.unmatched_at IS 'Timestamp when unmatch occurred';
COMMENT ON COLUMN matches.unmatched_by IS 'User ID who initiated the unmatch';
COMMENT ON COLUMN matches.unmatch_reason IS 'Optional reason for unmatch (e.g., "not_interested", "inappropriate")';

COMMENT ON FUNCTION unmatch_user IS 'Soft-delete a match and archive conversation. Preserves history to prevent rediscovery.';
COMMENT ON FUNCTION has_unmatch_history IS 'Check if two users have unmatched before. Use in discovery queries to filter out.';

COMMENT ON COLUMN conversation_participants.is_archived IS 'User-specific archive flag for conversations (e.g., after unmatch)';
