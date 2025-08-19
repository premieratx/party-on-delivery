-- Security Fix 1: Fix order_drafts table policies (drop existing and recreate)
DROP POLICY IF EXISTS "System can manage order drafts" ON public.order_drafts;
DROP POLICY IF EXISTS "Admin users can view order drafts" ON public.order_drafts;

-- Create secure order_drafts policies
CREATE POLICY "Service role can manage order drafts"
  ON public.order_drafts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can view order drafts"
  ON public.order_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    )
  );

-- Security Fix 2: Remove password_hash column from admin_users if it exists
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS password_hash;

-- Security Fix 3: Update admin_users policies to be Google-only
DROP POLICY IF EXISTS "Only specific admin can access admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage their own data" ON public.admin_users;

CREATE POLICY "Admin users can manage their own data"
  ON public.admin_users
  FOR ALL
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Security Fix 4: Fix customer_orders policies to not expose sensitive data publicly
DROP POLICY IF EXISTS "Shared orders via token only" ON public.customer_orders;

CREATE POLICY "Shared orders via token only"
  ON public.customer_orders
  FOR SELECT
  USING (
    share_token IS NOT NULL AND 
    is_shareable = true AND 
    is_group_order = true
  );