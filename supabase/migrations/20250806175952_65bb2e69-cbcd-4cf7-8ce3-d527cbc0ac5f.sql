-- Fix remaining security issues: Enable RLS on missing tables and fix function search paths

-- Enable RLS on remaining tables
ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.shopify_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access tables
CREATE POLICY "Shopify products are publicly viewable" 
ON public.shopify_products 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage shopify products" 
ON public.shopify_products 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can manage shopify products" 
ON public.shopify_products 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Product collections are publicly viewable" 
ON public.product_collections 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage product collections" 
ON public.product_collections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can manage product collections" 
ON public.product_collections 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Shopify collections are publicly viewable" 
ON public.shopify_collections 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage shopify collections" 
ON public.shopify_collections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can manage shopify collections" 
ON public.shopify_collections 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix remaining database functions with missing search_path
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_email text, details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_email,
    details,
    created_at
  ) VALUES (
    event_type,
    user_email,
    details,
    now()
  );
END;
$function$;