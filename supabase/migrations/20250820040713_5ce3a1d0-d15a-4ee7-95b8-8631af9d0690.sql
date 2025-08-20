-- Create missing storage bucket for post-checkout assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-checkout-assets', 'post-checkout-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for post-checkout-assets bucket
CREATE POLICY "Post checkout assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-checkout-assets');

CREATE POLICY "Admins can upload post checkout assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-checkout-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can update post checkout assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'post-checkout-assets' AND is_admin_user_safe());

-- Add missing 'styles' column to delivery_app_variations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delivery_app_variations' 
        AND column_name = 'styles'
    ) THEN
        ALTER TABLE public.delivery_app_variations 
        ADD COLUMN styles JSONB DEFAULT '{}';
    END IF;
END $$;