-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Re-hash the password properly using crypt
UPDATE admin_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'brian@partyondelivery.com';

-- Test that password verification works
SELECT email, verify_admin_password('brian@partyondelivery.com', 'admin123') as password_valid
FROM admin_users 
WHERE email = 'brian@partyondelivery.com';