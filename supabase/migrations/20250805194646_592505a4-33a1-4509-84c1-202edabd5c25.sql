-- Create storage bucket for delivery app logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-app-logos', 'delivery-app-logos', true);

-- Create storage policies for logo uploads
CREATE POLICY "Anyone can view delivery app logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'delivery-app-logos');

CREATE POLICY "Admins can upload delivery app logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'delivery-app-logos' 
  AND (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

CREATE POLICY "Admins can update delivery app logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'delivery-app-logos' 
  AND (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

CREATE POLICY "Admins can delete delivery app logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'delivery-app-logos' 
  AND (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- Add logo_url column to delivery_app_variations table
ALTER TABLE delivery_app_variations 
ADD COLUMN logo_url TEXT;

-- Update start_screen_config to include logo_url field
UPDATE delivery_app_variations 
SET start_screen_config = jsonb_set(
  COALESCE(start_screen_config, '{}'),
  '{logo_url}',
  'null'
)
WHERE start_screen_config IS NULL OR NOT (start_screen_config ? 'logo_url');