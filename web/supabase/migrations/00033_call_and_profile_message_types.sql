-- Add call and profile message types for rich messaging
-- Migration: 00033_call_and_profile_message_types.sql
-- 
-- This migration adds:
-- 1. 'call' message type - for showing call history in chat
-- 2. 'profile' message type - for profile preview cards shared by matchmakers
-- 3. 'metadata' column - for storing structured data (call duration, profile info, etc.)

-- ============================================================================
-- Add metadata column to messages table
-- ============================================================================
-- The metadata column stores structured data for special message types:
-- - call: { call_id, call_type (audio/video), duration_seconds, status (completed/missed/declined), participants }
-- - profile: { profile_id, first_name, age, location, profile_image_url }

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create index for metadata queries (e.g., finding all profile shares)
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN(metadata);

-- ============================================================================
-- Update message_type constraint to include new types
-- ============================================================================

-- Drop the old constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Add new constraint with call and profile types
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
  CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system', 'call', 'profile'));

-- ============================================================================
-- Create function to insert call message when call ends
-- ============================================================================

CREATE OR REPLACE FUNCTION create_call_message()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_name TEXT;
  v_call_status TEXT;
  v_content TEXT;
BEGIN
  -- Only create message when call has ended and has a conversation
  IF NEW.ended_at IS NOT NULL AND NEW.conversation_id IS NOT NULL AND OLD.ended_at IS NULL THEN
    
    -- Get caller name from the first participant
    SELECT p.first_name INTO v_caller_name
    FROM profiles p
    WHERE p.id = (NEW.participants->>0)::uuid
    LIMIT 1;
    
    -- Determine call status based on duration
    IF NEW.duration_seconds IS NULL OR NEW.duration_seconds < 3 THEN
      v_call_status := 'missed';
      v_content := CASE NEW.call_type
        WHEN 'video' THEN 'Missed video call'
        ELSE 'Missed voice call'
      END;
    ELSE
      v_call_status := 'completed';
      v_content := CASE NEW.call_type
        WHEN 'video' THEN 'Video call'
        ELSE 'Voice call'
      END;
    END IF;
    
    -- Insert the call message
    INSERT INTO messages (
      conversation_id,
      sender_id,
      content,
      message_type,
      metadata,
      status
    )
    SELECT
      NEW.conversation_id,
      (NEW.participants->>0)::uuid, -- First participant (caller) as sender
      v_content,
      'call',
      jsonb_build_object(
        'call_id', NEW.id,
        'call_type', NEW.call_type,
        'duration_seconds', COALESCE(NEW.duration_seconds, 0),
        'status', v_call_status,
        'participants', NEW.participants,
        'started_at', NEW.started_at,
        'ended_at', NEW.ended_at
      ),
      'sent'
    WHERE EXISTS (
      -- Ensure the caller is a valid user
      SELECT 1 FROM users WHERE id = (NEW.participants->>0)::uuid
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create call messages when calls end
DROP TRIGGER IF EXISTS trigger_create_call_message ON calls;
CREATE TRIGGER trigger_create_call_message
  AFTER UPDATE ON calls
  FOR EACH ROW
  WHEN (OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL)
  EXECUTE FUNCTION create_call_message();

-- ============================================================================
-- Note on RLS: The trigger function uses SECURITY DEFINER which bypasses RLS
-- No additional policy needed for system-generated call messages
-- ============================================================================

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN messages.metadata IS 'Structured data for special message types (call info, profile previews, etc.)';
