-- Fix remaining security warnings for trigger functions without search_path

-- Fix search_path for ensure_single_default_cover_page function
CREATE OR REPLACE FUNCTION public.ensure_single_default_cover_page()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- If this cover page is being set as default, unset all others
  IF NEW.is_default_homepage = true THEN
    UPDATE public.cover_pages 
    SET is_default_homepage = false 
    WHERE id != NEW.id AND is_default_homepage = true;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix search_path for update_affiliate_stats function
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
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
$function$;

-- Fix search_path for ensure_single_default_flow function
CREATE OR REPLACE FUNCTION public.ensure_single_default_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.affiliate_flows 
    SET is_default = false 
    WHERE affiliate_id = NEW.affiliate_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$function$;