-- ============================================================================
-- Professional Matchmakers System
-- Creates tables, RLS policies, indexes, and helper functions for matchmaker feature
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. matchmakers - Core matchmaker accounts
CREATE TABLE IF NOT EXISTS matchmakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'suspended', 'inactive')) DEFAULT 'pending',
  bio TEXT,
  specialties TEXT[], -- e.g., ['age_25_35', 'professionals', 'lgbtq_friendly']
  years_experience INTEGER,
  certifications TEXT[], -- Professional credentials
  application_notes TEXT, -- Why they want to be a matchmaker
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matchmakers_user_id ON matchmakers(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmakers_status ON matchmakers(status);

-- 2. matchmaker_clients - Ongoing matchmaker-client relationships
CREATE TABLE IF NOT EXISTS matchmaker_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES matchmakers(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT, -- Matchmaker's private notes about client
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matchmaker_id, client_user_id)
);

CREATE INDEX IF NOT EXISTS idx_matchmaker_clients_matchmaker ON matchmaker_clients(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_clients_client ON matchmaker_clients(client_user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_clients_status ON matchmaker_clients(status);

-- 3. matchmaker_introductions - Tracks all introductions
CREATE TABLE IF NOT EXISTS matchmaker_introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES matchmakers(id) ON DELETE CASCADE,
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intro_message TEXT NOT NULL, -- Matchmaker's introduction text
  status TEXT NOT NULL CHECK (status IN ('pending', 'user_a_accepted', 'user_b_accepted', 'both_accepted', 'user_a_declined', 'user_b_declined', 'expired')) DEFAULT 'pending',
  conversation_id UUID REFERENCES conversations(id), -- Created when both accept
  user_a_response_at TIMESTAMPTZ,
  user_b_response_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  outcome TEXT CHECK (outcome IN (NULL, 'no_response', 'declined', 'chatted', 'dated', 'relationship')),
  outcome_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_intro CHECK (user_a_id != user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_intro_matchmaker ON matchmaker_introductions(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_intro_user_a ON matchmaker_introductions(user_a_id);
CREATE INDEX IF NOT EXISTS idx_intro_user_b ON matchmaker_introductions(user_b_id);
CREATE INDEX IF NOT EXISTS idx_intro_status ON matchmaker_introductions(status);
CREATE INDEX IF NOT EXISTS idx_intro_created_at ON matchmaker_introductions(created_at DESC);

-- 4. matchmaker_reviews - User reviews of matchmakers
CREATE TABLE IF NOT EXISTS matchmaker_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES matchmakers(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_verified_client BOOLEAN DEFAULT FALSE, -- Was this user actually a client?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matchmaker_id, reviewer_user_id) -- One review per user per matchmaker
);

CREATE INDEX IF NOT EXISTS idx_reviews_matchmaker ON matchmaker_reviews(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON matchmaker_reviews(rating);

-- 5. matchmaker_stats - Cached performance metrics (updated by triggers/cron)
CREATE TABLE IF NOT EXISTS matchmaker_stats (
  matchmaker_id UUID PRIMARY KEY REFERENCES matchmakers(id) ON DELETE CASCADE,
  total_introductions INTEGER DEFAULT 0,
  successful_introductions INTEGER DEFAULT 0, -- Led to chat or better
  active_clients INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2), -- e.g., 4.85
  total_reviews INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE matchmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaker_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaker_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaker_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaker_stats ENABLE ROW LEVEL SECURITY;

-- matchmakers: Public can read approved, owner can read own, admin can read all
DROP POLICY IF EXISTS "Anyone can view approved matchmakers" ON matchmakers;
CREATE POLICY "Anyone can view approved matchmakers" ON matchmakers
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Matchmakers can view own profile" ON matchmakers;
CREATE POLICY "Matchmakers can view own profile" ON matchmakers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Matchmakers can update own profile" ON matchmakers;
CREATE POLICY "Matchmakers can update own profile" ON matchmakers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert matchmaker applications" ON matchmakers;
CREATE POLICY "Users can insert matchmaker applications" ON matchmakers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage matchmakers" ON matchmakers;
CREATE POLICY "Admins can manage matchmakers" ON matchmakers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator')
  ));

-- matchmaker_clients: Only matchmaker and client can see relationship
DROP POLICY IF EXISTS "Matchmakers can view own clients" ON matchmaker_clients;
CREATE POLICY "Matchmakers can view own clients" ON matchmaker_clients
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM matchmakers WHERE matchmakers.id = matchmaker_clients.matchmaker_id AND matchmakers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Clients can view own matchmaker relationships" ON matchmaker_clients;
CREATE POLICY "Clients can view own matchmaker relationships" ON matchmaker_clients
  FOR SELECT USING (auth.uid() = client_user_id);

DROP POLICY IF EXISTS "Matchmakers can manage own clients" ON matchmaker_clients;
CREATE POLICY "Matchmakers can manage own clients" ON matchmaker_clients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM matchmakers WHERE matchmakers.id = matchmaker_clients.matchmaker_id AND matchmakers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can hire matchmakers" ON matchmaker_clients;
CREATE POLICY "Users can hire matchmakers" ON matchmaker_clients
  FOR INSERT WITH CHECK (auth.uid() = client_user_id);

-- matchmaker_introductions: Complex access rules
DROP POLICY IF EXISTS "Matchmakers can view own introductions" ON matchmaker_introductions;
CREATE POLICY "Matchmakers can view own introductions" ON matchmaker_introductions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM matchmakers WHERE matchmakers.id = matchmaker_introductions.matchmaker_id AND matchmakers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view introductions involving them" ON matchmaker_introductions;
CREATE POLICY "Users can view introductions involving them" ON matchmaker_introductions
  FOR SELECT USING (auth.uid() IN (user_a_id, user_b_id));

DROP POLICY IF EXISTS "Users can update intro status for themselves" ON matchmaker_introductions;
CREATE POLICY "Users can update intro status for themselves" ON matchmaker_introductions
  FOR UPDATE USING (auth.uid() IN (user_a_id, user_b_id));

DROP POLICY IF EXISTS "Matchmakers can create introductions" ON matchmaker_introductions;
CREATE POLICY "Matchmakers can create introductions" ON matchmaker_introductions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM matchmakers WHERE matchmakers.id = matchmaker_introductions.matchmaker_id AND matchmakers.user_id = auth.uid() AND matchmakers.status = 'approved'
  ));

DROP POLICY IF EXISTS "Matchmakers can update own introductions" ON matchmaker_introductions;
CREATE POLICY "Matchmakers can update own introductions" ON matchmaker_introductions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM matchmakers WHERE matchmakers.id = matchmaker_introductions.matchmaker_id AND matchmakers.user_id = auth.uid()
  ));

-- matchmaker_reviews: Public read, users can write
DROP POLICY IF EXISTS "Anyone can view matchmaker reviews" ON matchmaker_reviews;
CREATE POLICY "Anyone can view matchmaker reviews" ON matchmaker_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can write reviews" ON matchmaker_reviews;
CREATE POLICY "Users can write reviews" ON matchmaker_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON matchmaker_reviews;
CREATE POLICY "Users can update own reviews" ON matchmaker_reviews
  FOR UPDATE USING (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON matchmaker_reviews;
CREATE POLICY "Users can delete own reviews" ON matchmaker_reviews
  FOR DELETE USING (auth.uid() = reviewer_user_id);

-- matchmaker_stats: Public read
DROP POLICY IF EXISTS "Anyone can view matchmaker stats" ON matchmaker_stats;
CREATE POLICY "Anyone can view matchmaker stats" ON matchmaker_stats
  FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate matchmaker stats
CREATE OR REPLACE FUNCTION calculate_matchmaker_stats(p_matchmaker_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO matchmaker_stats (
    matchmaker_id, 
    total_introductions, 
    successful_introductions, 
    active_clients, 
    total_clients, 
    average_rating, 
    total_reviews, 
    last_calculated_at
  )
  SELECT 
    p_matchmaker_id,
    COUNT(DISTINCT mi.id) AS total_introductions,
    COUNT(DISTINCT mi.id) FILTER (WHERE mi.outcome IN ('chatted', 'dated', 'relationship')) AS successful_introductions,
    COUNT(DISTINCT mc.id) FILTER (WHERE mc.status = 'active') AS active_clients,
    COUNT(DISTINCT mc.id) AS total_clients,
    AVG(mr.rating) AS average_rating,
    COUNT(DISTINCT mr.id) AS total_reviews,
    NOW() AS last_calculated_at
  FROM matchmakers m
  LEFT JOIN matchmaker_introductions mi ON mi.matchmaker_id = m.id
  LEFT JOIN matchmaker_clients mc ON mc.matchmaker_id = m.id
  LEFT JOIN matchmaker_reviews mr ON mr.matchmaker_id = m.id
  WHERE m.id = p_matchmaker_id
  GROUP BY m.id
  ON CONFLICT (matchmaker_id) DO UPDATE SET
    total_introductions = EXCLUDED.total_introductions,
    successful_introductions = EXCLUDED.successful_introductions,
    active_clients = EXCLUDED.active_clients,
    total_clients = EXCLUDED.total_clients,
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update stats when intro outcome changes
CREATE OR REPLACE FUNCTION update_matchmaker_stats_on_intro_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_matchmaker_stats(NEW.matchmaker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stats_on_intro ON matchmaker_introductions;
CREATE TRIGGER trigger_update_stats_on_intro
AFTER INSERT OR UPDATE OF outcome ON matchmaker_introductions
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_stats_on_intro_change();

-- Trigger to update stats when client relationship changes
CREATE OR REPLACE FUNCTION update_matchmaker_stats_on_client_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_matchmaker_stats(OLD.matchmaker_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_matchmaker_stats(NEW.matchmaker_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stats_on_client ON matchmaker_clients;
CREATE TRIGGER trigger_update_stats_on_client
AFTER INSERT OR UPDATE OR DELETE ON matchmaker_clients
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_stats_on_client_change();

-- Trigger to update stats when review is added/updated
CREATE OR REPLACE FUNCTION update_matchmaker_stats_on_review_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_matchmaker_stats(OLD.matchmaker_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_matchmaker_stats(NEW.matchmaker_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stats_on_review ON matchmaker_reviews;
CREATE TRIGGER trigger_update_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON matchmaker_reviews
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_stats_on_review_change();

-- Trigger to set updated_at on matchmakers
CREATE OR REPLACE FUNCTION update_matchmaker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matchmaker_updated_at ON matchmakers;
CREATE TRIGGER trigger_matchmaker_updated_at
BEFORE UPDATE ON matchmakers
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_updated_at();

DROP TRIGGER IF EXISTS trigger_matchmaker_clients_updated_at ON matchmaker_clients;
CREATE TRIGGER trigger_matchmaker_clients_updated_at
BEFORE UPDATE ON matchmaker_clients
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_updated_at();

DROP TRIGGER IF EXISTS trigger_matchmaker_introductions_updated_at ON matchmaker_introductions;
CREATE TRIGGER trigger_matchmaker_introductions_updated_at
BEFORE UPDATE ON matchmaker_introductions
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_updated_at();

DROP TRIGGER IF EXISTS trigger_matchmaker_reviews_updated_at ON matchmaker_reviews;
CREATE TRIGGER trigger_matchmaker_reviews_updated_at
BEFORE UPDATE ON matchmaker_reviews
FOR EACH ROW
EXECUTE FUNCTION update_matchmaker_updated_at();
