-- Fix the incorrect affiliate referral amount for order 6124677005490
UPDATE affiliate_referrals 
SET 
  subtotal = 38.49, 
  commission_amount = ROUND((38.49 * 5.00 / 100)::numeric, 2)
WHERE order_id = '6124677005490';

-- Now update the affiliate stats to reflect the correct amounts
-- We need to recalculate all stats for this affiliate
UPDATE affiliates 
SET 
  total_sales = COALESCE((
    SELECT SUM(subtotal) 
    FROM affiliate_referrals 
    WHERE affiliate_id = '689f076f-0257-40fb-bba3-b2698798a1e2'
  ), 0),
  total_commission = COALESCE((
    SELECT SUM(commission_amount) 
    FROM affiliate_referrals 
    WHERE affiliate_id = '689f076f-0257-40fb-bba3-b2698798a1e2'
  ), 0),
  commission_unpaid = COALESCE((
    SELECT SUM(commission_amount) 
    FROM affiliate_referrals 
    WHERE affiliate_id = '689f076f-0257-40fb-bba3-b2698798a1e2' AND paid_out = false
  ), 0),
  largest_order = COALESCE((
    SELECT MAX(subtotal) 
    FROM affiliate_referrals 
    WHERE affiliate_id = '689f076f-0257-40fb-bba3-b2698798a1e2'
  ), 0),
  updated_at = now()
WHERE id = '689f076f-0257-40fb-bba3-b2698798a1e2';