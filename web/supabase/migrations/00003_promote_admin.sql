-- Promote admin@realsingles.com to admin role
-- Run this manually in Supabase SQL Editor

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@realsingles.com';

-- Verify
SELECT id, email, role FROM users WHERE email = 'admin@realsingles.com';
