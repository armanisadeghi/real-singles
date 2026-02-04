-- ============================================
-- MESSAGING PERMISSION FUNCTION
-- ============================================
-- This function determines if two users can create a conversation.
-- SECURITY DEFINER allows bypassing RLS to check permissions
-- without triggering infinite recursion.
--
-- Returns TRUE if:
-- 1. Either user is admin/moderator, OR
-- 2. Either user is an approved matchmaker, OR
-- 3. They have a mutual match (both liked each other, not unmatched)

CREATE OR REPLACE FUNCTION can_create_conversation(
  p_user_a UUID,
  p_user_b UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin_or_mod BOOLEAN;
  v_is_approved_matchmaker BOOLEAN;
  v_is_mutual_match BOOLEAN;
BEGIN
  -- Check if either user is admin/moderator
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id IN (p_user_a, p_user_b) 
    AND role IN ('admin', 'moderator')
  ) INTO v_is_admin_or_mod;
  
  IF v_is_admin_or_mod THEN
    RETURN TRUE;
  END IF;
  
  -- Check if either user is an approved matchmaker
  SELECT EXISTS (
    SELECT 1 FROM matchmakers 
    WHERE user_id IN (p_user_a, p_user_b) 
    AND status = 'approved'
  ) INTO v_is_approved_matchmaker;
  
  IF v_is_approved_matchmaker THEN
    RETURN TRUE;
  END IF;
  
  -- Check for mutual match:
  -- User A liked User B AND User B liked User A (both not unmatched)
  SELECT EXISTS (
    SELECT 1 FROM matches m1
    JOIN matches m2 ON m1.target_user_id = m2.user_id AND m1.user_id = m2.target_user_id
    WHERE m1.user_id = p_user_a
      AND m1.target_user_id = p_user_b
      AND m1.action IN ('like', 'super_like')
      AND m1.is_unmatched = FALSE
      AND m2.action IN ('like', 'super_like')
      AND m2.is_unmatched = FALSE
  ) INTO v_is_mutual_match;
  
  RETURN v_is_mutual_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_create_conversation(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION can_create_conversation IS 
  'Check if two users can create a conversation. Returns TRUE if they have a mutual match, or if either is an admin/moderator/approved matchmaker.';

-- ============================================
-- UPDATE CONVERSATIONS INSERT POLICY
-- ============================================
-- Allow users to create conversations (the participant policy will check permissions)

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

-- ============================================
-- UPDATE CONVERSATION_PARTICIPANTS INSERT POLICY  
-- ============================================
-- This is the key policy that enforces messaging permissions

DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;

CREATE POLICY "Users can add participants to conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    -- Can always add yourself
    auth.uid() = user_id
    -- OR can add others if you created the conversation
    OR (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
      )
      -- For adding others to direct conversations, verify messaging permission
      AND (
        -- Group conversations don't need match check (handled separately)
        EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.id = conversation_participants.conversation_id
          AND c.type = 'group'
        )
        -- Direct conversations require permission check
        OR can_create_conversation(auth.uid(), user_id)
      )
    )
  );
