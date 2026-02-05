-- Migration: Fix name handling in handle_new_user trigger
-- 
-- The trigger only creates the users record.
-- The profiles record with first_name/last_name is created by the
-- registration API route (POST /api/auth/register) using the admin client.
-- This avoids transaction timing issues with inserting into profiles
-- inside the auth trigger.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    upper(substring(md5(random()::text) from 1 for 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
