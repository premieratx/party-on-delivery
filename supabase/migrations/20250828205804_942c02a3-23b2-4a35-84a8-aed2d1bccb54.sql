-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set the password for brian@partyondelivery.com
UPDATE admin_users 
SET password_hash = crypt('admin123', gen_salt('bf', 12))
WHERE email = 'brian@partyondelivery.com';