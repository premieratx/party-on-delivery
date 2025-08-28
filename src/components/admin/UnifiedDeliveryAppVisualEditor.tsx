import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Eye, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Plus,
  Trash2,
  Sparkles,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DELIVERY_THEMES = {
  modern: {
    name: 'Modern',
    colors: { 
      primary: '#3b82f6', 
      secondary: '#1d4ed8', 
      accent: '#1e3a8a',
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      text: '#1e3a8a'
    }
  },
  warm: {
    name: 'Warm',
    colors: { 
      primary: '#f59e0b', 
      secondary: '#d97706', 
      accent: '#b45309',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      text: '#78350f'
    }
  },
  fresh: {
    name: 'Fresh',
    colors: { 
      primary: '#10b981', 
      secondary: '#059669', 
      accent: '#047857',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      text: '#065f46'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#7c3aed', 
      accent: '#6d28d9',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      text: '#581c87'
    }
  }
};

const DEVICE_CONFIGS = {
  mobile: { name: 'Mobile', width: 375, height: 667 },
  tablet: { name: 'Tablet', width: 768, height: 1024 },
  desktop: { name: 'Desktop', width: 1200, height: 800 }
};

interface DeliveryAppTab {
  name: string;
  collection_handle: string;
  icon?: string;
  subheadline_text?: string;
  subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat';
  subheadline_size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  hero_heading?: string;
  hero_subheading?: string;
  hero_scrolling_text?: string;
  hero_image_url?: string;
  hero_video_url?: string;
  logo_url?: string;
  tabs: DeliveryAppTab[];
  background_color?: string;
  text_color?: string;
  is_active?: boolean;
  theme?: string;
  canvas_elements?: any[];
}

interface UnifiedDeliveryAppVisualEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig | null;
  onSaved?: () => void;
}

export const UnifiedDeliveryAppVisualEditor: React.FC<UnifiedDeliveryAppVisualEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  // Device and theme state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  const [selectedTheme, setSelectedTheme] = useState('modern');

  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  
  // Collections loading
  const [availableCollections, setAvailableCollections] = useState<Array<{handle: string, title: string, products_count: number}>>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  
  const [logoUrl, setLogoUrl] = useState('');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>([
    { name: 'Featured', collection_handle: 'featured' },
    { name: 'New Arrivals', collection_handle: 'new-arrivals' }
  ]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!initial?.id;
  const theme = DELIVERY_THEMES[selectedTheme as keyof typeof DELIVERY_THEMES];
  const device = DEVICE_CONFIGS[activeDevice];

  // Load collections when dialog opens
  useEffect(() => {
    const loadCollections = async () => {
      if (!open) return;
      
      setCollectionsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-all-collections');
        if (error) {
          console.error('Error loading collections:', error);
          toast({ 
            title: 'Collections load failed', 
            description: 'Using fallback collections', 
            variant: 'destructive' 
          });
          // Fallback collections
          setAvailableCollections([
            { handle: 'spirits', title: 'Premium Spirits', products_count: 120 },
            { handle: 'tailgate-beer', title: 'Tailgate Beer', products_count: 95 },
            { handle: 'cocktail-kits', title: 'Cocktail Kits', products_count: 65 },
            { handle: 'champagne', title: 'Champagne & Sparkling', products_count: 55 },
            { handle: 'whiskey', title: 'Whiskey & Bourbon', products_count: 75 },
            { handle: 'vodka', title: 'Premium Vodka', products_count: 45 },
            { handle: 'tequila', title: 'Tequila & Mezcal', products_count: 35 }
          ]);
        } else {
          setAvailableCollections(data?.collections || []);
        }
      } catch (err) {
        console.error('Collections loading error:', err);
        toast({ 
          title: 'Error loading collections',
          description: 'Please refresh and try again',
          variant: 'destructive' 
        });
      } finally {
        setCollectionsLoading(false);
      }
    };

    loadCollections();
  }, [open, toast]);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.hero_heading || '');
      setHeroSubheading(initial.hero_subheading || '');
      setHeroImageUrl(initial.hero_image_url || '');
      setHeroVideoUrl(initial.hero_video_url || '');
      
      setLogoUrl(initial.logo_url || '');
      setTabs(initial.tabs || []);
      setBackgroundColor(initial.background_color || '#ffffff');
      setTextColor(initial.text_color || '#000000');
      setIsActive(initial.is_active ?? true);
      setSelectedTheme(initial.theme || 'modern');
      setCanvasElements(initial.canvas_elements || []);
    } else {
      // Reset for new app
      setAppName('');
      setAppSlug('');
      setHeroHeading('Welcome to our Store');
      setHeroSubheading('Discover amazing products');
      setHeroImageUrl('');
      setHeroVideoUrl('');
      
      setLogoUrl('');
      setTabs([
        { name: 'Featured', collection_handle: 'featured' },
        { name: 'New Arrivals', collection_handle: 'new-arrivals' }
      ]);
      setBackgroundColor('#ffffff');
      setTextColor('#000000');
      setIsActive(true);
      setSelectedTheme('modern');
      setCanvasElements([]);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!appName || !appSlug) {
      toast({ title: 'Missing required fields', description: 'App name and slug are required', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const appData = {
        app_name: appName,
        app_slug: appSlug,
        hero_heading: heroHeading,
        hero_subheading: heroSubheading,
        logo_url: logoUrl || null,
        collections_config: JSON.parse(JSON.stringify({
          tab_count: tabs.length,
          tabs: tabs
        })),
        background_color: backgroundColor,
        text_color: textColor,
        is_active: isActive,
        theme: selectedTheme,
        canvas_elements: JSON.parse(JSON.stringify(canvasElements))
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('delivery_app_variations').update(appData).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('delivery_app_variations').insert(appData);
        if (error) throw error;
      }

      toast({ title: 'Saved successfully!' });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({ title: 'Save failed', description: error?.message || 'Unknown error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addTab = () => {
    if (tabs.length < 6) {
      setTabs([...tabs, { name: 'New Tab', collection_handle: 'new-collection' }]);
    }
  };

  const removeTab = (index: number) => {
    setTabs(tabs.filter((_, i) => i !== index));
  };

  const updateTab = (index: number, updates: Partial<DeliveryAppTab>) => {
    const updated = [...tabs];
    updated[index] = { ...updated[index], ...updates };
    setTabs(updated);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `delivery-app-${Date.now()}-logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: 'Please try again or contact support', variant: 'destructive' });
    }
  };

  const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `delivery-app-${Date.now()}-hero.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
      
      // Check if it's a video file
      if (file.type.startsWith('video/')) {
        setHeroVideoUrl(data.publicUrl);
        setHeroImageUrl(''); // Clear image URL when video is set
        toast({ title: 'Hero video uploaded successfully!' });
      } else {
        setHeroImageUrl(data.publicUrl);
        setHeroVideoUrl(''); // Clear video URL when image is set
        toast({ title: 'Hero image uploaded successfully!' });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: 'Please try again or contact support', variant: 'destructive' });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !appName || !appSlug}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Settings */}
            <div className="w-80 border-r flex-shrink-0 bg-background">
              <div className="h-full overflow-y-auto p-4">
                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="tabs">Tabs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label>App Name *</Label>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="My Delivery App"
                      />
                    </div>

                    <div>
                      <Label>App Slug *</Label>
                      <Input
                        value={appSlug}
                        onChange={(e) => setAppSlug(e.target.value)}
                        placeholder="my-delivery-app"
                      />
                    </div>
                    
                    <div>
                      <Label>Hero Heading</Label>
                      <Input
                        value={heroHeading}
                        onChange={(e) => setHeroHeading(e.target.value)}
                        placeholder="Welcome to our Store"
                      />
                    </div>
                    
                    <div>
                      <Label>Hero Subheading</Label>
                      <Textarea
                        value={heroSubheading}
                        onChange={(e) => setHeroSubheading(e.target.value)}
                        placeholder="Discover amazing products"
                        rows={3}
                      />
                    </div>


                    <div>
                      <Label>Logo</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                      {logoUrl && (
                        <div className="mt-2">
                          <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded border" />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Hero Background</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => heroInputRef.current?.click()}
                            className="flex-1"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image/Video/GIF
                          </Button>
                        </div>
                        <div>
                          <Input
                            placeholder="Or enter URL"
                            value={heroImageUrl || heroVideoUrl}
                            onChange={(e) => {
                              const url = e.target.value;
                              if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
                                setHeroVideoUrl(url);
                                setHeroImageUrl('');
                              } else {
                                setHeroImageUrl(url);
                                setHeroVideoUrl('');
                              }
                            }}
                          />
                        </div>
                        {(heroImageUrl || heroVideoUrl) && (
                          <div className="mt-2">
                            {heroVideoUrl ? (
                              <video src={heroVideoUrl} className="w-full h-16 object-cover rounded border" muted />
                            ) : (
                              <img src={heroImageUrl} alt="Hero" className="w-full h-16 object-cover rounded border" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DELIVERY_THEMES).map(([key, theme]) => (
                            <SelectItem key={key} value={key}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Device Preview</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {Object.entries(DEVICE_CONFIGS).map(([key, config]) => (
                          <Button
                            key={key}
                            variant={activeDevice === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                          >
                            {key === 'mobile' && <Smartphone className="w-4 h-4" />}
                            {key === 'tablet' && <Tablet className="w-4 h-4" />}
                            {key === 'desktop' && <Monitor className="w-4 h-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tabs" className="space-y-4">
                    {tabs.map((tab, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">Tab {index + 1}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTab(index)}
                              disabled={tabs.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div>
                            <Label>Tab Name</Label>
                            <Input
                              value={tab.name}
                              onChange={(e) => updateTab(index, { name: e.target.value })}
                              placeholder="Tab Name"
                            />
                          </div>
                          
                          <div>
                            <Label>Collection</Label>
                            {collectionsLoading ? (
                              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Loading collections...
                              </div>
                            ) : (
                              <Select
                                value={tab.collection_handle}
                                onValueChange={(value) => updateTab(index, { collection_handle: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select collection" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCollections.map((collection) => (
                                    <SelectItem key={collection.handle} value={collection.handle}>
                                      <div className="flex justify-between items-center w-full">
                                        <span>{collection.title}</span>
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          {collection.products_count} items
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Input
                              className="mt-1 text-xs"
                              value={tab.collection_handle}
                              onChange={(e) => updateTab(index, { collection_handle: e.target.value })}
                              placeholder="Or enter handle manually"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      onClick={addTab}
                      disabled={tabs.length >= 6}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tab
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="flex-1 bg-gray-50 p-4">
              <div className="text-center text-muted-foreground">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8" style={{ width: device.width, height: device.height, maxWidth: '100%', maxHeight: '100%', margin: '0 auto' }}>
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {device.name} View ({device.width}×{device.height})
                  </p>
                  <div className="space-y-2 text-left">
                    <p><strong>App:</strong> {appName || 'App Name'}</p>
                    <p><strong>Heading:</strong> {heroHeading || 'Hero Heading'}</p>
                    <p><strong>Theme:</strong> {theme.name}</p>
                    <p><strong>Tabs:</strong> {tabs.length} configured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*,video/*,.gif"
          onChange={handleHeroUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};