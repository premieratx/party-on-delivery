import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Eye, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Palette,
  Settings,
  Plus,
  Trash2,
  Move,
  Type,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CANONICAL_DOMAIN } from '@/utils/links';
import Draggable from 'react-draggable';

const DELIVERY_THEMES = {
  modern: {
    name: 'Modern',
    colors: { 
      primary: '#0ea5e9', 
      secondary: '#06b6d4', 
      accent: '#3b82f6',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      text: '#1e293b'
    }
  },
  vibrant: {
    name: 'Vibrant',
    colors: { 
      primary: '#ef4444', 
      secondary: '#f97316', 
      accent: '#eab308',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      text: '#7f1d1d'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#a855f7', 
      accent: '#c084fc',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      text: '#581c87'
    }
  },
  nature: {
    name: 'Nature',
    colors: { 
      primary: '#059669', 
      secondary: '#10b981', 
      accent: '#34d399',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      text: '#064e3b'
    }
  }
};

const DEVICE_SIZES = {
  mobile: { width: 375, height: 667, name: 'Mobile', icon: Smartphone },
  tablet: { width: 768, height: 1024, name: 'Tablet', icon: Tablet },
  desktop: { width: 1200, height: 800, name: 'Desktop', icon: Monitor }
};

interface Tab {
  index: number;
  name: string;
  collection_handle: string;
}

interface OccasionButton {
  title: string;
  collection_handle: string;
  enabled: boolean;
}

interface DeliveryAppConfig {
  app_name: string;
  app_slug: string;
  description: string;
  theme: string;
  logo_url: string;
  logo_size: number;
  logo_vertical_position: number;
  headline: string;
  headline_font_family: string;
  headline_font_color: string;
  headline_vertical_position: number;
  subheadline: string;
  subheadline_font_family: string;
  subheadline_font_color: string;
  subheadline_vertical_position: number;
  background_image_url: string;
  background_opacity: number;
  collections_config: {
    tabs: Tab[];
    occasion_buttons: OccasionButton[];
  };
}

interface UnifiedDeliveryAppCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAppCreated: () => void;
  editingApp?: any;
}

export const UnifiedDeliveryAppCreator: React.FC<UnifiedDeliveryAppCreatorProps> = ({
  isOpen,
  onClose,
  onAppCreated,
  editingApp
}) => {
  const { toast } = useToast();
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_SIZES>('mobile');
  const [activeTab, setActiveTab] = useState('basic');
  
  const [config, setConfig] = useState<DeliveryAppConfig>({
    app_name: '',
    app_slug: '',
    description: '',
    theme: 'modern',
    logo_url: '',
    logo_size: 120,
    logo_vertical_position: 20,
    headline: 'Welcome to Our Delivery App',
    headline_font_family: 'Inter',
    headline_font_color: '#1e293b',
    headline_vertical_position: 35,
    subheadline: 'Fresh flowers delivered to your door',
    subheadline_font_family: 'Inter',
    subheadline_font_color: '#64748b',
    subheadline_vertical_position: 45,
    background_image_url: '',
    background_opacity: 100,
    collections_config: {
      tabs: [
        { index: 0, name: 'All Products', collection_handle: 'all' },
        { index: 1, name: 'Bouquets', collection_handle: 'bouquets' },
        { index: 2, name: 'Plants', collection_handle: 'plants' }
      ],
      occasion_buttons: [
        { title: 'Birthday', collection_handle: 'birthday', enabled: true },
        { title: 'Anniversary', collection_handle: 'anniversary', enabled: true },
        { title: 'Sympathy', collection_handle: 'sympathy', enabled: true },
        { title: 'Get Well', collection_handle: 'get-well', enabled: true }
      ]
    }
  });

  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      if (editingApp) {
        loadEditingAppData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingApp]);

  const loadEditingAppData = () => {
    if (!editingApp) return;
    
    const customBranding = editingApp.custom_branding || {};
    const collectionsConfig = editingApp.collections_config || { tabs: [], occasion_buttons: [] };
    
    setConfig({
      app_name: editingApp.app_name || '',
      app_slug: editingApp.app_slug || '',
      description: editingApp.description || '',
      theme: customBranding.theme || 'modern',
      logo_url: editingApp.logo_url || '',
      logo_size: customBranding.logo_size || 120,
      logo_vertical_position: customBranding.logo_vertical_position || 20,
      headline: customBranding.headline || 'Welcome to Our Delivery App',
      headline_font_family: customBranding.headline_font_family || 'Inter',
      headline_font_color: customBranding.headline_font_color || '#1e293b',
      headline_vertical_position: customBranding.headline_vertical_position || 35,
      subheadline: customBranding.subheadline || 'Fresh flowers delivered to your door',
      subheadline_font_family: customBranding.subheadline_font_family || 'Inter',
      subheadline_font_color: customBranding.subheadline_font_color || '#64748b',
      subheadline_vertical_position: customBranding.subheadline_vertical_position || 45,
      background_image_url: customBranding.background_image_url || '',
      background_opacity: customBranding.background_opacity || 100,
      collections_config: collectionsConfig
    });
  };

  const resetForm = () => {
    setConfig({
      app_name: '',
      app_slug: '',
      description: '',
      theme: 'modern',
      logo_url: '',
      logo_size: 120,
      logo_vertical_position: 20,
      headline: 'Welcome to Our Delivery App',
      headline_font_family: 'Inter',
      headline_font_color: '#1e293b',
      headline_vertical_position: 35,
      subheadline: 'Fresh flowers delivered to your door',
      subheadline_font_family: 'Inter',
      subheadline_font_color: '#64748b',
      subheadline_vertical_position: 45,
      background_image_url: '',
      background_opacity: 100,
      collections_config: {
        tabs: [
          { index: 0, name: 'All Products', collection_handle: 'all' },
          { index: 1, name: 'Bouquets', collection_handle: 'bouquets' },
          { index: 2, name: 'Plants', collection_handle: 'plants' }
        ],
        occasion_buttons: [
          { title: 'Birthday', collection_handle: 'birthday', enabled: true },
          { title: 'Anniversary', collection_handle: 'anniversary', enabled: true },
          { title: 'Sympathy', collection_handle: 'sympathy', enabled: true },
          { title: 'Get Well', collection_handle: 'get-well', enabled: true }
        ]
      }
    });
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_collections')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setAvailableCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleSave = async () => {
    if (!config.app_name.trim() || !config.app_slug.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const customBranding = {
        theme: config.theme,
        logo_size: config.logo_size,
        logo_vertical_position: config.logo_vertical_position,
        headline: config.headline,
        headline_font_family: config.headline_font_family,
        headline_font_color: config.headline_font_color,
        headline_vertical_position: config.headline_vertical_position,
        subheadline: config.subheadline,
        subheadline_font_family: config.subheadline_font_family,
        subheadline_font_color: config.subheadline_font_color,
        subheadline_vertical_position: config.subheadline_vertical_position,
        background_image_url: config.background_image_url,
        background_opacity: config.background_opacity
      };

      const appData = {
        app_name: config.app_name,
        app_slug: config.app_slug,
        description: config.description,
        logo_url: config.logo_url,
        custom_branding: customBranding,
        collections_config: config.collections_config,
        is_active: true
      };

      let result;
      if (editingApp) {
        result = await supabase
          .from('custom_affiliate_sites')
          .update(appData)
          .eq('id', editingApp.id);
      } else {
        result = await supabase
          .from('custom_affiliate_sites')
          .insert([appData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingApp ? "Delivery app updated successfully!" : "Delivery app created successfully!",
      });

      onAppCreated();
      onClose();
    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
    }
  };

  const currentTheme = DELIVERY_THEMES[config.theme as keyof typeof DELIVERY_THEMES];
  const deviceConfig = DEVICE_SIZES[currentDevice];

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleAppNameChange = (value: string) => {
    setConfig(prev => ({
      ...prev,
      app_name: value,
      app_slug: generateSlug(value)
    }));
  };

  const addTab = () => {
    const newTab: Tab = {
      index: config.collections_config.tabs.length,
      name: '',
      collection_handle: ''
    };
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        tabs: [...prev.collections_config.tabs, newTab]
      }
    }));
  };

  const updateTab = (index: number, field: keyof Tab, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        tabs: prev.collections_config.tabs.map((tab, i) => 
          i === index ? { ...tab, [field]: value } : tab
        )
      }
    }));
  };

  const removeTab = (index: number) => {
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        tabs: prev.collections_config.tabs.filter((_, i) => i !== index)
      }
    }));
  };

  const addOccasionButton = () => {
    const newButton: OccasionButton = {
      title: '',
      collection_handle: '',
      enabled: true
    };
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        occasion_buttons: [...prev.collections_config.occasion_buttons, newButton]
      }
    }));
  };

  const updateOccasionButton = (index: number, field: keyof OccasionButton, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        occasion_buttons: prev.collections_config.occasion_buttons.map((button, i) => 
          i === index ? { ...button, [field]: value } : button
        )
      }
    }));
  };

  const removeOccasionButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      collections_config: {
        ...prev.collections_config,
        occasion_buttons: prev.collections_config.occasion_buttons.filter((_, i) => i !== index)
      }
    }));
  };

  const renderPreview = () => {
    const deviceStyle = {
      width: `${deviceConfig.width}px`,
      height: `${deviceConfig.height}px`,
      background: currentTheme.colors.background,
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: currentDevice === 'mobile' ? '24px' : currentDevice === 'tablet' ? '12px' : '8px',
      border: '2px solid #e2e8f0',
      margin: '0 auto'
    };

    return (
      <div style={deviceStyle}>
        {/* Background Image */}
        {config.background_image_url && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${config.background_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: config.background_opacity / 100,
              zIndex: 1
            }}
          />
        )}
        
        {/* Content Overlay */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: '20px' }}>
          {/* Logo */}
          {config.logo_url && (
            <div 
              style={{
                position: 'absolute',
                top: `${config.logo_vertical_position}%`,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3
              }}
            >
              <img
                src={config.logo_url}
                alt="Logo"
                style={{
                  width: `${config.logo_size}px`,
                  height: 'auto',
                  maxWidth: '100%'
                }}
              />
            </div>
          )}

          {/* Headline */}
          <div
            style={{
              position: 'absolute',
              top: `${config.headline_vertical_position}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 3,
              width: '90%'
            }}
          >
            <h1
              style={{
                fontFamily: config.headline_font_family,
                color: config.headline_font_color,
                fontSize: currentDevice === 'mobile' ? '24px' : currentDevice === 'tablet' ? '32px' : '40px',
                fontWeight: 'bold',
                margin: 0,
                lineHeight: 1.2
              }}
            >
              {config.headline}
            </h1>
          </div>

          {/* Subheadline */}
          <div
            style={{
              position: 'absolute',
              top: `${config.subheadline_vertical_position}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 3,
              width: '90%'
            }}
          >
            <p
              style={{
                fontFamily: config.subheadline_font_family,
                color: config.subheadline_font_color,
                fontSize: currentDevice === 'mobile' ? '16px' : currentDevice === 'tablet' ? '18px' : '20px',
                margin: 0,
                lineHeight: 1.4
              }}
            >
              {config.subheadline}
            </p>
          </div>

          {/* Tabs Preview */}
          <div 
            style={{
              position: 'absolute',
              bottom: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              zIndex: 3
            }}
          >
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {config.collections_config.tabs.slice(0, 3).map((tab, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.colors.primary,
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {tab.name || `Tab ${index + 1}`}
                </div>
              ))}
            </div>
            
            {/* Occasion Buttons Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {config.collections_config.occasion_buttons.filter(btn => btn.enabled).slice(0, 4).map((button, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    backgroundColor: currentTheme.colors.secondary,
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}
                >
                  {button.title || `Button ${index + 1}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingApp ? 'Edit Delivery App' : 'Create New Delivery App'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Configuration Panel */}
          <div className="w-1/2 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="app_name">App Name *</Label>
                      <Input
                        id="app_name"
                        value={config.app_name}
                        onChange={(e) => handleAppNameChange(e.target.value)}
                        placeholder="Enter app name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="app_slug">App URL Slug *</Label>
                      <Input
                        id="app_slug"
                        value={config.app_slug}
                        onChange={(e) => setConfig(prev => ({ ...prev, app_slug: e.target.value }))}
                        placeholder="app-url-slug"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {CANONICAL_DOMAIN}/delivery/{config.app_slug}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={config.description}
                        onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your delivery app"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={config.logo_url}
                        onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="styling" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <Select 
                        value={config.theme} 
                        onValueChange={(value) => setConfig(prev => ({ ...prev, theme: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DELIVERY_THEMES).map(([key, theme]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: theme.colors.primary }}
                                />
                                {theme.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={config.headline}
                        onChange={(e) => setConfig(prev => ({ ...prev, headline: e.target.value }))}
                        placeholder="Welcome to Our Delivery App"
                      />
                    </div>

                    <div>
                      <Label htmlFor="headline_font_family">Headline Font</Label>
                      <Select 
                        value={config.headline_font_family} 
                        onValueChange={(value) => setConfig(prev => ({ ...prev, headline_font_family: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="headline_font_color">Headline Color</Label>
                      <Input
                        id="headline_font_color"
                        type="color"
                        value={config.headline_font_color}
                        onChange={(e) => setConfig(prev => ({ ...prev, headline_font_color: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="subheadline">Subheadline</Label>
                      <Input
                        id="subheadline"
                        value={config.subheadline}
                        onChange={(e) => setConfig(prev => ({ ...prev, subheadline: e.target.value }))}
                        placeholder="Fresh flowers delivered to your door"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subheadline_font_family">Subheadline Font</Label>
                      <Select 
                        value={config.subheadline_font_family} 
                        onValueChange={(value) => setConfig(prev => ({ ...prev, subheadline_font_family: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subheadline_font_color">Subheadline Color</Label>
                      <Input
                        id="subheadline_font_color"
                        type="color"
                        value={config.subheadline_font_color}
                        onChange={(e) => setConfig(prev => ({ ...prev, subheadline_font_color: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="background_image_url">Background Image URL</Label>
                      <Input
                        id="background_image_url"
                        value={config.background_image_url}
                        onChange={(e) => setConfig(prev => ({ ...prev, background_image_url: e.target.value }))}
                        placeholder="https://example.com/background.jpg"
                      />
                    </div>

                    <div>
                      <Label>Background Opacity: {config.background_opacity}%</Label>
                      <Slider
                        value={[config.background_opacity]}
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, background_opacity: value }))}
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Logo Size: {config.logo_size}px</Label>
                      <Slider
                        value={[config.logo_size]}
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, logo_size: value }))}
                        max={300}
                        min={50}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Logo Vertical Position: {config.logo_vertical_position}%</Label>
                      <Slider
                        value={[config.logo_vertical_position]}
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, logo_vertical_position: value }))}
                        max={80}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Headline Vertical Position: {config.headline_vertical_position}%</Label>
                      <Slider
                        value={[config.headline_vertical_position]}
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, headline_vertical_position: value }))}
                        max={80}
                        min={10}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Subheadline Vertical Position: {config.subheadline_vertical_position}%</Label>
                      <Slider
                        value={[config.subheadline_vertical_position]}
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, subheadline_vertical_position: value }))}
                        max={80}
                        min={15}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                  <div className="space-y-6">
                    {/* Tabs Configuration */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Navigation Tabs</Label>
                        <Button onClick={addTab} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Tab
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {config.collections_config.tabs.map((tab, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Move className="w-4 h-4 text-muted-foreground" />
                              <Label className="text-sm font-medium">Tab {index + 1}</Label>
                              <Button
                                onClick={() => removeTab(index)}
                                size="sm"
                                variant="ghost"
                                className="ml-auto text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`tab-name-${index}`} className="text-xs">Tab Name</Label>
                                <Input
                                  id={`tab-name-${index}`}
                                  value={tab.name}
                                  onChange={(e) => updateTab(index, 'name', e.target.value)}
                                  placeholder="Tab name"
                                  size="sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`tab-collection-${index}`} className="text-xs">Collection</Label>
                                <Select 
                                  value={tab.collection_handle} 
                                  onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                                >
                                  <SelectTrigger size="sm">
                                    <SelectValue placeholder="Select collection" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Products</SelectItem>
                                    {availableCollections.map((collection) => (
                                      <SelectItem key={collection.id} value={collection.handle}>
                                        {collection.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Occasion Buttons Configuration */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Occasion Buttons</Label>
                        <Button onClick={addOccasionButton} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Button
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {config.collections_config.occasion_buttons.map((button, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={button.enabled ? "default" : "secondary"}>
                                {button.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Label className="text-sm font-medium">Button {index + 1}</Label>
                              <Switch
                                checked={button.enabled}
                                onCheckedChange={(checked) => updateOccasionButton(index, 'enabled', checked)}
                                className="ml-auto"
                              />
                              <Button
                                onClick={() => removeOccasionButton(index)}
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`button-title-${index}`} className="text-xs">Button Title</Label>
                                <Input
                                  id={`button-title-${index}`}
                                  value={button.title}
                                  onChange={(e) => updateOccasionButton(index, 'title', e.target.value)}
                                  placeholder="Button title"
                                  size="sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`button-collection-${index}`} className="text-xs">Collection</Label>
                                <Select 
                                  value={button.collection_handle} 
                                  onValueChange={(value) => updateOccasionButton(index, 'collection_handle', value)}
                                >
                                  <SelectTrigger size="sm">
                                    <SelectValue placeholder="Select collection" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableCollections.map((collection) => (
                                      <SelectItem key={collection.id} value={collection.handle}>
                                        {collection.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="flex items-center gap-2">
                {Object.entries(DEVICE_SIZES).map(([key, device]) => {
                  const IconComponent = device.icon;
                  return (
                    <Button
                      key={key}
                      variant={currentDevice === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentDevice(key as keyof typeof DEVICE_SIZES)}
                    >
                      <IconComponent className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="min-h-full flex items-center justify-center p-4">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="min-w-[100px]">
            <Save className="w-4 h-4 mr-2" />
            {editingApp ? 'Update App' : 'Create App'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};