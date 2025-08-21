-- Create cover page templates table for storing Figma templates
CREATE TABLE IF NOT EXISTS cover_page_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL DEFAULT 'figma',
    template_config JSONB NOT NULL DEFAULT '{}',
    preview_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by TEXT DEFAULT 'system'
);

-- Enable RLS
ALTER TABLE cover_page_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Templates are publicly readable" 
ON cover_page_templates FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON cover_page_templates FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Insert the Figma templates
INSERT INTO cover_page_templates (template_name, template_type, template_config, is_active) VALUES
('Original Clean', 'figma', '{"id": "original", "name": "Original", "description": "Clean, modern design with gradient accents", "badge": "✨ Classic", "colors": ["from-primary/5", "via-accent/10", "to-secondary/5"]}', true),
('Gold Premium', 'figma', '{"id": "gold", "name": "Gold Tier", "description": "Premium gold theme for luxury experiences", "badge": "🏆 Premium", "colors": ["from-amber-400", "to-yellow-500"]}', true),
('Platinum Elite', 'figma', '{"id": "platinum", "name": "Platinum Elite", "description": "Ultra-premium platinum design", "badge": "💎 Elite", "colors": ["from-slate-600", "to-zinc-600"]}', true);