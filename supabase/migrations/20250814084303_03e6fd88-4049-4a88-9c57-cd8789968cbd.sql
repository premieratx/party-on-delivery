-- Create automation_logs table for tracking automated order confirmations
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    automation_type TEXT NOT NULL DEFAULT 'order_confirmation',
    sms_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    sms_error TEXT,
    email_error TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view all automation logs" 
ON public.automation_logs 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
);

CREATE POLICY "System can insert automation logs" 
ON public.automation_logs 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_order_id ON public.automation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_type ON public.automation_logs(automation_type);

-- Add trigger for updated_at
CREATE TRIGGER update_automation_logs_updated_at
BEFORE UPDATE ON public.automation_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();