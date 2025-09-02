-- Fix RLS policies for vouchers and delivery_settings tables to allow admin access
-- and add the PREMIER2025 promo code

-- Update vouchers table RLS policies to allow admin access
DROP POLICY IF EXISTS "vouchers_service_access" ON public.vouchers;
CREATE POLICY "vouchers_admin_full_access" ON public.vouchers
  FOR ALL USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

-- Update delivery_settings table RLS policies to allow admin access  
DROP POLICY IF EXISTS "delivery_settings_service_access" ON public.delivery_settings;
CREATE POLICY "delivery_settings_admin_full_access" ON public.delivery_settings
  FOR ALL USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

-- Insert the PREMIER2025 promo code
INSERT INTO public.vouchers (
  voucher_code,
  voucher_name,
  voucher_type,
  discount_value,
  minimum_spend,
  max_uses,
  current_uses,
  is_active,
  commission_rate,
  expires_at
) VALUES (
  'PREMIER2025',
  'Premier Free Delivery',
  'fixed_amount',
  9999, -- Our convention for 100% delivery fee discount
  0,    -- No minimum spend
  1000, -- Max uses
  0,    -- Current uses
  true, -- Active
  0,    -- No commission
  NULL  -- No expiry
) ON CONFLICT (voucher_code) DO NOTHING;