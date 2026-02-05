-- Migration: Fix name handling in handle_new_user trigger
-- 
-- Updates the trigger to:
-- 1. Default display_name to email prefix (no longer passed from registration)
-- 2. Also create a profiles record with first_name/last_name from auth metadata

-- Drop and recreate the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the users record (display_name defaults to email prefix)
  INSERT INTO public.users (id, email, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    upper(substring(md5(random()::text) from 1 for 8))
  );

  -- Create the profiles record with first/last name if provided via auth metadata
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
