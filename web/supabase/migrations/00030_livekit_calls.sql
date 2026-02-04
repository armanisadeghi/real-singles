-- LiveKit Video/Audio Calls Infrastructure
-- Migration: 00030_livekit_calls.sql
-- 
-- This migration creates tables for call signaling and history tracking
-- to support LiveKit-based video and audio calls.

-- ============================================================================
-- Call Invitations Table (for signaling via Supabase Realtime)
-- ============================================================================
-- Used to notify users of incoming calls. Clients subscribe to this table
-- via Supabase Realtime to receive call notifications.

DROP TABLE IF EXISTS call_invitations CASCADE;

CREATE TABLE call_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  callee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  room_name TEXT NOT NULL,
  call_type TEXT CHECK (call_type IN ('audio', 'video')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'missed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Ensure we don't have multiple pending invitations for the same call
  CONSTRAINT unique_pending_invitation UNIQUE (caller_id, callee_id, room_name, status)
);

-- Indexes for efficient lookups
CREATE INDEX idx_call_invitations_callee ON call_invitations(callee_id, status);
CREATE INDEX idx_call_invitations_caller ON call_invitations(caller_id, status);
CREATE INDEX idx_call_invitations_room ON call_invitations(room_name);
CREATE INDEX idx_call_invitations_created ON call_invitations(created_at DESC);

-- ============================================================================
-- Calls Table (call history/logs)
-- ============================================================================
-- Stores completed call records for history tracking and analytics.

DROP TABLE IF EXISTS calls CASCADE;

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  speed_dating_session_id UUID REFERENCES virtual_speed_dating(id) ON DELETE SET NULL,
  call_type TEXT CHECK (call_type IN ('audio', 'video')) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  participants JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Either conversation_id or speed_dating_session_id should be set
  CONSTRAINT call_context_check CHECK (
    conversation_id IS NOT NULL OR 
    speed_dating_session_id IS NOT NULL OR
    room_name IS NOT NULL
  )
);

-- Indexes for efficient lookups
CREATE INDEX idx_calls_conversation ON calls(conversation_id);
CREATE INDEX idx_calls_speed_dating ON calls(speed_dating_session_id);
CREATE INDEX idx_calls_room ON calls(room_name);
CREATE INDEX idx_calls_started ON calls(started_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE call_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Call Invitations Policies
-- Users can see invitations where they are caller or callee
CREATE POLICY "Users can view their own call invitations"
  ON call_invitations FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can create invitations where they are the caller
CREATE POLICY "Users can create call invitations as caller"
  ON call_invitations FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Users can update invitations where they are caller or callee
CREATE POLICY "Users can update their own call invitations"
  ON call_invitations FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can delete invitations where they are the caller
CREATE POLICY "Users can delete their own call invitations"
  ON call_invitations FOR DELETE
  USING (auth.uid() = caller_id);

-- Calls Policies
-- Users can view calls they participated in
CREATE POLICY "Users can view calls they participated in"
  ON calls FOR SELECT
  USING (
    participants @> jsonb_build_array(auth.uid()::text) OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = calls.conversation_id
      AND cp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM speed_dating_registrations sdr
      WHERE sdr.session_id = calls.speed_dating_session_id
      AND sdr.user_id = auth.uid()
    )
  );

-- Users can create call records (for logging completed calls)
CREATE POLICY "Authenticated users can create call records"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update calls they participated in
CREATE POLICY "Users can update calls they participated in"
  ON calls FOR UPDATE
  USING (
    participants @> jsonb_build_array(auth.uid()::text)
  );

-- ============================================================================
-- Enable Realtime for call_invitations
-- ============================================================================
-- This allows clients to subscribe to incoming call notifications

DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'call_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_invitations;
  END IF;
END $$;

-- ============================================================================
-- Helper function to auto-calculate call duration
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_call_duration ON calls;
CREATE TRIGGER trigger_calculate_call_duration
  BEFORE UPDATE ON calls
  FOR EACH ROW
  WHEN (OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL)
  EXECUTE FUNCTION calculate_call_duration();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE call_invitations IS 'Real-time call invitations for LiveKit video/audio calls';
COMMENT ON TABLE calls IS 'Call history and logs for completed LiveKit calls';
COMMENT ON COLUMN call_invitations.room_name IS 'LiveKit room name for the call';
COMMENT ON COLUMN call_invitations.status IS 'pending=waiting for response, accepted=call started, rejected/missed/cancelled=call ended without connection';
COMMENT ON COLUMN calls.participants IS 'JSON array of user IDs who participated in the call';
COMMENT ON COLUMN calls.metadata IS 'Additional call metadata (quality stats, etc.)';
