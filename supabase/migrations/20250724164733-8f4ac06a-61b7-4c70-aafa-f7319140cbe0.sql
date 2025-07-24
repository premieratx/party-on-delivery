-- Make password_hash nullable for Google OAuth admin users
ALTER TABLE admin_users ALTER COLUMN password_hash DROP NOT NULL;

-- Add the admin user with Google OAuth email
INSERT INTO admin_users (email, name, password_hash) 
VALUES ('brian@premierpartycruises.com', 'Brian Hill', NULL);