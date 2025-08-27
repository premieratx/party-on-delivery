-- Set up dummy password for admin user brian@partyondelivery.com
UPDATE admin_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'brian@partyondelivery.com';

-- Verify the update worked
SELECT email, name, (password_hash IS NOT NULL) as has_password 
FROM admin_users 
WHERE email = 'brian@partyondelivery.com';