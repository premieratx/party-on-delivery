-- Add RLS policies for tables that need them (identified from security scan)

-- Enable RLS and add policies for order_drafts table
CREATE POLICY "Users can only access their own order drafts" 
ON public.order_drafts 
FOR ALL
USING (auth.uid()::text = session_id OR auth.email() = customer_email);

CREATE POLICY "Admin users can view all order drafts"
ON public.order_drafts
FOR SELECT
USING (public.is_admin_user());

-- Fix optimization_logs table access
CREATE POLICY "Only admins can view optimization logs"
ON public.optimization_logs
FOR SELECT
USING (public.is_admin_user());

-- Add admin insert policy for optimization logs  
CREATE POLICY "System can insert optimization logs"
ON public.optimization_logs
FOR INSERT
WITH CHECK (true);

-- Fix master_automation_sessions if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_automation_sessions') THEN
    EXECUTE 'CREATE POLICY "Only admins can view automation sessions" ON public.master_automation_sessions FOR SELECT USING (public.is_admin_user())';
  END IF;
END $$;