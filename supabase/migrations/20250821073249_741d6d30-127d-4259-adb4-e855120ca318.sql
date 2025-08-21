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

-- Insert the system guidelines from the user's requirements
INSERT INTO system_guidelines (guideline_type, title, description, rules, examples, priority) VALUES
-- General Guidelines
('general', 'Layout and Structure', 'Fundamental layout principles for responsive design', 
 '[
   "Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default",
   "Refactor code as you go to keep code clean",
   "Keep file sizes small and put helper functions and components in their own files"
 ]'::jsonb,
 '{"layout": "Use flexbox/grid for responsive layouts", "code": "Refactor continuously", "files": "Separate helper functions"}'::jsonb,
 10),

-- Design System Guidelines
('design_system', 'Typography and Formatting', 'Typography, date formatting, and UI element rules',
 '[
   "Use a base font-size of 14px",
   "Date formats should always be in the format \"Jun 10\"",
   "The bottom toolbar should only ever have a maximum of 4 items",
   "Never use the floating action button with the bottom toolbar",
   "Chips should always come in sets of 3 or more",
   "Don't use a dropdown if there are 2 or fewer options"
 ]'::jsonb,
 '{"font_size": "14px", "date_format": "Jun 10", "toolbar_max": 4, "chips_min": 3}'::jsonb,
 9),

-- Button Component Guidelines
('component', 'Button System', 'Complete button component usage and variants', 
 '[
   "Buttons should be used for important actions that users need to take, such as form submissions, confirming choices, or initiating processes",
   "They communicate interactivity and should have clear, action-oriented labels",
   "Primary Button: Used for the main action in a section or page. Bold, filled with the primary brand color. One primary button per section to guide users toward the most important action",
   "Secondary Button: Used for alternative or supporting actions. Outlined with the primary color, transparent background. Can appear alongside a primary button for less important actions", 
   "Tertiary Button: Used for the least important actions. Text-only with no border, using primary color. For actions that should be available but not emphasized"
 ]'::jsonb,
 '{
   "primary": {"style": "Bold, filled with primary color", "usage": "One per section", "purpose": "Main action"},
   "secondary": {"style": "Outlined, transparent background", "usage": "Supporting actions", "purpose": "Alternative actions"},
   "tertiary": {"style": "Text-only, no border", "usage": "Least important", "purpose": "Available but not emphasized"}
 }'::jsonb,
 8),

-- Cover Page Specific Guidelines
('design_system', 'Cover Page Design', 'Specific guidelines for Figma cover page implementation',
 '[
   "Cover pages must use responsive flexbox layouts, never absolute positioning",
   "Maintain consistent spacing using design system tokens",
   "Button variants must follow the three-tier system: Primary, Secondary, Tertiary",
   "Typography must use 14px base font size with proper hierarchy",
   "Animations should be smooth and purposeful, enhancing UX not distracting",
   "Templates must be fully customizable while maintaining design consistency"
 ]'::jsonb,
 '{"responsive": "Always flexbox/grid", "buttons": "Three-tier system", "typography": "14px base", "animations": "Smooth and purposeful"}'::jsonb,
 9),

-- Figma Template Guidelines  
('component', 'Figma Template System', 'Guidelines for template structure and customization',
 '[
   "Each template must support full content customization (title, subtitle, buttons, checklist)",
   "Template variants should have distinct visual hierarchies (Original, Gold, Platinum)",
   "All templates must be responsive and work on mobile/desktop",
   "Template switching should be seamless with live preview",
   "Customization should preserve template design integrity",
   "Templates must generate standalone preview URLs"
 ]'::jsonb,
 '{"customization": "Full content editing", "variants": "Visual hierarchy", "responsive": "Mobile/desktop", "preview": "Live and standalone"}'::jsonb,
 8);

-- Create function to get guidelines by type
CREATE OR REPLACE FUNCTION get_system_guidelines(p_guideline_type TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  guidelines_result JSONB;
BEGIN
  IF p_guideline_type IS NOT NULL THEN
    SELECT jsonb_agg(row_to_json(sg.*))
    INTO guidelines_result
    FROM system_guidelines sg
    WHERE sg.guideline_type = p_guideline_type
      AND sg.is_active = true
    ORDER BY sg.priority DESC, sg.title;
  ELSE
    SELECT jsonb_agg(row_to_json(sg.*))
    INTO guidelines_result  
    FROM system_guidelines sg
    WHERE sg.is_active = true
    ORDER BY sg.priority DESC, sg.guideline_type, sg.title;
  END IF;
  
  RETURN COALESCE(guidelines_result, '[]'::jsonb);
END;
$$;