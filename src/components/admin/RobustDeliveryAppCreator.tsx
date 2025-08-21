import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Eye, RefreshCw, Image } from 'lucide-react';

interface DeliveryAppEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  initial?: any;
}

interface AppState {
  app_name: string;
  app_slug: string;
  hero_heading: string;
  hero_subheading: string;
  logo_url: string;
  background_image_url: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
}

export const RobustDeliveryAppCreator: React.FC<DeliveryAppEditorProps> = ({
  open,
  onOpenChange,
  onSaved,
  initial
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Persistent state that survives tab switches
  const [appState, setAppState] = useState<AppState>(() => {
    // Try to restore from sessionStorage first
    const saved = sessionStorage.getItem('delivery-app-draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved app state');
      }
    }
    
    // Fall back to initial or default
    return initial || {
      app_name: '',
      app_slug: '',
      hero_heading: '',
      hero_subheading: '',
      logo_url: '',
      background_image_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
      is_active: true,
      collections_config: {
        tab_count: 3,
        tabs: [
          { name: 'Beer', collection_handle: 'tailgate-beer', icon: '🍺' },
          { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
          { name: 'Wine', collection_handle: 'wine', icon: '🍷' }
        ]
      }
    };
  });

  // Auto-save to sessionStorage whenever state changes
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      // Save to sessionStorage for persistence
      sessionStorage.setItem('delivery-app-draft', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Load collections on mount
  React.useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) throw error;
      
      if (data?.success && data.collections) {
        setCollections(data.collections);
        toast({
          title: "Collections Loaded",
          description: `Found ${data.collections.length} collections from ${data.source}`,
        });
      } else {
        throw new Error('No collections found');
      }
    } catch (error: any) {
      console.error('Error loading collections:', error);
      toast({
        title: "Collection Load Error",
        description: "Using fallback collections. Please check Shopify connection.",
        variant: "destructive"
      });
      // Use fallback collections
      setCollections([
        { handle: 'spirits', title: 'Premium Spirits', products_count: 120 },
        { handle: 'tailgate-beer', title: 'Tailgate Beer', products_count: 95 },
        { handle: 'cocktail-kits', title: 'Cocktail Kits', products_count: 65 },
        { handle: 'party-supplies', title: 'Party Supplies', products_count: 85 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, field: 'logo_url' | 'background_image_url') => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      updateAppState({ [field]: publicUrl });
      
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    }
  };

  const addTab = () => {
    const newTabs = [
      ...appState.collections_config.tabs,
      { name: 'New Tab', collection_handle: '', icon: '📦' }
    ];
    updateAppState({
      collections_config: {
        ...appState.collections_config,
        tab_count: newTabs.length,
        tabs: newTabs
      }
    });
  };

  const updateTab = (index: number, updates: Partial<typeof appState.collections_config.tabs[0]>) => {
    const newTabs = [...appState.collections_config.tabs];
    newTabs[index] = { ...newTabs[index], ...updates };
    updateAppState({
      collections_config: {
        ...appState.collections_config,
        tabs: newTabs
      }
    });
  };

  const removeTab = (index: number) => {
    const newTabs = appState.collections_config.tabs.filter((_, i) => i !== index);
    updateAppState({
      collections_config: {
        ...appState.collections_config,
        tab_count: newTabs.length,
        tabs: newTabs
      }
    });
  };

  const handleSave = async () => {
    if (!appState.app_name || !appState.app_slug) {
      toast({
        title: "Validation Error",
        description: "Please fill in app name and slug",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const saveData = {
        app_name: appState.app_name,
        app_slug: appState.app_slug,
        is_active: appState.is_active,
        collections_config: appState.collections_config,
        main_app_config: {
          hero_heading: appState.hero_heading,
          hero_subheading: appState.hero_subheading,
          logo_url: appState.logo_url,
          background_image_url: appState.background_image_url,
          primary_color: appState.primary_color,
          secondary_color: appState.secondary_color
        }
      };

      const { data, error } = initial?.id
        ? await supabase
            .from('delivery_app_variations')
            .update(saveData)
            .eq('id', initial.id)
            .select()
            .single()
        : await supabase
            .from('delivery_app_variations')
            .insert(saveData)
            .select()
            .single();

      if (error) throw error;

      // Clear saved draft on successful save
      sessionStorage.removeItem('delivery-app-draft');
      
      toast({
        title: "Success!",
        description: initial?.id ? "Delivery app updated successfully" : "Delivery app created successfully",
      });

      onSaved?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save delivery app",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Clear saved draft on cancel
    sessionStorage.removeItem('delivery-app-draft');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🚚 {initial?.id ? 'Edit' : 'Create'} Delivery App
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadCollections} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Collections
              </Button>
              <Button onClick={handleCancel} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save App'}
              </Button>
            </div>
          </div>
          {collections.length > 0 && (
            <Badge variant="secondary">
              ✅ {collections.length} Collections Available
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">📋 Basic Info</TabsTrigger>
              <TabsTrigger value="collections">🏷️ Collections</TabsTrigger>
              <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="app_name">App Name *</Label>
                    <Input
                      id="app_name"
                      value={appState.app_name}
                      onChange={(e) => updateAppState({ app_name: e.target.value })}
                      placeholder="My Delivery App"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="app_slug">App Slug *</Label>
                    <Input
                      id="app_slug"
                      value={appState.app_slug}
                      onChange={(e) => updateAppState({ 
                        app_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      })}
                      placeholder="my-delivery-app"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero_heading">Hero Heading</Label>
                    <Input
                      id="hero_heading"
                      value={appState.hero_heading}
                      onChange={(e) => updateAppState({ hero_heading: e.target.value })}
                      placeholder="Welcome to Our Store"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero_subheading">Hero Subheading</Label>
                    <Textarea
                      id="hero_subheading"
                      value={appState.hero_subheading}
                      onChange={(e) => updateAppState({ hero_subheading: e.target.value })}
                      placeholder="Premium products delivered to your door"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Logo Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo_url');
                        }}
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload logo</p>
                      </label>
                      {appState.logo_url && (
                        <div className="mt-2">
                          <img src={appState.logo_url} alt="Logo" className="w-20 h-20 object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Background Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="bg-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'background_image_url');
                        }}
                      />
                      <label htmlFor="bg-upload" className="cursor-pointer">
                        <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload background</p>
                      </label>
                      {appState.background_image_url && (
                        <div className="mt-2">
                          <img src={appState.background_image_url} alt="Background" className="w-full h-32 object-cover rounded" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={appState.is_active}
                      onCheckedChange={(checked) => updateAppState({ is_active: checked })}
                    />
                    <Label>App Active</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="collections" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Configure Product Categories</h3>
                <Button onClick={addTab} variant="outline" size="sm">
                  + Add Tab
                </Button>
              </div>

              <div className="space-y-4">
                {appState.collections_config.tabs.map((tab, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>Tab Name</Label>
                        <Input
                          value={tab.name}
                          onChange={(e) => updateTab(index, { name: e.target.value })}
                          placeholder="Beer"
                        />
                      </div>
                      
                      <div>
                        <Label>Collection</Label>
                        <Select
                          value={tab.collection_handle}
                          onValueChange={(value) => updateTab(index, { collection_handle: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((collection) => (
                              <SelectItem key={collection.handle} value={collection.handle}>
                                {collection.title} ({collection.products_count} products)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Icon</Label>
                        <Input
                          value={tab.icon || ''}
                          onChange={(e) => updateTab(index, { icon: e.target.value })}
                          placeholder="🍺"
                          maxLength={2}
                        />
                      </div>

                      <Button
                        onClick={() => removeTab(index)}
                        variant="destructive"
                        size="sm"
                        disabled={appState.collections_config.tabs.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {collections.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-gray-600 mb-4">No collections found. Please check Shopify connection.</p>
                  <Button onClick={loadCollections} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Loading Collections
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">App Preview</h3>
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="text-center mb-6">
                    {appState.logo_url && (
                      <img src={appState.logo_url} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-bold" style={{ color: appState.primary_color }}>
                      {appState.hero_heading || 'Your App Name'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                      {appState.hero_subheading || 'Your app description'}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-6">
                    {appState.collections_config.tabs.map((tab, index) => (
                      <div key={index} className="text-center p-3 bg-white rounded-lg shadow-sm border">
                        <div className="text-2xl mb-1">{tab.icon}</div>
                        <div className="text-sm font-medium">{tab.name}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center text-sm text-gray-500">
                    Products will be loaded from: {appState.collections_config.tabs.map(t => t.collection_handle).join(', ')}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};