-- RealSingles Row Level Security Policies
-- Migration: 00002_rls_policies
-- Description: Enable RLS and create security policies

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_speed_dating ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_dating_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read all active profiles (for discovery)
CREATE POLICY "Users can read active profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = profiles.user_id 
      AND users.status = 'active'
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.user_id)
      OR (blocks.blocker_id = profiles.user_id AND blocks.blocked_id = auth.uid())
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- USER GALLERY POLICIES
-- ============================================

-- Users can read gallery of active users
CREATE POLICY "Users can read galleries" ON user_gallery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_gallery.user_id 
      AND users.status = 'active'
    )
  );

-- Users can manage their own gallery
CREATE POLICY "Users can insert own gallery" ON user_gallery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery" ON user_gallery
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gallery" ON user_gallery
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- USER FILTERS POLICIES
-- ============================================

-- Users can only access their own filters
CREATE POLICY "Users can read own filters" ON user_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filters" ON user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filters" ON user_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filters" ON user_filters
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Users can read their own matches
CREATE POLICY "Users can read own matches" ON matches
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- Users can create matches
CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FAVORITES POLICIES
-- ============================================

CREATE POLICY "Users can read own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWS POLICIES
-- ============================================

CREATE POLICY "Users can read follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- BLOCKS POLICIES
-- ============================================

CREATE POLICY "Users can read own blocks" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================
-- REPORTS POLICIES
-- ============================================

CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can read conversations they're part of
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation owners can update
CREATE POLICY "Owners can update conversations" ON conversations
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================
-- CONVERSATION PARTICIPANTS POLICIES
-- ============================================

CREATE POLICY "Users can read conversation participants" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Public events are visible to all
CREATE POLICY "Users can read public events" ON events
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Users can create events
CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Event creators can update
CREATE POLICY "Creators can update events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Event creators can delete
CREATE POLICY "Creators can delete events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================
-- EVENT ATTENDEES POLICIES
-- ============================================

CREATE POLICY "Users can read event attendees" ON event_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_attendees.event_id AND events.is_public = true
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can register for events" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel registration" ON event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VIRTUAL SPEED DATING POLICIES
-- ============================================

CREATE POLICY "Users can read speed dating sessions" ON virtual_speed_dating
  FOR SELECT USING (true);

-- ============================================
-- SPEED DATING REGISTRATIONS POLICIES
-- ============================================

CREATE POLICY "Users can read own registrations" ON speed_dating_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register" ON speed_dating_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel" ON speed_dating_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POINT TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY "Users can read own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Anyone can read active products
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (is_active = true);

-- ============================================
-- ORDERS POLICIES
-- ============================================

CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Users can read approved reviews
CREATE POLICY "Users can read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================
-- REFERRALS POLICIES
-- ============================================

CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- CONTACT SUBMISSIONS POLICIES
-- ============================================

CREATE POLICY "Users can read own submissions" ON contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);  -- Allow anyone to submit
