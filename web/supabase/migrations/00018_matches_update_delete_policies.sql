-- ============================================
-- ADD UPDATE AND DELETE RLS POLICIES FOR MATCHES
-- ============================================
-- 
-- This migration adds missing RLS policies for the matches table.
-- The existing policies only covered SELECT and INSERT.
-- UPDATE is needed for UPSERT operations (changing like to pass, etc.)
-- DELETE is needed for unmatch functionality.
--
-- Migration is idempotent - safe to run multiple times.

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON matches;

-- Allow users to update their own match actions
-- This is required for UPSERT to work when changing an action (e.g., pass -> like)
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own match records
-- This is required for unmatch functionality
CREATE POLICY "Users can delete own matches" ON matches
  FOR DELETE USING (auth.uid() = user_id);
