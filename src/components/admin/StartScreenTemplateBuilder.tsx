import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Palette, Type, Smartphone, Monitor, Search, Star, Download, Eye, Grid3x3, Zap, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface StartScreenTemplate {
  id: string;
  name: string;
  category: 'minimalist' | 'gradient' | 'card' | 'hero' | 'split' | 'floating';
  device: 'mobile' | 'desktop' | 'both';
  description: string;
  preview_image?: string;
  popularity: number;
  config: {
    layout: string;
    background: string | { type: 'gradient' | 'solid' | 'image', value: string };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
    typography: {
      title_size: string;
      subtitle_size: string;
      button_size: string;
      font_weight: string;
    };
    spacing: {
      container: string;
      elements: string;
      buttons: string;
    };
    effects: {
      shadows: boolean;
      borders: boolean;
      animations: boolean;
      hover_effects: boolean;
    };
    custom_css?: string;
  };
}

interface TemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: StartScreenTemplate) => void;
  currentAppName?: string;
}

// Professional Templates Based on Top Delivery Apps
const MOBILE_TEMPLATES: StartScreenTemplate[] = [
  // Minimalist Mobile Templates (1-10)
  {
    id: 'mobile-min-001',
    name: 'Clean Minimal',
    category: 'minimalist',
    device: 'mobile',
    description: 'Ultra-clean design inspired by modern fintech apps',
    popularity: 95,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#ffffff' },
      colors: { primary: '#000000', secondary: '#6b7280', accent: '#3b82f6', text: '#111827', background: '#ffffff' },
      typography: { title_size: '2xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: false, borders: true, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-min-002',
    name: 'Nordic White',
    category: 'minimalist',
    device: 'mobile',
    description: 'Scandinavian-inspired minimal design',
    popularity: 88,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#fafafa' },
      colors: { primary: '#1f2937', secondary: '#9ca3af', accent: '#10b981', text: '#374151', background: '#fafafa' },
      typography: { title_size: '2xl', subtitle_size: 'base', button_size: 'lg', font_weight: '500' },
      spacing: { container: 'px-8 py-10', elements: 'space-y-8', buttons: 'space-y-4' },
      effects: { shadows: false, borders: false, animations: true, hover_effects: false }
    }
  },
  {
    id: 'mobile-min-003',
    name: 'Monospace Clean',
    category: 'minimalist',
    device: 'mobile',
    description: 'Developer-inspired clean interface',
    popularity: 82,
    config: {
      layout: 'top-aligned',
      background: { type: 'solid', value: '#f8fafc' },
      colors: { primary: '#0f172a', secondary: '#64748b', accent: '#06b6d4', text: '#1e293b', background: '#f8fafc' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'md', font_weight: '700' },
      spacing: { container: 'px-6 py-6', elements: 'space-y-4', buttons: 'space-y-2' },
      effects: { shadows: false, borders: true, animations: false, hover_effects: true }
    }
  },
  {
    id: 'mobile-min-004',
    name: 'Pure Minimal',
    category: 'minimalist',
    device: 'mobile',
    description: 'Absolutely minimal, maximum impact',
    popularity: 91,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#ffffff' },
      colors: { primary: '#000000', secondary: '#888888', accent: '#ff6b6b', text: '#333333', background: '#ffffff' },
      typography: { title_size: '3xl', subtitle_size: 'base', button_size: 'xl', font_weight: '400' },
      spacing: { container: 'px-4 py-12', elements: 'space-y-12', buttons: 'space-y-6' },
      effects: { shadows: false, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-min-005',
    name: 'Text Focus',
    category: 'minimalist',
    device: 'mobile',
    description: 'Typography-first minimal design',
    popularity: 76,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#fdfdfd' },
      colors: { primary: '#1a1a1a', secondary: '#666666', accent: '#8b5cf6', text: '#2d2d2d', background: '#fdfdfd' },
      typography: { title_size: '2xl', subtitle_size: 'lg', button_size: 'lg', font_weight: '300' },
      spacing: { container: 'px-8 py-8', elements: 'space-y-6', buttons: 'space-y-4' },
      effects: { shadows: false, borders: false, animations: true, hover_effects: false }
    }
  },
  // Add 5 more minimalist templates...
  {
    id: 'mobile-min-006',
    name: 'Zen Minimal',
    category: 'minimalist',
    device: 'mobile',
    description: 'Calm and focused minimal design',
    popularity: 85,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#f9fafb' },
      colors: { primary: '#374151', secondary: '#9ca3af', accent: '#059669', text: '#111827', background: '#f9fafb' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '500' },
      spacing: { container: 'px-6 py-10', elements: 'space-y-8', buttons: 'space-y-4' },
      effects: { shadows: false, borders: false, animations: true, hover_effects: true }
    }
  },
  
  // Gradient Mobile Templates (11-20)
  {
    id: 'mobile-grad-001',
    name: 'Sunset Glow',
    category: 'gradient',
    device: 'mobile',
    description: 'Warm sunset gradient background',
    popularity: 93,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
      colors: { primary: '#ffffff', secondary: '#f8f9fa', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '2xl', subtitle_size: 'base', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-4' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-grad-002',
    name: 'Ocean Breeze',
    category: 'gradient',
    device: 'mobile',
    description: 'Cool ocean-inspired gradient',
    popularity: 89,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      colors: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '2xl', subtitle_size: 'lg', button_size: 'lg', font_weight: '500' },
      spacing: { container: 'px-8 py-10', elements: 'space-y-8', buttons: 'space-y-4' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-grad-003',
    name: 'Neon Nights',
    category: 'gradient',
    device: 'mobile',
    description: 'Vibrant neon gradient design',
    popularity: 87,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      colors: { primary: '#ffffff', secondary: '#e5e7eb', accent: '#10b981', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '3xl', subtitle_size: 'base', button_size: 'xl', font_weight: '700' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-4' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-grad-004',
    name: 'Purple Magic',
    category: 'gradient',
    device: 'mobile',
    description: 'Mystical purple gradient',
    popularity: 85,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
      colors: { primary: '#4c1d95', secondary: '#7c3aed', accent: '#8b5cf6', text: '#581c87', background: 'transparent' },
      typography: { title_size: '2xl', subtitle_size: 'base', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-4' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-grad-005',
    name: 'Fire Orange',
    category: 'gradient',
    device: 'mobile',
    description: 'Energetic orange fire gradient',
    popularity: 83,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%)' },
      colors: { primary: '#ffffff', secondary: '#fef3c7', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '2xl', subtitle_size: 'base', button_size: 'lg', font_weight: '700' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-4' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  
  // Card Mobile Templates (16-25)
  {
    id: 'mobile-card-001',
    name: 'Floating Card',
    category: 'card',
    device: 'mobile',
    description: 'Elevated card design with soft shadows',
    popularity: 92,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
      colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#3b82f6', text: '#111827', background: '#ffffff' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-4 py-6', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-card-002',
    name: 'Glass Card',
    category: 'card',
    device: 'mobile',
    description: 'Modern glass morphism design',
    popularity: 89,
    config: {
      layout: 'center-vertical',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      colors: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#ffffff', text: '#ffffff', background: 'rgba(255,255,255,0.1)' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '500' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: true, borders: true, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-card-003',
    name: 'Rounded Card',
    category: 'card',
    device: 'mobile',
    description: 'Friendly rounded corners design',
    popularity: 87,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#f1f5f9' },
      colors: { primary: '#0f172a', secondary: '#64748b', accent: '#06b6d4', text: '#1e293b', background: '#ffffff' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-6 py-6', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-card-004',
    name: 'Soft Shadow',
    category: 'card',
    device: 'mobile',
    description: 'Subtle soft shadow effect',
    popularity: 85,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#fafafa' },
      colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#10b981', text: '#111827', background: '#ffffff' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '500' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'mobile-card-005',
    name: 'Bold Border',
    category: 'card',
    device: 'mobile',
    description: 'Strong border design',
    popularity: 82,
    config: {
      layout: 'center-vertical',
      background: { type: 'solid', value: '#ffffff' },
      colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#f59e0b', text: '#111827', background: '#ffffff' },
      typography: { title_size: 'xl', subtitle_size: 'sm', button_size: 'lg', font_weight: '600' },
      spacing: { container: 'px-6 py-8', elements: 'space-y-6', buttons: 'space-y-3' },
      effects: { shadows: false, borders: true, animations: true, hover_effects: true }
    }
  },
  
  // Hero Mobile Templates (26-30)
  {
    id: 'mobile-hero-001',
    name: 'Full Screen Hero',
    category: 'hero',
    device: 'mobile',
    description: 'Full viewport hero layout',
    popularity: 88,
    config: {
      layout: 'hero-fullscreen',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
      colors: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '3xl', subtitle_size: 'lg', button_size: 'xl', font_weight: '700' },
      spacing: { container: 'px-6 py-16', elements: 'space-y-8', buttons: 'space-y-6' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  }
];

// Desktop templates would follow similar pattern but with different layouts and spacing

const DESKTOP_TEMPLATES: StartScreenTemplate[] = [
  // Desktop Minimalist Templates (1-10)
  {
    id: 'desktop-min-001',
    name: 'Wide Minimal',
    category: 'minimalist',
    device: 'desktop',
    description: 'Spacious minimal design for large screens',
    popularity: 94,
    config: {
      layout: 'split-screen',
      background: { type: 'solid', value: '#ffffff' },
      colors: { primary: '#000000', secondary: '#6b7280', accent: '#3b82f6', text: '#111827', background: '#ffffff' },
      typography: { title_size: '4xl', subtitle_size: 'xl', button_size: 'xl', font_weight: '500' },
      spacing: { container: 'px-12 py-16', elements: 'space-y-12', buttons: 'space-y-6' },
      effects: { shadows: false, borders: true, animations: true, hover_effects: true }
    }
  },
  {
    id: 'desktop-min-002',
    name: 'Center Stage',
    category: 'minimalist',
    device: 'desktop',
    description: 'Centered content with ample whitespace',
    popularity: 91,
    config: {
      layout: 'center-wide',
      background: { type: 'solid', value: '#fafafa' },
      colors: { primary: '#1f2937', secondary: '#9ca3af', accent: '#10b981', text: '#374151', background: '#ffffff' },
      typography: { title_size: '5xl', subtitle_size: '2xl', button_size: '2xl', font_weight: '400' },
      spacing: { container: 'px-16 py-20', elements: 'space-y-16', buttons: 'space-y-8' },
      effects: { shadows: false, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'desktop-min-003',
    name: 'Professional Clean',
    category: 'minimalist',
    device: 'desktop',
    description: 'Corporate professional design',
    popularity: 89,
    config: {
      layout: 'left-aligned',
      background: { type: 'solid', value: '#ffffff' },
      colors: { primary: '#0f172a', secondary: '#64748b', accent: '#0ea5e9', text: '#1e293b', background: '#ffffff' },
      typography: { title_size: '4xl', subtitle_size: 'xl', button_size: 'xl', font_weight: '600' },
      spacing: { container: 'px-20 py-16', elements: 'space-y-12', buttons: 'space-y-6' },
      effects: { shadows: false, borders: true, animations: false, hover_effects: true }
    }
  },
  
  // Desktop Hero Templates (11-20)
  {
    id: 'desktop-hero-001',
    name: 'Hero Section',
    category: 'hero',
    device: 'desktop',
    description: 'Full-width hero design with centered content',
    popularity: 96,
    config: {
      layout: 'hero-center',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      colors: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '6xl', subtitle_size: '2xl', button_size: '2xl', font_weight: '600' },
      spacing: { container: 'px-16 py-32', elements: 'space-y-20', buttons: 'space-y-8' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'desktop-hero-002',
    name: 'Split Hero',
    category: 'hero',
    device: 'desktop',
    description: 'Split screen hero layout',
    popularity: 92,
    config: {
      layout: 'hero-split',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
      colors: { primary: '#ffffff', secondary: '#f8f9fa', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '5xl', subtitle_size: 'xl', button_size: 'xl', font_weight: '700' },
      spacing: { container: 'px-20 py-24', elements: 'space-y-16', buttons: 'space-y-6' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  {
    id: 'desktop-hero-003',
    name: 'Dark Hero',
    category: 'hero',
    device: 'desktop',
    description: 'Dramatic dark hero design',
    popularity: 88,
    config: {
      layout: 'hero-center',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
      colors: { primary: '#ffffff', secondary: '#cbd5e1', accent: '#06b6d4', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '6xl', subtitle_size: '2xl', button_size: '2xl', font_weight: '600' },
      spacing: { container: 'px-16 py-32', elements: 'space-y-20', buttons: 'space-y-8' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  },
  
  // Desktop Gradient Templates (21-30)
  {
    id: 'desktop-grad-001',
    name: 'Ocean Wide',
    category: 'gradient',
    device: 'desktop',
    description: 'Expansive ocean gradient for desktop',
    popularity: 90,
    config: {
      layout: 'center-wide',
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      colors: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#ffffff', text: '#ffffff', background: 'transparent' },
      typography: { title_size: '5xl', subtitle_size: 'xl', button_size: 'xl', font_weight: '500' },
      spacing: { container: 'px-16 py-20', elements: 'space-y-16', buttons: 'space-y-6' },
      effects: { shadows: true, borders: false, animations: true, hover_effects: true }
    }
  }
];

const ALL_TEMPLATES = [...MOBILE_TEMPLATES, ...DESKTOP_TEMPLATES];

export function StartScreenTemplateBuilder({ 
  isOpen, 
  onClose, 
  onTemplateSelect, 
  currentAppName 
}: TemplateBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StartScreenTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [previewMode, setPreviewMode] = useState<'grid' | 'list'>('grid');
  const isMobile = useIsMobile();

  const filteredTemplates = ALL_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDevice = selectedDevice === 'all' || template.device === selectedDevice || template.device === 'both';
    
    return matchesSearch && matchesCategory && matchesDevice;
  }).sort((a, b) => b.popularity - a.popularity);

  const handleTemplateSelect = (template: StartScreenTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
      toast.success(`Applied template: ${selectedTemplate.name}`);
      onClose();
    }
  };

  const TemplatePreview = ({ template }: { template: StartScreenTemplate }) => {
    const background = template.config.background;
    const bgStyle = typeof background === 'string' 
      ? { backgroundColor: background }
      : background.type === 'gradient' 
        ? { background: background.value }
        : { backgroundColor: background.value };

    return (
      <div 
        className="w-full h-48 rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer transition-all hover:border-primary hover:shadow-lg"
        style={bgStyle}
        onClick={() => handleTemplateSelect(template)}
      >
        <div className="h-full flex flex-col items-center justify-center p-4 text-center" style={{ color: template.config.colors.text }}>
          <div className="space-y-2">
            <h3 className="font-semibold" style={{ fontSize: '14px', color: template.config.colors.primary }}>
              {currentAppName || 'App Name'}
            </h3>
            <p className="text-xs opacity-75" style={{ color: template.config.colors.secondary }}>
              Powered by Party On Delivery
            </p>
            <div className="space-y-1">
              <div 
                className="w-20 h-6 rounded text-xs flex items-center justify-center mx-auto"
                style={{ backgroundColor: template.config.colors.accent, color: '#ffffff' }}
              >
                Start
              </div>
              <div 
                className="w-20 h-6 rounded text-xs flex items-center justify-center mx-auto border"
                style={{ borderColor: template.config.colors.accent, color: template.config.colors.accent }}
              >
                Search
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPopularityBadge = (popularity: number) => {
    if (popularity >= 90) return <Badge variant="default" className="bg-green-500"><Star className="h-3 w-3 mr-1" />Popular</Badge>;
    if (popularity >= 80) return <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />Trending</Badge>;
    return <Badge variant="outline"><Heart className="h-3 w-3 mr-1" />Good</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-6 w-6" />
            Start Screen Template Library
            <Badge variant="outline" className="ml-2">{filteredTemplates.length} templates</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="minimalist">Minimal</TabsTrigger>
                <TabsTrigger value="gradient">Gradient</TabsTrigger>
                <TabsTrigger value="card">Card</TabsTrigger>
                <TabsTrigger value="hero">Hero</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={selectedDevice} onValueChange={(value) => setSelectedDevice(value as 'all' | 'mobile' | 'desktop')}>
              <TabsList>
                <TabsTrigger value="all">All Devices</TabsTrigger>
                <TabsTrigger value="mobile"><Smartphone className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="desktop"><Monitor className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(previewMode === 'grid' ? 'list' : 'grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex h-full gap-6">
              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className={`grid gap-4 ${previewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`border rounded-lg p-3 transition-all ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'}`}
                    >
                      <TemplatePreview template={template} />
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          {getPopularityBadge(template.popularity)}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.device === 'mobile' ? <Smartphone className="h-3 w-3" /> : 
                             template.device === 'desktop' ? <Monitor className="h-3 w-3" /> : 
                             <span className="text-xs">Both</span>}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Details Panel */}
              {selectedTemplate && (
                <div className="w-80 border-l pl-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium">Category</Label>
                        <p className="text-sm capitalize">{selectedTemplate.category}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Device</Label>
                        <p className="text-sm capitalize">{selectedTemplate.device}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Popularity</Label>
                        <p className="text-sm">{selectedTemplate.popularity}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Colors</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(selectedTemplate.config.colors).map(([key, color]) => (
                          <div key={key} className="text-center">
                            <div 
                              className="w-8 h-8 rounded border border-gray-200 mx-auto mb-1"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs capitalize">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleApplyTemplate} 
                      className="w-full"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Apply Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          {selectedTemplate && (
            <Button onClick={handleApplyTemplate}>
              <Eye className="h-4 w-4 mr-2" />
              Preview & Apply
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}