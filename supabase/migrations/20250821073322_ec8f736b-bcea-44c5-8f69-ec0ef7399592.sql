-- Create system guidelines table for storing design system rules
CREATE TABLE IF NOT EXISTS system_guidelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guideline_type TEXT NOT NULL, -- 'general', 'design_system', 'component'
    component_name TEXT, -- For component-specific guidelines
    title TEXT NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]',
    examples JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by TEXT DEFAULT 'system'
);

-- Enable RLS
ALTER TABLE system_guidelines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Guidelines are publicly readable" 
ON system_guidelines FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage guidelines" 
ON system_guidelines FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());