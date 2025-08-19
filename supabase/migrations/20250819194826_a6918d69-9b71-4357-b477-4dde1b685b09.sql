-- Create table for tracking failed order processing
CREATE TABLE IF NOT EXISTS public.failed_order_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payment_amount INTEGER NOT NULL, -- Amount in cents
  customer_email TEXT,
  retry_count INTEGER DEFAULT 0,
  requires_manual_review BOOLEAN DEFAULT true,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_failed_order_processing_created_at 
ON public.failed_order_processing (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_order_processing_requires_review 
ON public.failed_order_processing (requires_manual_review, created_at DESC);

-- Enable RLS
ALTER TABLE public.failed_order_processing ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage failed orders
CREATE POLICY "Admins can manage failed order processing" 
ON public.failed_order_processing 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Allow system to insert failed order records
CREATE POLICY "System can insert failed order records" 
ON public.failed_order_processing 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_failed_order_processing_updated_at
  BEFORE UPDATE ON public.failed_order_processing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();