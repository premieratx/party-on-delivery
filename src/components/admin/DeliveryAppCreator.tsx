import React, { useState, useEffect } from 'react';
import { AdminFormLayout, AdminFormSection } from './AdminFormLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Upload } from 'lucide-react';

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
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  hero_heading: string;
  hero_subheading: string;
  scrolling_text: string;
  hero_background_color?: string;
  is_homepage: boolean;
  is_active: boolean;
  tabs: Tab[];
  occasion_buttons: OccasionButton[];
}

interface DeliveryAppCreatorProps {
  onBack?: () => void;
  initial?: DeliveryAppConfig | null;
  onSaved?: () => void;
}

export const DeliveryAppCreator: React.FC<DeliveryAppCreatorProps> = ({
  onBack,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<DeliveryAppConfig>({
    app_name: '',
    app_slug: '',
    hero_heading: 'Alcohol Delivery Made Easy',
    hero_subheading: 'Beer, Wine, Spirits & More Delivered to Your Door',
    scrolling_text: 'Fast Delivery • Premium Selection • Competitive Prices',
    hero_background_color: '#ffffff',
    is_homepage: false,
    is_active: true,
    tabs: [
      { index: 0, name: 'Beer', collection_handle: 'beer-collection' },
      { index: 1, name: 'Wine', collection_handle: 'wine-collection' },
      { index: 2, name: 'Spirits', collection_handle: 'spirits-collection' }
    ],
    occasion_buttons: [
      { title: 'Tailgate', collection_handle: 'tailgate-beer', enabled: true },
      { title: 'Bachelorette', collection_handle: 'bachelorette-booze', enabled: true }
    ]
  });

  const [availableCollections, setAvailableCollections] = useState<any[]>([]);  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditing = !!initial?.id;

  useEffect(() => {
    loadCollections();
    if (initial) {
      setConfig(initial);
    }
  }, [initial]);

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      if (error) throw error;
      if (data?.success && data.collections) {
        setAvailableCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setConfig(prev => ({ ...prev, app_slug: slug }));
  };

  const addTab = () => {
    if (config.tabs.length < 8) {
      setConfig(prev => ({
        ...prev,
        tabs: [...prev.tabs, { 
          index: prev.tabs.length, 
          name: 'New Tab', 
          collection_handle: availableCollections[0]?.handle || 'beer' 
        }]
      }));
    }
  };

  const removeTab = (index: number) => {
    if (config.tabs.length > 1) {
      setConfig(prev => ({
        ...prev,
        tabs: prev.tabs.filter((_, i) => i !== index).map((tab, i) => ({ ...tab, index: i }))
      }));
    }
  };

  const updateTab = (index: number, field: keyof Tab, value: string) => {
    setConfig(prev => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => 
        i === index ? { ...tab, [field]: value } : tab
      )
    }));
  };

  const addOccasionButton = () => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: [...prev.occasion_buttons, { 
        title: 'New Occasion', 
        collection_handle: availableCollections[0]?.handle || 'beer',
        enabled: true 
      }]
    }));
  };

  const removeOccasionButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: prev.occasion_buttons.filter((_, i) => i !== index)
    }));
  };

  const updateOccasionButton = (index: number, field: keyof OccasionButton, value: any) => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: prev.occasion_buttons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const handleSave = async () => {
    if (!config.app_name || !config.app_slug) {
      toast({
        title: "Error",
        description: "App name and slug are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: config.app_name,
        app_slug: config.app_slug,
        logo_url: config.logo_url,
        is_homepage: config.is_homepage,
        is_active: config.is_active,
        collections_config: JSON.parse(JSON.stringify({
          tabs: config.tabs,
          tab_count: config.tabs.length
        })),
        main_app_config: JSON.parse(JSON.stringify({
          hero_heading: config.hero_heading,
          hero_subheading: config.hero_subheading,
          scrolling_text: config.scrolling_text,
          hero_background_color: config.hero_background_color,
          occasion_buttons: config.occasion_buttons
        }))
      };

      let result;
      if (isEditing && config.id) {
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('delivery_app_variations')
          .insert(appData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Delivery app ${isEditing ? 'updated' : 'created'} successfully`,
      });

      onSaved?.();

    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormLayout
      title={isEditing ? 'Edit Delivery App' : 'Create Delivery App'}
      subtitle="Configure your delivery application settings and product tabs"
      onBack={onBack}
      onSave={handleSave}
      saving={saving}
      canSave={!!config.app_name && !!config.app_slug}
    >
      <AdminFormSection
        title="Basic Information"
        description="Set up the basic details for your delivery app"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="app_name">App Name *</Label>
            <Input
              id="app_name"
              value={config.app_name}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, app_name: e.target.value }));
                generateSlug(e.target.value);
              }}
              placeholder="My Delivery App"
            />
          </div>
          <div>
            <Label htmlFor="app_slug">App Slug *</Label>
            <Input
              id="app_slug"
              value={config.app_slug}
              onChange={(e) => setConfig(prev => ({ ...prev, app_slug: e.target.value }))}
              placeholder="my-delivery-app"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="logo_url">Logo URL</Label>
          <div className="flex gap-2">
            <Input
              id="logo_url"
              value={config.logo_url || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
              className="flex-1"
            />
            <Button variant="outline">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_homepage"
              checked={config.is_homepage}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_homepage: checked }))}
            />
            <Label htmlFor="is_homepage">Set as Homepage</Label>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Hero Section"
        description="Configure the main hero section of your delivery app"
      >
        <div>
          <Label htmlFor="hero_heading">Hero Heading</Label>
          <Input
            id="hero_heading"
            value={config.hero_heading}
            onChange={(e) => setConfig(prev => ({ ...prev, hero_heading: e.target.value }))}
            placeholder="Alcohol Delivery Made Easy"
          />
        </div>

        <div>
          <Label htmlFor="hero_subheading">Hero Subheading</Label>
          <Input
            id="hero_subheading"
            value={config.hero_subheading}
            onChange={(e) => setConfig(prev => ({ ...prev, hero_subheading: e.target.value }))}
            placeholder="Beer, Wine, Spirits & More Delivered to Your Door"
          />
        </div>

        <div>
          <Label htmlFor="scrolling_text">Scrolling Text</Label>
          <Input
            id="scrolling_text"
            value={config.scrolling_text}
            onChange={(e) => setConfig(prev => ({ ...prev, scrolling_text: e.target.value }))}
            placeholder="Fast Delivery • Premium Selection • Competitive Prices"
          />
        </div>

        <div>
          <Label htmlFor="hero_background_color">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="hero_background_color"
              type="color"
              value={config.hero_background_color}
              onChange={(e) => setConfig(prev => ({ ...prev, hero_background_color: e.target.value }))}
              className="w-16"
            />
            <Input
              value={config.hero_background_color}
              onChange={(e) => setConfig(prev => ({ ...prev, hero_background_color: e.target.value }))}
              className="flex-1"
            />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Product Tabs"
        description="Configure the product category tabs for your delivery app"
      >
        <div className="space-y-4">
          {config.tabs.map((tab, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={tab.name}
                  onChange={(e) => updateTab(index, 'name', e.target.value)}
                  placeholder="Tab Name"
                />
                <Select
                  value={tab.collection_handle}
                  onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCollections.map((collection) => (
                      <SelectItem key={collection.handle} value={collection.handle}>
                        {collection.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeTab(index)}
                disabled={config.tabs.length <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addTab}
            disabled={config.tabs.length >= 8}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tab
          </Button>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Occasion Buttons"
        description="Configure special occasion buttons for quick product access"
      >
        <div className="space-y-4">
          {config.occasion_buttons.map((button, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={button.title}
                  onChange={(e) => updateOccasionButton(index, 'title', e.target.value)}
                  placeholder="Button Title"
                />
                <Select
                  value={button.collection_handle}
                  onValueChange={(value) => updateOccasionButton(index, 'collection_handle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCollections.map((collection) => (
                      <SelectItem key={collection.handle} value={collection.handle}>
                        {collection.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Switch
                checked={button.enabled}
                onCheckedChange={(checked) => updateOccasionButton(index, 'enabled', checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeOccasionButton(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addOccasionButton}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Occasion Button
          </Button>
        </div>
      </AdminFormSection>
    </AdminFormLayout>
  );
};