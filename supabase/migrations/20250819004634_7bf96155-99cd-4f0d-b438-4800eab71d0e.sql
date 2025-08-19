-- Create a table to store delivery app collection mappings for fast lookup
CREATE TABLE IF NOT EXISTS public.delivery_app_collection_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_app_id UUID REFERENCES public.delivery_app_variations(id) ON DELETE CASCADE,
  tab_name TEXT NOT NULL,
  tab_index INTEGER NOT NULL,
  shopify_collection_handle TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique mapping per app tab
  UNIQUE(delivery_app_id, tab_index)
);

-- Enable RLS
ALTER TABLE public.delivery_app_collection_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Collection mappings are publicly viewable" 
ON public.delivery_app_collection_mappings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage collection mappings" 
ON public.delivery_app_collection_mappings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_app_collection_mappings_updated_at
  BEFORE UPDATE ON public.delivery_app_collection_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default mappings for the main delivery app
-- First, find the default delivery app
INSERT INTO public.delivery_app_collection_mappings (delivery_app_id, tab_name, tab_index, shopify_collection_handle)
SELECT 
  dav.id,
  tab_data.tab_name,
  tab_data.tab_index,
  tab_data.collection_handle
FROM public.delivery_app_variations dav,
LATERAL (
  VALUES 
    ('Beer', 0, 'tailgate-beer'),
    ('Seltzers', 1, 'seltzer-collection'),
    ('Cocktails', 2, 'cocktail-kits'), 
    ('Mixers & N/A', 3, 'mixers-non-alcoholic'),
    ('Spirits', 4, 'spirits')
) AS tab_data(tab_name, tab_index, collection_handle)
WHERE dav.app_slug = 'main-delivery-app' OR dav.is_homepage = true
ON CONFLICT (delivery_app_id, tab_index) DO UPDATE SET
  tab_name = EXCLUDED.tab_name,
  shopify_collection_handle = EXCLUDED.shopify_collection_handle,
  updated_at = now();