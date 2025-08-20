-- Add the new Party On Delivery template based on the Figma screenshot
INSERT INTO public.figma_design_templates (
  template_name,
  template_category,
  figma_file_id,
  design_data,
  preview_image_url
) VALUES (
  'Party On Delivery - Elite Concierge',
  'cover_page',
  '1539725639609983749',
  '{
    "layout": "phone_frame_responsive",
    "frame_dimensions": {
      "width": 375,
      "height": 812,
      "aspect_ratio": "9:19.5"
    },
    "responsive_strategy": "centered_frame_with_extending_background",
    "elements": [
      {
        "id": "logo",
        "type": "logo",
        "position": { "x": 50, "y": 20 },
        "size": { "width": 120, "height": 120 },
        "style": {
          "borderRadius": "50%",
          "border": "3px solid #F5B800",
          "background": "radial-gradient(circle, #1a1a1a 0%, #000000 100%)",
          "filter": "drop-shadow(0 0 20px rgba(245, 184, 0, 0.4))"
        }
      },
      {
        "id": "title",
        "type": "text",
        "content": "ELITE CONCIERGE",
        "position": { "x": 50, "y": 40 },
        "style": {
          "fontSize": "2.25rem",
          "fontWeight": "800",
          "letterSpacing": "0.1em",
          "textAlign": "center",
          "color": "#F5B800",
          "textShadow": "0 0 20px rgba(245, 184, 0, 0.6)"
        }
      },
      {
        "id": "subtitle",
        "type": "text",
        "content": "LUXURY LIFESTYLE SERVICES",
        "position": { "x": 50, "y": 48 },
        "style": {
          "fontSize": "0.875rem",
          "fontWeight": "400",
          "letterSpacing": "0.15em",
          "textAlign": "center",
          "color": "#CCCCCC"
        }
      },
      {
        "id": "checklist",
        "type": "list",
        "items": [
          "🥂 PREMIUM ALCOHOL DELIVERY",
          "🤍 WHITE-GLOVE SERVICE", 
          "🏆 EXCLUSIVE MEMBER ACCESS"
        ],
        "position": { "x": 50, "y": 58 },
        "style": {
          "fontSize": "0.8rem",
          "spacing": "0.5rem",
          "textAlign": "center",
          "color": "#CCCCCC",
          "letterSpacing": "0.05em"
        }
      },
      {
        "id": "primary_button",
        "type": "button",
        "content": "ORDER NOW",
        "position": { "x": 50, "y": 75 },
        "style": {
          "background": "linear-gradient(135deg, #F5B800 0%, #FFD700 100%)",
          "color": "#000000",
          "padding": "1rem 2rem",
          "borderRadius": "2rem",
          "fontSize": "0.875rem",
          "fontWeight": "700",
          "letterSpacing": "0.1em",
          "width": "280px",
          "boxShadow": "0 4px 20px rgba(245, 184, 0, 0.4)"
        }
      },
      {
        "id": "secondary_button",
        "type": "button",
        "content": "VIEW COLLECTION",
        "position": { "x": 50, "y": 83 },
        "style": {
          "background": "transparent",
          "color": "#F5B800",
          "border": "1px solid #F5B800",
          "padding": "1rem 2rem",
          "borderRadius": "2rem",
          "fontSize": "0.875rem",
          "fontWeight": "600",
          "letterSpacing": "0.1em",
          "width": "280px"
        }
      }
    ],
    "theme": {
      "background": "radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%)",
      "frame_background": "linear-gradient(135deg, rgba(245, 184, 0, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)",
      "frame_border": "1px solid rgba(245, 184, 0, 0.3)",
      "frame_glow": "0 0 40px rgba(245, 184, 0, 0.2)",
      "primaryColor": "#F5B800",
      "secondaryColor": "#FFD700",
      "textColor": "#FFFFFF",
      "particles": true,
      "particleColor": "#F5B800"
    },
    "phone_frame": {
      "enabled": true,
      "border_radius": "2.5rem",
      "shadow": "0 20px 60px rgba(0, 0, 0, 0.5)",
      "glow_effect": true,
      "max_width": "400px",
      "center_on_large_screens": true
    }
  }',
  '/lovable-uploads/cb8304da-ff86-4ac0-a8cb-c2e982243cf2.png'
);