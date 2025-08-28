-- Update admin email back to brian@partyondelivery.com
UPDATE admin_users SET email = 'brian@partyondelivery.com' WHERE email = 'brian@premierpartycruises.com';

-- Ensure the admin user exists with correct email
INSERT INTO admin_users (email, name, password_hash) 
VALUES ('brian@partyondelivery.com', 'Brian', 'admin123')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash;