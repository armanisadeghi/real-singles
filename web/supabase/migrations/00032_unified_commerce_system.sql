-- =====================================================
-- Unified Commerce System Migration
-- =====================================================
-- Adds support for:
-- - Dual pricing (points AND/OR dollars) on products
-- - Purchasable items (superlikes, boosts, etc.)
-- - Subscription plans with Stripe integration
-- - Payments tracking
-- - User subscriptions
-- - Gift-to-friend functionality
-- =====================================================

-- =====================================================
-- 1. MODIFY PRODUCTS TABLE
-- =====================================================

-- Add dollar pricing and public visibility to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS dollar_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN products.dollar_price IS 'Price in USD (can be used alongside or instead of points_cost)';
COMMENT ON COLUMN products.is_public IS 'If true, product is visible on public store page (no auth required)';
COMMENT ON COLUMN products.requires_shipping IS 'If true, shipping address is required for order';

-- =====================================================
-- 2. CREATE PURCHASABLE_ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS purchasable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN (
    'superlike_pack', 'boost', 'points_pack', 
    'matchmaker_session', 'read_receipts', 'see_likes',
    'unlimited_likes', 'rewind', 'spotlight'
  )),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  duration_hours INTEGER,
  points_cost INTEGER,
  dollar_price DECIMAL(10,2),
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE purchasable_items IS 'Digital items like superlikes, boosts, read receipts that can be purchased';
COMMENT ON COLUMN purchasable_items.item_type IS 'Type of purchasable item';
COMMENT ON COLUMN purchasable_items.quantity IS 'Number of items in pack (e.g., 5 superlikes)';
COMMENT ON COLUMN purchasable_items.duration_hours IS 'Duration in hours for time-limited items (e.g., boost)';
COMMENT ON COLUMN purchasable_items.stripe_price_id IS 'Stripe Price ID for dollar purchases';

-- RLS for purchasable_items
ALTER TABLE purchasable_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items
CREATE POLICY "Anyone can read active purchasable items" ON purchasable_items
  FOR SELECT USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage purchasable items" ON purchasable_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- =====================================================
-- 3. CREATE SUBSCRIPTION_PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  dollar_price_monthly DECIMAL(10,2) NOT NULL,
  dollar_price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '{}',
  tier_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Subscription tiers (Free, Basic, Premium, VIP)';
COMMENT ON COLUMN subscription_plans.features IS 'JSON object with tier features: { "superlikes_per_day": 5, "boosts_per_month": 2, "see_likes": true, ... }';
COMMENT ON COLUMN subscription_plans.tier_level IS 'Numeric level for comparison (0=free, 1=basic, 2=premium, 3=vip)';

-- RLS for subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can read active plans
CREATE POLICY "Anyone can read active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- =====================================================
-- 4. MODIFY USERS TABLE
-- =====================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superlike_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS daily_superlikes_remaining INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_superlikes_reset_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID for payment processing';
COMMENT ON COLUMN users.subscription_tier IS 'Current subscription tier name (free, basic, premium, vip)';
COMMENT ON COLUMN users.subscription_plan_id IS 'Reference to current subscription plan';
COMMENT ON COLUMN users.subscription_expires_at IS 'When current subscription period ends';
COMMENT ON COLUMN users.superlike_balance IS 'Number of superlikes available (from purchases)';
COMMENT ON COLUMN users.boost_expires_at IS 'When current boost expires';
COMMENT ON COLUMN users.daily_superlikes_remaining IS 'Daily superlikes remaining from subscription';
COMMENT ON COLUMN users.daily_superlikes_reset_at IS 'When daily superlikes reset';

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- =====================================================
-- 5. CREATE PAYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_type TEXT CHECK (payment_type IN ('one_time', 'subscription', 'invoice')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE payments IS 'Tracks all payment transactions from Stripe';
COMMENT ON COLUMN payments.metadata IS 'JSON with item details: { "items": [...], "order_id": "...", "subscription_id": "..." }';
COMMENT ON COLUMN payments.error_message IS 'Error details if payment failed';

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert/update (via service role)
CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (auth.uid() IS NULL);

-- Admins can read all payments
CREATE POLICY "Admins can read all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session ON payments(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- 6. CREATE USER_SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid', 'paused')),
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription history and current status';
COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'If true, subscription will cancel at period end instead of renewing';

-- RLS for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role manages subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() IS NULL);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- =====================================================
-- 7. MODIFY ORDERS TABLE
-- =====================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('points', 'stripe', 'both')),
  ADD COLUMN IF NOT EXISTS dollar_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_message TEXT,
  ADD COLUMN IF NOT EXISTS gift_sender_name TEXT,
  ADD COLUMN IF NOT EXISTS purchasable_item_id UUID REFERENCES purchasable_items(id);

-- Add comments
COMMENT ON COLUMN orders.payment_id IS 'Reference to Stripe payment record';
COMMENT ON COLUMN orders.payment_method IS 'How the order was paid: points, stripe, or both';
COMMENT ON COLUMN orders.dollar_amount IS 'Amount paid in dollars (if applicable)';
COMMENT ON COLUMN orders.recipient_user_id IS 'User receiving the gift (if is_gift = true)';
COMMENT ON COLUMN orders.is_gift IS 'Whether this order is a gift to another user';
COMMENT ON COLUMN orders.gift_message IS 'Personal message to include with gift';
COMMENT ON COLUMN orders.purchasable_item_id IS 'Reference to purchasable item (for digital goods)';

-- Update default payment_method for existing orders
UPDATE orders SET payment_method = 'points' WHERE payment_method IS NULL;

-- =====================================================
-- 8. CREATE USER_ITEM_INVENTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_item_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('purchase', 'subscription', 'reward', 'admin_grant', 'referral')),
  source_reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_type)
);

-- Add comments
COMMENT ON TABLE user_item_inventory IS 'Tracks user inventory of purchasable items (superlikes, boosts, etc.)';
COMMENT ON COLUMN user_item_inventory.source IS 'How the user got these items';
COMMENT ON COLUMN user_item_inventory.source_reference_id IS 'Reference to order/subscription/etc that granted these items';

-- RLS for user_item_inventory
ALTER TABLE user_item_inventory ENABLE ROW LEVEL SECURITY;

-- Users can read their own inventory
CREATE POLICY "Users can read own inventory" ON user_item_inventory
  FOR SELECT USING (auth.uid() = user_id);

-- Service role manages inventory
CREATE POLICY "Service role can manage inventory" ON user_item_inventory
  FOR ALL USING (auth.uid() IS NULL);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_item_inventory_user ON user_item_inventory(user_id);

-- =====================================================
-- 9. CREATE STRIPE_WEBHOOK_EVENTS TABLE (for idempotency)
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB,
  error TEXT
);

-- Add comments
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';

-- RLS - only service role
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL USING (auth.uid() IS NULL);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(stripe_event_id);

-- =====================================================
-- 10. ADD TRANSACTION TYPE FOR PURCHASES
-- =====================================================

-- Update point_transactions transaction_type check to include more types
ALTER TABLE point_transactions 
  DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check;

ALTER TABLE point_transactions 
  ADD CONSTRAINT point_transactions_transaction_type_check 
  CHECK (transaction_type IN (
    'referral', 'review', 'event_attendance', 'redemption', 
    'admin_adjustment', 'purchase', 'subscription_bonus', 
    'daily_login', 'profile_completion', 'first_match'
  ));

-- =====================================================
-- 11. SEED DEFAULT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (name, description, dollar_price_monthly, dollar_price_yearly, tier_level, features, display_order)
VALUES
  ('Free', 'Basic access to RealSingles', 0, NULL, 0, 
   '{"likes_per_day": 10, "superlikes_per_day": 1, "can_see_likes": false, "can_rewind": false, "boosts_per_month": 0, "read_receipts": false, "priority_likes": false}'::jsonb, 
   0),
  ('Premium', 'Enhanced dating experience', 19.99, 119.99, 1, 
   '{"likes_per_day": -1, "superlikes_per_day": 5, "can_see_likes": true, "can_rewind": true, "boosts_per_month": 1, "read_receipts": true, "priority_likes": false}'::jsonb, 
   1),
  ('VIP', 'The ultimate RealSingles experience', 39.99, 239.99, 2, 
   '{"likes_per_day": -1, "superlikes_per_day": -1, "can_see_likes": true, "can_rewind": true, "boosts_per_month": 5, "read_receipts": true, "priority_likes": true, "matchmaker_access": true}'::jsonb, 
   2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. SEED DEFAULT PURCHASABLE ITEMS
-- =====================================================

INSERT INTO purchasable_items (item_type, name, description, quantity, dollar_price, points_cost, display_order)
VALUES
  ('superlike_pack', '5 Super Likes', 'Stand out from the crowd with 5 Super Likes', 5, 4.99, 500, 1),
  ('superlike_pack', '15 Super Likes', 'Best value! Get 15 Super Likes', 15, 9.99, 1200, 2),
  ('superlike_pack', '30 Super Likes', 'Super Likes bundle for serious daters', 30, 14.99, 2000, 3),
  ('boost', '30-Minute Boost', 'Get seen by more people for 30 minutes', 1, 3.99, 400, 4),
  ('boost', '3-Hour Boost', 'Extended visibility boost for 3 hours', 1, 7.99, 800, 5),
  ('points_pack', '500 Points', 'Purchase 500 reward points', 500, 4.99, NULL, 6),
  ('points_pack', '1500 Points', 'Best value! Get 1500 reward points', 1500, 9.99, NULL, 7),
  ('see_likes', 'See Who Likes You', 'One-time unlock to see all your likes', 1, 9.99, 1000, 8)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. UPDATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at on purchasable_items
CREATE OR REPLACE FUNCTION update_purchasable_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS purchasable_items_updated_at ON purchasable_items;
CREATE TRIGGER purchasable_items_updated_at
  BEFORE UPDATE ON purchasable_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchasable_items_updated_at();

-- Trigger to update updated_at on subscription_plans
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Trigger to update updated_at on payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Trigger to update updated_at on user_subscriptions
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Trigger to update updated_at on user_item_inventory
CREATE OR REPLACE FUNCTION update_user_item_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_item_inventory_updated_at ON user_item_inventory;
CREATE TRIGGER user_item_inventory_updated_at
  BEFORE UPDATE ON user_item_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_user_item_inventory_updated_at();
