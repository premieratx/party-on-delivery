-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update affiliate stats when new referral is added
  UPDATE public.affiliates 
  SET 
    total_sales = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    total_commission = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_unpaid = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id AND paid_out = false
    ), 0),
    orders_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    largest_order = COALESCE((
      SELECT MAX(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_rate = CASE 
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 20000 THEN 10.00
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 10000 THEN 7.50
      ELSE 5.00
    END,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from company name (first 6 chars, uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  -- If base_code is empty or too short, use random string
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  -- Check if code exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$$;