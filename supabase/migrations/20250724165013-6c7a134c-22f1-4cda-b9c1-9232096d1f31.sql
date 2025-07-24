-- Remove the affiliate email from admin_users since it should only be for affiliate login
DELETE FROM admin_users WHERE email = 'brian@premierpartycruises.com';