-- Set the admin password to 'admin123' for brian@partyondelivery.com
UPDATE admin_users 
SET password_hash = hash_password('admin123')
WHERE email = 'brian@partyondelivery.com';