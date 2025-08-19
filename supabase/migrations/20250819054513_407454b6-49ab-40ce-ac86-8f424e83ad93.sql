-- Security Fix 1: Create order_drafts table that only stores non-sensitive data for abandoned carts
CREATE TABLE IF NOT EXISTS public.order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  delivery_date DATE,
  delivery_time TEXT,
  delivery_address_city TEXT,  -- Only city for general location, no full address
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  
  -- Explicitly exclude any payment info - only cart recovery data
  CONSTRAINT no_payment_data CHECK (
    cart_items IS NOT NULL AND 
    NOT (cart_items::text ILIKE '%card%' OR 
         cart_items::text ILIKE '%payment%' OR 
         cart_items::text ILIKE '%stripe%')
  )
);

-- Enable RLS and create policies for order_drafts  
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage order drafts"
  ON public.order_drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin users can view order drafts"
  ON public.order_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    )
  );

-- Security Fix 2: Remove password_hash from admin_users and make Google-only
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS password_hash;

-- Update admin login policies to be Google-only
DROP POLICY IF EXISTS "Only specific admin can access admin data" ON public.admin_users;

CREATE POLICY "Admin users can manage their own data"
  ON public.admin_users
  FOR ALL
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Security Fix 3: Create indexes and add updated_at trigger for order_drafts
CREATE INDEX IF NOT EXISTS idx_order_drafts_session_id ON public.order_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_order_drafts_expires_at ON public.order_drafts(expires_at);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_order_drafts_updated_at ON public.order_drafts;
CREATE TRIGGER update_order_drafts_updated_at
  BEFORE UPDATE ON public.order_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Security Fix 4: Add function to clean up expired drafts
CREATE OR REPLACE FUNCTION public.cleanup_expired_order_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.order_drafts WHERE expires_at < now();
END;
$$;