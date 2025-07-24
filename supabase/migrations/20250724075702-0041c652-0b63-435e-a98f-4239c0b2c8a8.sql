-- Create admin_notifications table for tracking alerts and notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'duplicate_name', 'payout_alert', 'new_affiliate', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affiliate_id UUID REFERENCES public.affiliates(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users only
CREATE POLICY "Admin users can manage notifications" 
ON public.admin_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);