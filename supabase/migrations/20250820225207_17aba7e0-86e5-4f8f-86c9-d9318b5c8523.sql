-- Restore the PREMIER2025 free shipping voucher that was used before
INSERT INTO vouchers (
  voucher_code,
  voucher_name,
  voucher_type,
  discount_value,
  minimum_spend,
  max_uses,
  current_uses,
  is_active,
  expires_at,
  commission_rate
) VALUES (
  'PREMIER2025',
  'Premier 2025 Free Shipping',
  'free_shipping',
  0,
  0,
  1000,
  0,
  true,
  '2025-12-31 23:59:59',
  0
) ON CONFLICT (voucher_code) DO UPDATE SET
  is_active = true,
  expires_at = '2025-12-31 23:59:59';

-- Also add other common promo codes that were likely in use
INSERT INTO vouchers (
  voucher_code,
  voucher_name,
  voucher_type,
  discount_value,
  minimum_spend,
  max_uses,
  current_uses,
  is_active,
  expires_at,
  commission_rate
) VALUES 
(
  'FREESHIP',
  'Free Shipping',
  'free_shipping',
  0,
  100,
  1000,
  0,
  true,
  '2025-12-31 23:59:59',
  0
),
(
  'WELCOME20',
  '20% Off Welcome',
  'percentage',
  20,
  50,
  1000,
  0,
  true,
  '2025-12-31 23:59:59',
  5
) ON CONFLICT (voucher_code) DO UPDATE SET
  is_active = true,
  expires_at = '2025-12-31 23:59:59';