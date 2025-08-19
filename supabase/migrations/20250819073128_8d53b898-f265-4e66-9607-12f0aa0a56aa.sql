-- SIMPLE SECURITY FIX - Just remove the most dangerous public policies

-- Remove any remaining public access that exposes sensitive data
DROP POLICY IF EXISTS "Affiliates can view their own abandoned orders" ON public.abandoned_orders;
DROP POLICY IF EXISTS "System can manage affiliate tracking" ON public.affiliate_order_tracking; 
DROP POLICY IF EXISTS "System can insert referrals" ON public.affiliate_referrals;

-- Remove public policies that expose quotes/business data
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Quotes are publicly readable" ON public.quotes';
    EXECUTE 'DROP POLICY IF EXISTS "System can manage quotes" ON public.quotes';
    EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on quotes" ON public.quotes';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage quotes" ON public.quotes';
  END IF;
END $$;

-- Remove public policies from other sensitive tables
DROP POLICY IF EXISTS "Service role can manage master automation sessions" ON public.master_automation_sessions;

-- Ensure service role can still perform necessary operations
DO $$
BEGIN
  -- Only create if doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quotes' AND policyname = 'Service role only for quotes'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
      EXECUTE 'CREATE POLICY "Service role only for quotes"
      ON public.quotes FOR ALL
      USING ((auth.jwt() ->> ''role''::text) = ''service_role''::text)
      WITH CHECK ((auth.jwt() ->> ''role''::text) = ''service_role''::text)';
    END IF;
  END IF;
END $$;