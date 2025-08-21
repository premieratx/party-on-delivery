-- Add theme column to delivery_app_variations if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_app_variations' AND column_name = 'theme') THEN
        ALTER TABLE delivery_app_variations ADD COLUMN theme text DEFAULT 'gold';
    END IF;
END $$;

-- Migrate existing delivery apps to use unified theme system
UPDATE delivery_app_variations 
SET theme = 'gold'
WHERE theme IS NULL OR theme = '';

-- Add theme column to cover_pages if it doesn't exist and migrate existing themes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_pages' AND column_name = 'unified_theme') THEN
        ALTER TABLE cover_pages ADD COLUMN unified_theme text DEFAULT 'gold';
    END IF;
END $$;

-- Migrate existing cover page themes to unified system
UPDATE cover_pages 
SET unified_theme = CASE 
    WHEN theme = 'default' THEN 'original'
    WHEN theme = 'gold' THEN 'gold'
    WHEN theme = 'platinum' THEN 'platinum'
    ELSE 'gold'
END;

-- Add theme column to post_checkout_pages if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_checkout_pages' AND column_name = 'theme') THEN
        ALTER TABLE post_checkout_pages ADD COLUMN theme text DEFAULT 'gold';
    END IF;
END $$;

-- Set default theme for all existing post-checkout pages
UPDATE post_checkout_pages 
SET theme = 'gold'
WHERE theme IS NULL OR theme = '';

-- Create flow_themes table for unified flow-level theming
CREATE TABLE IF NOT EXISTS flow_themes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_name text NOT NULL,
    theme text NOT NULL DEFAULT 'gold',
    delivery_app_id uuid REFERENCES delivery_app_variations(id),
    cover_page_id uuid REFERENCES cover_pages(id),
    post_checkout_page_id uuid REFERENCES post_checkout_pages(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(flow_name)
);

-- Enable RLS on flow_themes
ALTER TABLE flow_themes ENABLE ROW LEVEL SECURITY;

-- Create policy for flow_themes
CREATE POLICY "Admins can manage flow themes" ON flow_themes
FOR ALL USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());