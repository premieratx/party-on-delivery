import React, { useState, useEffect } from 'react';
import { DeliveryAppCanvasEditor } from './DeliveryAppCanvasEditor';
import { FigmaTemplateLibrary } from './FigmaTemplateLibrary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState('templates');
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

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      toast({
        title: "Success",
        description: `Delivery app ${isEditing ? 'updated' : 'created'} successfully`,
      });

      sonnerToast.success(`Delivery app ${isEditing ? 'updated' : 'created'} successfully!`);
      onSaved?.();

    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
      sonnerToast.error('Failed to save delivery app');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    // Apply template data to config
    if (template.design_data) {
      const newConfig = {
        ...config,
        hero_background_color: template.design_data.colors?.background || config.hero_background_color,
        hero_heading: template.design_data.heading || config.hero_heading,
        hero_subheading: template.design_data.subheading || config.hero_subheading,
      };
      setConfig(newConfig);
      setActiveTab('canvas');
      sonnerToast.success(`Template "${template.name}" applied!`);
    }
  };

  if (activeTab === 'canvas') {
    return (
      <div className="h-screen">
        <div className="absolute top-4 left-4 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="templates">📐 Figma Templates</TabsTrigger>
              <TabsTrigger value="canvas">🎨 Canvas Editor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <DeliveryAppCanvasEditor
          config={config}
          onChange={setConfig}
          onSave={handleSave}
          saving={saving}
          availableCollections={availableCollections}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Delivery App' : 'Create Delivery App'}
            </h1>
            <p className="text-muted-foreground">
              Choose a template to get started quickly
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="templates">📐 Figma Templates</TabsTrigger>
              <TabsTrigger value="canvas">🎨 Canvas Editor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          <FigmaTemplateLibrary
            category="delivery_app"
            onSelectTemplate={handleTemplateSelect}
          />
        </div>
      </div>
    </div>
  );
};