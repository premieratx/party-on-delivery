-- Affiliate System Database Schema
-- Create affiliate profiles table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT NOT NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  total_sales DECIMAL(12,2) DEFAULT 0.00,
  total_commission DECIMAL(12,2) DEFAULT 0.00,
  commission_unpaid DECIMAL(12,2) DEFAULT 0.00,
  orders_count INTEGER DEFAULT 0,
  largest_order DECIMAL(12,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate referrals table to track individual orders
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id TEXT, -- Shopify order ID
  customer_email TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_out BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create commission payouts table
CREATE TABLE public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  referral_ids UUID[] NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Affiliates can view their own profile"
  ON public.affiliates FOR SELECT
  USING (email = auth.email());

CREATE POLICY "Affiliates can update their own profile"
  ON public.affiliates FOR UPDATE
  USING (email = auth.email());

CREATE POLICY "Anyone can insert affiliate profiles"
  ON public.affiliates FOR INSERT
  WITH CHECK (true);

-- RLS Policies for affiliate_referrals
CREATE POLICY "Affiliates can view their own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

CREATE POLICY "System can insert referrals"
  ON public.affiliate_referrals FOR INSERT
  WITH CHECK (true);

-- RLS Policies for commission_payouts
CREATE POLICY "Affiliates can view their own payouts"
  ON public.commission_payouts FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

-- RLS Policies for admin_users (admin only access)
CREATE POLICY "Admin users can manage admin table"
  ON public.admin_users FOR ALL
  USING (email = 'brian@partyondelivery.com');

-- Create function to update affiliate stats
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update affiliate stats when new referral is added
  UPDATE public.affiliates 
  SET 
    total_sales = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    total_commission = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_unpaid = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id AND paid_out = false
    ), 0),
    orders_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    largest_order = COALESCE((
      SELECT MAX(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_rate = CASE 
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 20000 THEN 10.00
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 10000 THEN 7.50
      ELSE 5.00
    END,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating affiliate stats
CREATE TRIGGER update_affiliate_stats_trigger
  AFTER INSERT ON public.affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_stats();

-- Create updated_at triggers
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert admin user (brian@partyondelivery.com)
INSERT INTO public.admin_users (email, password_hash, name)
VALUES ('brian@partyondelivery.com', crypt('asdfgh1!', gen_salt('bf')), 'Brian')
ON CONFLICT (email) DO NOTHING;

-- Create function to generate unique affiliate codes
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from company name (first 6 chars, uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  -- If base_code is empty or too short, use random string
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  -- Check if code exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;