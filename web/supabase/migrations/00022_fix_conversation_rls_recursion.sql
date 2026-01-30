-- Fix infinite recursion in conversation_participants RLS policy
-- Migration: 00022_fix_conversation_rls_recursion
-- Description: The existing RLS policy on conversation_participants references itself,
--              causing PostgreSQL error 42P17 (infinite recursion detected).
--              This migration creates a SECURITY DEFINER function to safely check
--              participation without triggering RLS recursion.

-- ============================================
-- SECURITY DEFINER FUNCTION
-- ============================================
-- This function bypasses RLS to check if a user is a participant in a conversation.
-- Using SECURITY DEFINER allows the function to run with the privileges of the 
-- function owner (postgres), which bypasses RLS policies.

CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION is_conversation_participant IS 
  'Check if a user is a participant in a conversation. Uses SECURITY DEFINER to bypass RLS and prevent recursion.';

-- ============================================
-- FIX CONVERSATION_PARTICIPANTS POLICIES
-- ============================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read conversation participants" ON conversation_participants;

-- Create new policy using the security definer function
-- Users can read participants in conversations they're part of
CREATE POLICY "Users can read conversation participants" ON conversation_participants
  FOR SELECT USING (
    is_conversation_participant(conversation_id, auth.uid())
  );

-- Fix INSERT policy: Allow conversation creators to add participants
-- The old policy only allowed users to add themselves, but when creating
-- a conversation we need to add the other participant too
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;

CREATE POLICY "Users can add participants to conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    -- Can add yourself to any conversation
    auth.uid() = user_id
    -- OR can add others to conversations you created
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.created_by = auth.uid()
    )
  );

-- ============================================
-- FIX CONVERSATIONS POLICIES
-- ============================================

-- Drop the old policy that indirectly caused recursion
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;

-- Create new policy that allows:
-- 1. Creators to read their own conversations (needed for INSERT...SELECT pattern)
-- 2. Participants to read conversations they're in
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = created_by
    OR is_conversation_participant(id, auth.uid())
  );

-- ============================================
-- FIX MESSAGES POLICIES (also reference conversation_participants)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- Recreate with the safe function
CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT USING (
    is_conversation_participant(conversation_id, auth.uid())
    AND (deleted_at IS NULL OR sender_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_participant(conversation_id, auth.uid())
    -- Ensure not blocked by any participant (this is fine - blocks table is separate)
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      JOIN conversation_participants cp ON cp.conversation_id = messages.conversation_id
      WHERE (b.blocker_id = cp.user_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = cp.user_id)
    )
  );

-- ============================================
-- FIX MESSAGE_REACTIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can read reactions" ON message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;

CREATE POLICY "Users can read reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_reactions.message_id
      AND is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_reactions.message_id
      AND is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

-- ============================================
-- FIX MESSAGE_READ_RECEIPTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can read message receipts" ON message_read_receipts;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_receipts;

CREATE POLICY "Users can read message receipts" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_read_receipts.message_id
      AND is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read" ON message_read_receipts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_read_receipts.message_id
      AND is_conversation_participant(m.conversation_id, auth.uid())
    )
  );
