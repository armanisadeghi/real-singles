-- Improve call message status detection
-- Migration: 00034_improve_call_message_status.sql
-- 
-- This migration updates the create_call_message function to:
-- 1. Check call_invitations table for actual call status (accepted, rejected, missed, cancelled)
-- 2. Provide more specific messages like "No answer", "Declined", etc.

-- ============================================================================
-- Update the create_call_message function with better status detection
-- ============================================================================

CREATE OR REPLACE FUNCTION create_call_message()
RETURNS TRIGGER AS $$
DECLARE
  v_call_status TEXT;
  v_content TEXT;
  v_invitation_status TEXT;
BEGIN
  -- Only create message when call has ended and has a conversation
  IF NEW.ended_at IS NOT NULL AND NEW.conversation_id IS NOT NULL AND OLD.ended_at IS NULL THEN
    
    -- Check the call invitation status for this room
    SELECT ci.status INTO v_invitation_status
    FROM call_invitations ci
    WHERE ci.room_name = NEW.room_name
    ORDER BY ci.created_at DESC
    LIMIT 1;
    
    -- Determine call status based on invitation status and duration
    IF v_invitation_status = 'rejected' THEN
      v_call_status := 'declined';
      v_content := CASE NEW.call_type
        WHEN 'video' THEN 'Video call declined'
        ELSE 'Voice call declined'
      END;
    ELSIF v_invitation_status = 'missed' OR v_invitation_status = 'cancelled' THEN
      v_call_status := 'missed';
      v_content := CASE NEW.call_type
        WHEN 'video' THEN 'Missed video call'
        ELSE 'Missed voice call'
      END;
    ELSIF NEW.duration_seconds IS NULL OR NEW.duration_seconds < 5 THEN
      -- Very short calls (< 5 seconds) are likely unanswered or quick hang-ups
      v_call_status := 'no_answer';
      v_content := CASE NEW.call_type
        WHEN 'video' THEN 'Video call - No answer'
        ELSE 'Voice call - No answer'
      END;
    ELSE
      -- Call was answered and lasted a reasonable time
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

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION create_call_message() IS 'Creates a message in chat when a call ends, with status: completed, declined, missed, or no_answer';
