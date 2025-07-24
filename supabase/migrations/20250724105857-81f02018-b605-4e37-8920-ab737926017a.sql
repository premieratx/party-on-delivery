-- Add admin access policies for affiliate data

-- Allow admin users to view all affiliates
CREATE POLICY "Admin users can view all affiliates" 
ON public.affiliates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- Allow admin users to view all affiliate referrals
CREATE POLICY "Admin users can view all referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- Allow admin users to view all abandoned orders
CREATE POLICY "Admin users can view all abandoned orders" 
ON public.abandoned_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.email = auth.email()
  )
);