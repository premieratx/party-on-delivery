-- Clear admin notifications first, then clear all affiliate data
DELETE FROM admin_notifications WHERE affiliate_id IS NOT NULL;
DELETE FROM custom_affiliate_sites;
DELETE FROM affiliate_referrals;
DELETE FROM commission_payouts;
DELETE FROM affiliates;