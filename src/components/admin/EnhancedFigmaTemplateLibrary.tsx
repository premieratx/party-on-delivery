import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Play,
  Figma,
  Sparkles,
  Zap,
  Star,
  Crown,
  Gift
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FigmaTemplate {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  figma_url: string;
  category: 'delivery_app' | 'cover_page' | 'post_checkout';
  device_type: 'mobile' | 'tablet' | 'desktop' | 'all';
  design_data: any;
  is_active: boolean;
  created_at: string;
  tags: string[];
  theme: string;
  hasAnimations?: boolean;
}

interface EnhancedFigmaTemplateLibraryProps {
  onSelectTemplate?: (template: FigmaTemplate) => void;
  category?: 'delivery_app' | 'cover_page' | 'post_checkout';
}

export const EnhancedFigmaTemplateLibrary: React.FC<EnhancedFigmaTemplateLibraryProps> = ({
  onSelectTemplate,
  category = 'cover_page'
}) => {
  const [templates, setTemplates] = useState<FigmaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Enhanced Figma templates with proper animations and design data
  const enhancedTemplates: FigmaTemplate[] = [
    {
      id: 'luxury-gold-animated',
      name: 'Luxury Gold Elite',
      description: 'Premium animated design with floating particles and gradient overlays',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/luxury-gold-elite',
      category: 'cover_page',
      device_type: 'mobile',
      theme: 'gold',
      hasAnimations: true,
      design_data: {
        theme: 'gold',
        colors: { 
          primary: '#F5B800', 
          secondary: '#FFD700', 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          text: '#ffffff',
          glowColor: 'rgba(245, 184, 0, 0.4)'
        },
        typography: { heading: 'Playfair Display', body: 'Inter' },
        animations: {
          particles: true,
          floating: true,
          glow: true,
          fadeIn: true
        },
        elements: [
          {
            id: 'title',
            type: 'text',
            content: 'ELITE LUXURY DELIVERY',
            position: { x: 50, y: 20 },
            style: {
              fontSize: '2.5rem',
              fontWeight: 'bold',
              fontFamily: 'Playfair Display',
              color: '#F5B800',
              textAlign: 'center',
              textShadow: '0 0 20px rgba(245, 184, 0, 0.6)'
            },
            animations: ['fadeIn', 'glow']
          },
          {
            id: 'subtitle',
            type: 'text',
            content: 'Premium spirits delivered to your doorstep with white-glove service',
            position: { x: 50, y: 35 },
            style: {
              fontSize: '1.1rem',
              color: '#ffffff',
              textAlign: 'center',
              opacity: 0.9
            },
            animations: ['fadeIn']
          },
          {
            id: 'checklist',
            type: 'list',
            items: [
              '🥂 Premium Selection',
              '⚡ Same-Day Delivery',
              '🎯 White-Glove Service',
              '💎 VIP Experience'
            ],
            position: { x: 50, y: 55 },
            animations: ['slideInUp']
          },
          {
            id: 'primary_button',
            type: 'button',
            content: 'ORDER NOW',
            position: { x: 50, y: 75 },
            style: {
              background: 'linear-gradient(135deg, #F5B800, #FFD700)',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 8px 32px rgba(245, 184, 0, 0.4)',
              transform: 'scale(1)',
              transition: 'all 0.3s ease'
            },
            animations: ['pulse', 'hover-scale']
          },
          {
            id: 'secondary_button',
            type: 'button',
            content: 'VIEW COLLECTION',
            position: { x: 50, y: 85 },
            style: {
              background: 'transparent',
              color: '#F5B800',
              border: '2px solid #F5B800',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'medium'
            },
            animations: ['fadeIn']
          }
        ]
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['luxury', 'gold', 'animated', 'premium', 'elite']
    },
    {
      id: 'ocean-wave-animated',
      name: 'Ocean Wave Dynamics',
      description: 'Fluid animations with wave effects and floating elements',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/ocean-wave-dynamics',
      category: 'cover_page',
      device_type: 'mobile',
      theme: 'ocean',
      hasAnimations: true,
      design_data: {
        theme: 'ocean',
        colors: { 
          primary: '#00d4ff', 
          secondary: '#0088cc', 
          background: 'linear-gradient(135deg, #001122 0%, #003355 50%, #001122 100%)',
          text: '#ffffff',
          glowColor: 'rgba(0, 212, 255, 0.4)'
        },
        typography: { heading: 'Inter', body: 'Inter' },
        animations: {
          waves: true,
          floating: true,
          ripple: true,
          fadeIn: true
        },
        elements: [
          {
            id: 'title',
            type: 'text',
            content: 'OCEAN FRESH DELIVERY',
            position: { x: 50, y: 25 },
            style: {
              fontSize: '2.2rem',
              fontWeight: 'bold',
              color: '#00d4ff',
              textAlign: 'center',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.6)'
            },
            animations: ['fadeIn', 'wave']
          },
          {
            id: 'subtitle',
            type: 'text',
            content: 'Fresh seafood and ocean delicacies delivered with care',
            position: { x: 50, y: 40 },
            style: {
              fontSize: '1rem',
              color: '#ffffff',
              textAlign: 'center',
              opacity: 0.9
            },
            animations: ['fadeIn']
          },
          {
            id: 'checklist',
            type: 'list',
            items: [
              '🌊 Ocean Fresh',
              '❄️ Temperature Controlled',
              '🚚 Express Delivery',
              '🐟 Sustainable Sourcing'
            ],
            position: { x: 50, y: 60 },
            animations: ['slideInUp', 'ripple']
          },
          {
            id: 'primary_button',
            type: 'button',
            content: 'DIVE IN',
            position: { x: 50, y: 80 },
            style: {
              background: 'linear-gradient(135deg, #00d4ff, #0088cc)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '25px',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 8px 32px rgba(0, 212, 255, 0.4)'
            },
            animations: ['pulse', 'wave', 'hover-scale']
          }
        ]
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['ocean', 'blue', 'animated', 'fresh', 'waves']
    },
    {
      id: 'sunset-glow-animated',
      name: 'Sunset Glow Magic',
      description: 'Warm animated gradients with floating particles and glow effects',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/sunset-glow-magic',
      category: 'cover_page',
      device_type: 'mobile',
      theme: 'sunset',
      hasAnimations: true,
      design_data: {
        theme: 'sunset',
        colors: { 
          primary: '#ff6b6b', 
          secondary: '#ffa500', 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #ff6b6b 100%)',
          text: '#ffffff',
          glowColor: 'rgba(255, 107, 107, 0.4)'
        },
        typography: { heading: 'Poppins', body: 'Inter' },
        animations: {
          particles: true,
          glow: true,
          floating: true,
          fadeIn: true
        },
        elements: [
          {
            id: 'title',
            type: 'text',
            content: 'SUNSET GLOW DELIVERY',
            position: { x: 50, y: 20 },
            style: {
              fontSize: '2.3rem',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              textShadow: '0 0 20px rgba(255, 107, 107, 0.8)'
            },
            animations: ['fadeIn', 'glow']
          },
          {
            id: 'subtitle',
            type: 'text',
            content: 'Warm meals and comfort food delivered with love',
            position: { x: 50, y: 35 },
            style: {
              fontSize: '1rem',
              color: '#ffffff',
              textAlign: 'center',
              opacity: 0.95
            },
            animations: ['fadeIn']
          },
          {
            id: 'checklist',
            type: 'list',
            items: [
              '🔥 Hot & Fresh',
              '💖 Made with Love',
              '⚡ Quick Delivery',
              '🌅 Sunset Special'
            ],
            position: { x: 50, y: 55 },
            animations: ['slideInUp']
          },
          {
            id: 'primary_button',
            type: 'button',
            content: 'GLOW NOW',
            position: { x: 50, y: 75 },
            style: {
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
            },
            animations: ['pulse', 'glow', 'hover-scale']
          }
        ]
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['sunset', 'warm', 'animated', 'glow', 'particles']
    }
  ];

  useEffect(() => {
    setTemplates(enhancedTemplates);
  }, []);

  const handleSelectTemplate = (template: FigmaTemplate) => {
    toast.success(`🎨 Applied "${template.name}" template with animations!`);
    onSelectTemplate?.(template);
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'gold': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'ocean': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'sunset': return <Gift className="w-4 h-4 text-orange-500" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const renderAnimatedPreview = (template: FigmaTemplate) => {
    const isHovered = hoveredTemplate === template.id;
    const theme = template.design_data?.colors;
    
    return (
      <div 
        className="aspect-[4/5] relative overflow-hidden rounded-lg border-2 border-transparent"
        style={{
          background: theme?.background || 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
          borderColor: isHovered ? theme?.primary : 'transparent',
          boxShadow: isHovered ? `0 0 30px ${theme?.glowColor || 'rgba(0,0,0,0.2)'}` : 'none'
        }}
      >
        {/* Animated Background Effects */}
        {template.design_data?.animations?.particles && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-pulse"
                style={{
                  backgroundColor: theme?.primary,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Content Preview */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center p-6 text-center">
          {/* Title */}
          <h3 
            className="text-lg font-bold mb-2 animate-fade-in"
            style={{ 
              color: theme?.primary,
              textShadow: `0 0 10px ${theme?.glowColor}`,
              animation: isHovered ? 'pulse 2s infinite' : undefined
            }}
          >
            {template.design_data?.elements?.find((e: any) => e.id === 'title')?.content || template.name}
          </h3>
          
          {/* Subtitle */}
          <p 
            className="text-xs mb-4 opacity-80 animate-fade-in animate-delay-200"
            style={{ color: theme?.text }}
          >
            {template.design_data?.elements?.find((e: any) => e.id === 'subtitle')?.content || template.description}
          </p>

          {/* Checklist Preview */}
          <div className="space-y-1 mb-4 animate-slide-in-up animate-delay-400">
            {template.design_data?.elements?.find((e: any) => e.id === 'checklist')?.items?.slice(0, 3).map((item: string, idx: number) => (
              <div key={idx} className="text-xs flex items-center justify-center gap-1" style={{ color: theme?.text }}>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Button Preview */}
          <div className="space-y-2">
            <div
              className="px-4 py-2 rounded-lg text-xs font-semibold animate-scale-in animate-delay-600 transition-transform hover:scale-105"
              style={{
                background: template.design_data?.elements?.find((e: any) => e.id === 'primary_button')?.style?.background || theme?.primary,
                color: template.design_data?.elements?.find((e: any) => e.id === 'primary_button')?.style?.color || '#ffffff',
                boxShadow: `0 4px 20px ${theme?.glowColor}`
              }}
            >
              {template.design_data?.elements?.find((e: any) => e.id === 'primary_button')?.content || 'Get Started'}
            </div>
          </div>
        </div>

        {/* Hover Animation Overlay */}
        {isHovered && (
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: `radial-gradient(circle at center, ${theme?.glowColor} 0%, transparent 70%)`,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Figma className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold">Enhanced Figma Templates</h3>
          <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
        <p className="text-muted-foreground">
          Professional animated designs with smooth transitions and interactive elements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/30"
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            <div className="relative">
              {renderAnimatedPreview(template)}
              
              {/* Template Info Overlay */}
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                  {getThemeIcon(template.theme)}
                  {template.theme}
                </Badge>
                {template.hasAnimations && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    <Play className="w-3 h-3 mr-1" />
                    Animated
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {template.name}
                    {template.hasAnimations && <Zap className="w-4 h-4 text-yellow-500" />}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Apply Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};