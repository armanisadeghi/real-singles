-- =====================================================
-- Migration: Add payment support to event_attendees
-- =====================================================
-- Adds payment_id to track Stripe payments for paid events
-- Adds 'pending_payment' status for event attendees

-- Add payment_id column
ALTER TABLE event_attendees
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- Add stripe_checkout_session_id for tracking during checkout
ALTER TABLE event_attendees
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Update check constraint to allow 'pending_payment' status
ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_status_check;
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_status_check
  CHECK (status IN ('interested', 'registered', 'attended', 'cancelled', 'pending_payment'));

-- Ensure events.price column exists (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'price'
  ) THEN
    ALTER TABLE events ADD COLUMN price DECIMAL(10, 2) DEFAULT NULL;
  END IF;
END $$;

COMMENT ON COLUMN event_attendees.payment_id IS 'References payment record for paid events';
COMMENT ON COLUMN event_attendees.stripe_checkout_session_id IS 'Stripe checkout session ID during payment flow';
