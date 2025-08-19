-- Fix remaining tables without RLS policies

-- Fix customer_addresses table
CREATE POLICY "Users can manage their own addresses" ON public.customer_addresses
FOR ALL USING (customer_id = auth.uid());

-- Fix master_automation_sessions table
CREATE POLICY "Only service role can manage automation sessions" ON public.master_automation_sessions
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix order_drafts table  
CREATE POLICY "Users can manage their own order drafts" ON public.order_drafts
FOR ALL USING (customer_email = auth.email());

-- Fix product_modifications table
CREATE POLICY "Admin users can manage product modifications" ON public.product_modifications
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.email()
    )
);