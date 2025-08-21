-- Insert the system guidelines data
INSERT INTO system_guidelines (guideline_type, title, description, rules, examples, priority) VALUES
('general', 'Layout and Structure', 'Fundamental layout principles for responsive design', 
 '["Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default", "Refactor code as you go to keep code clean", "Keep file sizes small and put helper functions and components in their own files"]'::jsonb,
 '{"layout": "Use flexbox/grid for responsive layouts", "code": "Refactor continuously", "files": "Separate helper functions"}'::jsonb,
 10),

('design_system', 'Typography and Formatting', 'Typography, date formatting, and UI element rules',
 '["Use a base font-size of 14px", "Date formats should always be in the format Jun 10", "The bottom toolbar should only ever have a maximum of 4 items", "Never use the floating action button with the bottom toolbar", "Chips should always come in sets of 3 or more", "Do not use a dropdown if there are 2 or fewer options"]'::jsonb,
 '{"font_size": "14px", "date_format": "Jun 10", "toolbar_max": 4, "chips_min": 3}'::jsonb,
 9),

('component', 'Button System', 'Complete button component usage and variants', 
 '["Buttons should be used for important actions that users need to take, such as form submissions, confirming choices, or initiating processes", "They communicate interactivity and should have clear, action-oriented labels", "Primary Button: Used for the main action in a section or page. Bold, filled with the primary brand color. One primary button per section to guide users toward the most important action", "Secondary Button: Used for alternative or supporting actions. Outlined with the primary color, transparent background. Can appear alongside a primary button for less important actions", "Tertiary Button: Used for the least important actions. Text-only with no border, using primary color. For actions that should be available but not emphasized"]'::jsonb,
 '{"primary": {"style": "Bold, filled with primary color", "usage": "One per section", "purpose": "Main action"}, "secondary": {"style": "Outlined, transparent background", "usage": "Supporting actions", "purpose": "Alternative actions"}, "tertiary": {"style": "Text-only, no border", "usage": "Least important", "purpose": "Available but not emphasized"}}'::jsonb,
 8),

('design_system', 'Cover Page Design', 'Specific guidelines for Figma cover page implementation',
 '["Cover pages must use responsive flexbox layouts, never absolute positioning", "Maintain consistent spacing using design system tokens", "Button variants must follow the three-tier system: Primary, Secondary, Tertiary", "Typography must use 14px base font size with proper hierarchy", "Animations should be smooth and purposeful, enhancing UX not distracting", "Templates must be fully customizable while maintaining design consistency"]'::jsonb,
 '{"responsive": "Always flexbox/grid", "buttons": "Three-tier system", "typography": "14px base", "animations": "Smooth and purposeful"}'::jsonb,
 9),

('component', 'Figma Template System', 'Guidelines for template structure and customization',
 '["Each template must support full content customization (title, subtitle, buttons, checklist)", "Template variants should have distinct visual hierarchies (Original, Gold, Platinum)", "All templates must be responsive and work on mobile/desktop", "Template switching should be seamless with live preview", "Customization should preserve template design integrity", "Templates must generate standalone preview URLs"]'::jsonb,
 '{"customization": "Full content editing", "variants": "Visual hierarchy", "responsive": "Mobile/desktop", "preview": "Live and standalone"}'::jsonb,
 8);