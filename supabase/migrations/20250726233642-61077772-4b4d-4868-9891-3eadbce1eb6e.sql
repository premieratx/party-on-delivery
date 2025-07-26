-- Create custom affiliate sites table
CREATE TABLE public.custom_affiliate_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_slug TEXT NOT NULL UNIQUE,
  site_name TEXT NOT NULL,
  affiliate_id UUID REFERENCES public.affiliates(id),
  business_name TEXT NOT NULL,
  business_address JSONB,
  custom_promo_code TEXT,
  is_active BOOLEAN DEFAULT true,
  site_type TEXT DEFAULT 'custom', -- 'wedding', 'boat_rental', 'concierge', 'custom'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site product collections mapping
CREATE TABLE public.site_product_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.custom_affiliate_sites(id) ON DELETE CASCADE,
  shopify_collection_handle TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site configurations for custom settings
CREATE TABLE public.site_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.custom_affiliate_sites(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, config_key)
);

-- Enable RLS
ALTER TABLE public.custom_affiliate_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_affiliate_sites
CREATE POLICY "Admin users can manage all sites" 
ON public.custom_affiliate_sites 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Sites are publicly viewable when active" 
ON public.custom_affiliate_sites 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Affiliates can view their own sites" 
ON public.custom_affiliate_sites 
FOR SELECT 
USING (affiliate_id IN (
  SELECT affiliates.id FROM affiliates 
  WHERE affiliates.email = auth.email()
));

-- RLS Policies for site_product_collections
CREATE POLICY "Admin users can manage all site collections" 
ON public.site_product_collections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Site collections are publicly viewable" 
ON public.site_product_collections 
FOR SELECT 
USING (true);

-- RLS Policies for site_configurations
CREATE POLICY "Admin users can manage all site configs" 
ON public.site_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Site configs are publicly viewable" 
ON public.site_configurations 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_custom_affiliate_sites_slug ON public.custom_affiliate_sites(site_slug);
CREATE INDEX idx_custom_affiliate_sites_affiliate_id ON public.custom_affiliate_sites(affiliate_id);
CREATE INDEX idx_site_product_collections_site_id ON public.site_product_collections(site_id);
CREATE INDEX idx_site_configurations_site_id ON public.site_configurations(site_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_affiliate_sites_updated_at
  BEFORE UPDATE ON public.custom_affiliate_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_configurations_updated_at
  BEFORE UPDATE ON public.site_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();