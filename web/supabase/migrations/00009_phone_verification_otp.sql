-- Migration: Add phone verification OTP table
-- Stores OTP codes for phone verification with expiry

-- Create phone_verification_otps table
CREATE TABLE IF NOT EXISTS phone_verification_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- Create index for looking up OTPs
CREATE INDEX IF NOT EXISTS idx_phone_verification_otps_user_phone 
  ON phone_verification_otps(user_id, phone);

-- Create index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_phone_verification_otps_expires 
  ON phone_verification_otps(expires_at);

-- Enable RLS
ALTER TABLE phone_verification_otps ENABLE ROW LEVEL SECURITY;

-- Users can only see their own OTP records
CREATE POLICY "Users can view own OTP records"
  ON phone_verification_otps FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own OTP records
CREATE POLICY "Users can insert own OTP records"
  ON phone_verification_otps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own OTP records
CREATE POLICY "Users can update own OTP records"
  ON phone_verification_otps FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own OTP records
CREATE POLICY "Users can delete own OTP records"
  ON phone_verification_otps FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE phone_verification_otps IS 'Stores OTP codes for phone verification with automatic expiry';
