-- Create Figma design templates table
CREATE TABLE public.figma_design_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL DEFAULT 'cover_page',
  figma_file_id TEXT,
  figma_node_id TEXT,
  design_data JSONB NOT NULL DEFAULT '{}',
  preview_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.figma_design_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active templates" 
ON public.figma_design_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON public.figma_design_templates 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Create storage bucket for Figma assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('figma-assets', 'figma-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for figma-assets bucket
CREATE POLICY "Figma assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'figma-assets');

CREATE POLICY "Admins can upload figma assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'figma-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can update figma assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'figma-assets' AND is_admin_user_safe());

-- Insert sample Figma design templates
INSERT INTO public.figma_design_templates (
  template_name,
  template_category,
  design_data,
  preview_image_url
) VALUES 
(
  'Luxury Concierge Premium',
  'cover_page',
  '{
    "layout": "centered",
    "elements": [
      {
        "id": "logo",
        "type": "logo",
        "position": { "x": 50, "y": 15 },
        "size": { "width": 200, "height": 80 },
        "style": {
          "filter": "drop-shadow(0 4px 20px rgba(245, 184, 0, 0.3))"
        }
      },
      {
        "id": "title",
        "type": "text",
        "content": "ELITE CONCIERGE",
        "position": { "x": 50, "y": 35 },
        "style": {
          "fontSize": "3.5rem",
          "fontWeight": "800",
          "letterSpacing": "0.05em",
          "textAlign": "center",
          "background": "linear-gradient(135deg, #F5B800 0%, #FFD700 100%)",
          "backgroundClip": "text",
          "textFillColor": "transparent",
          "textShadow": "0 0 30px rgba(245, 184, 0, 0.4)"
        }
      },
      {
        "id": "subtitle",
        "type": "text",
        "content": "Luxury Lifestyle Services",
        "position": { "x": 50, "y": 45 },
        "style": {
          "fontSize": "1.25rem",
          "fontWeight": "300",
          "letterSpacing": "0.1em",
          "textAlign": "center",
          "color": "#CCCCCC"
        }
      },
      {
        "id": "checklist",
        "type": "list",
        "items": [
          "🥂 Premium Alcohol Delivery",
          "🚁 White-Glove Service", 
          "💎 Exclusive Member Access"
        ],
        "position": { "x": 50, "y": 60 },
        "style": {
          "fontSize": "1.1rem",
          "spacing": "1rem",
          "textAlign": "center",
          "color": "#CCCCCC"
        }
      },
      {
        "id": "cta_button",
        "type": "button",
        "content": "ORDER NOW",
        "position": { "x": 50, "y": 80 },
        "style": {
          "background": "linear-gradient(135deg, #F5B800 0%, #FFD700 100%)",
          "color": "#000000",
          "padding": "1rem 2.5rem",
          "borderRadius": "0.75rem",
          "fontSize": "1.1rem",
          "fontWeight": "700",
          "letterSpacing": "0.05em",
          "boxShadow": "0 8px 25px rgba(245, 184, 0, 0.4)",
          "transform": "translateY(0)",
          "transition": "all 0.3s ease"
        }
      }
    ],
    "theme": {
      "background": "radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)",
      "primaryColor": "#F5B800",
      "secondaryColor": "#FFD700",
      "textColor": "#FFFFFF"
    }
  }',
  '/figma-preview-luxury.jpg'
),
(
  'Ocean Breeze Modern',
  'cover_page', 
  '{
    "layout": "left_aligned",
    "elements": [
      {
        "id": "logo",
        "type": "logo",
        "position": { "x": 20, "y": 10 },
        "size": { "width": 150, "height": 60 }
      },
      {
        "id": "title",
        "type": "text",
        "content": "OCEAN DELIVERY",
        "position": { "x": 20, "y": 30 },
        "style": {
          "fontSize": "3rem",
          "fontWeight": "700",
          "color": "#00d4ff",
          "textShadow": "0 0 20px rgba(0, 212, 255, 0.3)"
        }
      },
      {
        "id": "subtitle",
        "type": "text",
        "content": "Fresh • Fast • Reliable",
        "position": { "x": 20, "y": 40 },
        "style": {
          "fontSize": "1.2rem",
          "color": "#b3e5fc",
          "letterSpacing": "0.2em"
        }
      },
      {
        "id": "checklist",
        "type": "list",
        "items": [
          "🌊 Ocean-Fresh Products",
          "⚡ Lightning-Fast Delivery",
          "🏆 Premium Quality Guarantee"
        ],
        "position": { "x": 20, "y": 55 }
      },
      {
        "id": "cta_button",
        "type": "button",
        "content": "DIVE IN",
        "position": { "x": 20, "y": 75 },
        "style": {
          "background": "#00d4ff",
          "color": "#0077be",
          "border": "2px solid #00d4ff"
        }
      }
    ],
    "theme": {
      "background": "linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #0083b0 100%)",
      "primaryColor": "#00d4ff",
      "particles": true
    }
  }',
  '/figma-preview-ocean.jpg'
),
(
  'Sunset Glow Vibrant',
  'cover_page',
  '{
    "layout": "centered",
    "elements": [
      {
        "id": "title",
        "type": "text", 
        "content": "SUNSET SERVICES",
        "position": { "x": 50, "y": 25 },
        "style": {
          "fontSize": "3.2rem",
          "fontWeight": "800",
          "color": "#ffffff",
          "textShadow": "0 0 40px rgba(255, 255, 255, 0.4)"
        }
      },
      {
        "id": "subtitle",
        "type": "text",
        "content": "Where Every Moment Glows",
        "position": { "x": 50, "y": 35 },
        "style": {
          "fontSize": "1.3rem",
          "color": "#ffe8e8",
          "fontStyle": "italic"
        }
      },
      {
        "id": "logo", 
        "type": "logo",
        "position": { "x": 50, "y": 50 },
        "size": { "width": 180, "height": 180 }
      },
      {
        "id": "checklist",
        "type": "list",
        "items": [
          "🌅 Golden Hour Delivery",
          "✨ Magical Experiences",
          "🎨 Artisan Products"
        ],
        "position": { "x": 50, "y": 70 }
      },
      {
        "id": "cta_button",
        "type": "button",
        "content": "GLOW WITH US",
        "position": { "x": 50, "y": 85 },
        "style": {
          "background": "#ffffff",
          "color": "#ff6b6b",
          "border": "none"
        }
      }
    ],
    "theme": {
      "background": "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)",
      "primaryColor": "#ffffff"
    }
  }',
  '/figma-preview-sunset.jpg'
);

-- Create function to load template data
CREATE OR REPLACE FUNCTION public.load_figma_template(template_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  template_data JSONB;
BEGIN
  SELECT design_data INTO template_data
  FROM figma_design_templates
  WHERE id = template_id AND is_active = true;
  
  IF template_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Template not found');
  END IF;
  
  RETURN template_data;
END;
$$;