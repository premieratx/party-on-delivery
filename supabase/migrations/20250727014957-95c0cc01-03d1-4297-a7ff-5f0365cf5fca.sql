-- Create custom collections table for admin-created collections
CREATE TABLE public.custom_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  description TEXT,
  product_ids TEXT[] NOT NULL DEFAULT '{}',
  shopify_collection_id TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by_admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_collections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage custom collections"
ON public.custom_collections
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Custom collections are publicly readable when published"
ON public.custom_collections
FOR SELECT
USING (is_published = true);

-- Create collection drafts table for saving progress
CREATE TABLE public.collection_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  selected_product_ids TEXT[] NOT NULL DEFAULT '{}',
  created_by_admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for drafts
ALTER TABLE public.collection_drafts ENABLE ROW LEVEL SECURITY;

-- Create policy for drafts
CREATE POLICY "Admin users can manage collection drafts"
ON public.collection_drafts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_custom_collections_updated_at
BEFORE UPDATE ON public.custom_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_drafts_updated_at
BEFORE UPDATE ON public.collection_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();