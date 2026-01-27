-- RealSingles Supabase Messaging System
-- Migration: 00014_supabase_messaging
-- Description: Add messages table for Supabase-based real-time messaging
--              Replaces Agora Chat with native Supabase Realtime

-- ============================================
-- MESSAGES TABLE
-- ============================================

-- Messages table - stores all chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system')),

  -- For media messages
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_metadata JSONB, -- width, height, duration, size, etc.

  -- Message status tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),

  -- Reply support (optional - for threaded conversations)
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Soft delete (for "delete for me" vs "delete for everyone")
  deleted_at TIMESTAMPTZ,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,

  -- Prevent duplicate messages (client-side idempotency key)
  client_message_id TEXT
);

-- ============================================
-- MESSAGE REACTIONS TABLE (Optional - for future)
-- ============================================

CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL, -- emoji or reaction type
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, user_id, reaction)
);

-- ============================================
-- MESSAGE READ RECEIPTS TABLE
-- ============================================

-- Track individual message read status per user (for group chats)
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Primary query: get messages for a conversation (sorted by time, paginated)
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- For fetching unread messages
CREATE INDEX idx_messages_conversation_status ON messages(conversation_id, status);

-- For sender filtering
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- For client-side deduplication
CREATE INDEX idx_messages_client_id ON messages(client_message_id) WHERE client_message_id IS NOT NULL;

-- For reply threads
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- For soft delete filtering
CREATE INDEX idx_messages_not_deleted ON messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- Message reactions index
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);

-- Read receipts indexes
CREATE INDEX idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user ON message_read_receipts(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Messages: Users can only read messages from conversations they're part of
CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
    AND (deleted_at IS NULL OR sender_id = auth.uid())
  );

-- Messages: Users can insert messages to conversations they're part of
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
    -- Ensure not blocked by any participant
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      JOIN conversation_participants cp ON cp.conversation_id = messages.conversation_id
      WHERE (b.blocker_id = cp.user_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = cp.user_id)
    )
  );

-- Messages: Users can update their own messages (for edits and soft deletes)
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Messages: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Reactions: Users can read reactions on messages they can see
CREATE POLICY "Users can read reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- Reactions: Users can add reactions to messages they can see
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- Reactions: Users can remove their own reactions
CREATE POLICY "Users can remove own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Read receipts: Users can see read receipts for messages in their conversations
CREATE POLICY "Users can read message receipts" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_read_receipts.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- Read receipts: Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_receipts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_read_receipts.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update conversation updated_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for messages table
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Get user's last read timestamp
  SELECT last_read_at INTO v_last_read
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  -- Count messages after last read (excluding user's own messages)
  SELECT COUNT(*) INTO v_count
  FROM messages
  WHERE conversation_id = p_conversation_id
  AND sender_id != p_user_id
  AND deleted_at IS NULL
  AND (v_last_read IS NULL OR created_at > v_last_read);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation with last message and unread count
CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  conversation_type TEXT,
  group_name TEXT,
  group_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_sender_id UUID,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    c.type as conversation_type,
    c.group_name,
    c.group_image_url,
    c.created_at,
    c.updated_at,
    m.content as last_message_content,
    m.sender_id as last_message_sender_id,
    m.created_at as last_message_at,
    get_unread_count(c.id, p_user_id) as unread_count
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  LEFT JOIN LATERAL (
    SELECT content, sender_id, created_at
    FROM messages
    WHERE conversation_id = c.id
    AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  WHERE cp.user_id = p_user_id
  ORDER BY COALESCE(m.created_at, c.updated_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
