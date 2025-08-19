-- Fix affiliate system architecture for multiple flows per affiliate
-- Add missing columns and update existing structure

-- Update cover_pages to support multiple flows per affiliate
ALTER TABLE public.cover_pages 
ADD COLUMN IF NOT EXISTS affiliate_assigned_slug text,
ADD COLUMN IF NOT EXISTS is_multi_flow boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flow_name text,
ADD COLUMN IF NOT EXISTS flow_description text;

-- Create affiliate_flows table for managing multiple customer flows
CREATE TABLE IF NOT EXISTS public.affiliate_flows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  flow_name text NOT NULL,
  flow_slug text NOT NULL UNIQUE,
  flow_description text,
  cover_page_id uuid,
  post_checkout_screen_id uuid,
  delivery_app_configs jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on affiliate_flows
ALTER TABLE public.affiliate_flows ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_flows
CREATE POLICY "Affiliates can manage their own flows" ON public.affiliate_flows
FOR ALL USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE email = auth.email()
  )
);

CREATE POLICY "Admin users can manage all flows" ON public.affiliate_flows
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = auth.email()
  )
);

-- Update affiliates table to support custom affiliate handles
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS custom_handle text UNIQUE,
ADD COLUMN IF NOT EXISTS default_flow_id uuid;

-- Create unique index on custom_handle
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_custom_handle 
ON public.affiliates(custom_handle) WHERE custom_handle IS NOT NULL;

-- Function to ensure single default flow per affiliate
CREATE OR REPLACE FUNCTION public.ensure_single_default_flow()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.affiliate_flows 
    SET is_default = false 
    WHERE affiliate_id = NEW.affiliate_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for single default flow
DROP TRIGGER IF EXISTS ensure_single_default_flow_trigger ON public.affiliate_flows;
CREATE TRIGGER ensure_single_default_flow_trigger
  BEFORE INSERT OR UPDATE ON public.affiliate_flows
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_flow();

-- Update post_checkout_screens to link to flows
ALTER TABLE public.post_checkout_screens
ADD COLUMN IF NOT EXISTS flow_id uuid,
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;

-- Fix product ordering issue by adding sort_order to shopify_products_cache if not exists
ALTER TABLE public.shopify_products_cache 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create index for faster sort_order queries
CREATE INDEX IF NOT EXISTS idx_shopify_products_sort_order 
ON public.shopify_products_cache(sort_order, id);

-- Function to generate affiliate handle from company name
CREATE OR REPLACE FUNCTION public.generate_affiliate_handle(company_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 1;
BEGIN
  -- Create base handle from company name (lowercase, replace spaces/special chars with hyphens)
  base_handle := lower(trim(company_name));
  base_handle := regexp_replace(base_handle, '[^a-z0-9]+', '-', 'g');
  base_handle := regexp_replace(base_handle, '^-+|-+$', '', 'g');
  base_handle := substring(base_handle from 1 for 20);
  
  -- If base_handle is empty or too short, use random string
  IF length(base_handle) < 3 THEN
    base_handle := 'affiliate-' || floor(random() * 1000)::text;
  END IF;
  
  final_handle := base_handle;
  
  -- Check if handle exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE custom_handle = final_handle) LOOP
    final_handle := base_handle || '-' || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_handle;
END;
$$;

-- Update existing affiliates to have custom handles if they don't have one
UPDATE public.affiliates 
SET custom_handle = public.generate_affiliate_handle(company_name)
WHERE custom_handle IS NULL;

-- Add comments for documentation
COMMENT ON TABLE public.affiliate_flows IS 'Manages multiple customer flows per affiliate - each flow includes cover page, delivery app routing, and post-checkout screen';
COMMENT ON COLUMN public.affiliate_flows.flow_slug IS 'Unique slug for the flow - used in URLs like /{affiliate-handle}/{flow-slug}/cover';
COMMENT ON COLUMN public.affiliates.custom_handle IS 'Custom handle chosen by affiliate - used as base for flow URLs';
COMMENT ON COLUMN public.affiliates.default_flow_id IS 'Reference to the default flow for this affiliate';