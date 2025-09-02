-- Reset admin password for brian@partyondelivery.com
UPDATE admin_users 
SET password_hash = hash_password('admin123')
WHERE email = 'brian@partyondelivery.com';

-- If user doesn't exist, create it
INSERT INTO admin_users (email, name, password_hash)
VALUES ('brian@partyondelivery.com', 'Brian', hash_password('admin123'))
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = hash_password('admin123'),
  name = 'Brian';