-- Create vouchers table for gift card/prepaid credit system
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_code TEXT NOT NULL UNIQUE,
  voucher_name TEXT NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('percentage', 'fixed_amount', 'prepaid_credit')),
  discount_value NUMERIC, -- percentage (0-100) or fixed dollar amount
  prepaid_amount NUMERIC, -- for prepaid credit vouchers
  minimum_spend NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  affiliate_id UUID REFERENCES public.affiliates(id),
  commission_rate NUMERIC DEFAULT 0, -- commission percentage for affiliate
  created_by_admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voucher_usage table to track individual uses
CREATE TABLE public.voucher_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id),
  customer_email TEXT,
  order_id TEXT,
  amount_used NUMERIC NOT NULL,
  remaining_balance NUMERIC DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for vouchers
CREATE POLICY "Admin users can manage all vouchers" 
ON public.vouchers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE admin_users.email = auth.email()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Affiliates can view their linked vouchers" 
ON public.vouchers 
FOR SELECT 
USING (affiliate_id IN (
  SELECT id FROM public.affiliates 
  WHERE email = auth.email()
));

CREATE POLICY "Vouchers are publicly readable when active" 
ON public.vouchers 
FOR SELECT 
USING (is_active = true);

-- Create policies for voucher_usage
CREATE POLICY "Admin users can view all voucher usage" 
ON public.voucher_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can insert voucher usage" 
ON public.voucher_usage 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own voucher usage" 
ON public.voucher_usage 
FOR SELECT 
USING (customer_email = auth.email());

-- Create trigger for updated_at
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();