-- Fix delivery fee rules according to requirements
UPDATE delivery_settings 
SET setting_value = jsonb_build_object(
  'base_fee', 20,
  'percentage_rate', 0.1,
  'percentage_threshold', 200,
  'free_shipping_threshold', null,
  'minimum_order', null,
  'rush_delivery_fee', null
)
WHERE setting_key = 'delivery_fees' AND is_active = true;

-- Fix PREMIER2025 promo code to have no expiration
UPDATE vouchers 
SET expires_at = null
WHERE voucher_code = 'PREMIER2025' AND is_active = true;