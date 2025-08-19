-- FINAL CRITICAL SECURITY PATCH - Fix remaining exposed data

-- Fix abandoned_orders table - Customer data exposure
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can view all abandoned orders" ON public.abandoned_orders;
DROP POLICY IF EXISTS "System can manage abandoned orders" ON public.abandoned_orders;
DROP POLICY IF EXISTS "System can update abandoned orders" ON public.abandoned_orders;

CREATE POLICY "Admin users can view abandoned orders"
ON public.abandoned_orders FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email()));

CREATE POLICY "Service role can manage abandoned orders"
ON public.abandoned_orders FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix affiliate_order_tracking table - Business data exposure  
ALTER TABLE public.affiliate_order_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can manage affiliate tracking" ON public.affiliate_order_tracking;

CREATE POLICY "Affiliates can view own tracking only"
ON public.affiliate_order_tracking FOR SELECT
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

CREATE POLICY "Admin users can view all tracking"
ON public.affiliate_order_tracking FOR SELECT  
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email()));

CREATE POLICY "Service role can manage tracking"
ON public.affiliate_order_tracking FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix affiliate_referrals table - Financial data exposure
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert referrals" ON public.affiliate_referrals;

CREATE POLICY "Service role can manage referrals"
ON public.affiliate_referrals FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix quotes table if exists - Business intelligence exposure
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
    EXECUTE 'ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Quotes are publicly readable" ON public.quotes';
    EXECUTE 'DROP POLICY IF EXISTS "System can manage quotes" ON public.quotes';
    
    EXECUTE 'CREATE POLICY "Admin users can view quotes"
    ON public.quotes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email()))';
    
    EXECUTE 'CREATE POLICY "Service role can manage quotes"  
    ON public.quotes FOR ALL
    USING ((auth.jwt() ->> ''role''::text) = ''service_role''::text)
    WITH CHECK ((auth.jwt() ->> ''role''::text) = ''service_role''::text)';
  END IF;
END $$;