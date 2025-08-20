import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Eye,
  Package,
  Settings,
  Palette,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryAppTab {
  name: string;
  collection_handle: string;
  icon?: string;
}

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  main_app_config: {
    hero_heading: string;
    hero_subheading: string;
  };
  logo_url?: string;
  collections_config: {
    tab_count: number;
    tabs: DeliveryAppTab[];
  };
  is_active: boolean;
  is_homepage: boolean;
}

interface DeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig;
  onSaved?: () => void;
  onBack?: () => void;
}

const POPULAR_COLLECTIONS = [
  { handle: 'spirits', name: 'Spirits', icon: '🥃' },
  { handle: 'beer', name: 'Beer', icon: '🍺' },
  { handle: 'wine', name: 'Wine', icon: '🍷' },
  { handle: 'seltzers', name: 'Seltzers', icon: '🥤' },
  { handle: 'mixers', name: 'Mixers & N/A', icon: '🧊' },
  { handle: 'cocktails', name: 'Cocktails', icon: '🍸' },
  { handle: 'party-supplies', name: 'Party Supplies', icon: '🎉' },
  { handle: 'snacks', name: 'Snacks', icon: '🍿' }
];

export const DeliveryAppCreator: React.FC<DeliveryAppCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved,
  onBack
}) => {
  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>([
    { name: 'Featured', collection_handle: 'featured', icon: '⭐' },
    { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
    { name: 'Beer', collection_handle: 'beer', icon: '🍺' }
  ]);
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initial?.id;

  // Initialize form with existing data
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      setLogoUrl(initial.logo_url || '');
      setTabs(initial.collections_config?.tabs || []);
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_homepage ?? false);
    } else {
      // Reset for new app
      setAppName('');
      setAppSlug('');
      setHeroHeading('');
      setHeroSubheading('');
      setLogoUrl('');
      setTabs([
        { name: 'Featured', collection_handle: 'featured', icon: '⭐' },
        { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
        { name: 'Beer', collection_handle: 'beer', icon: '🍺' }
      ]);
      setIsActive(true);
      setIsHomepage(false);
    }
  }, [open, initial]);

  // Auto-generate slug from app name
  useEffect(() => {
    if (!isEditing && appName) {
      const slug = appName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setAppSlug(slug);
    }
  }, [appName, isEditing]);

  const handleSave = async () => {
    if (!appName.trim() || !appSlug.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'App name and slug are required',
        variant: 'destructive'
      });
      return;
    }

    if (tabs.length === 0) {
      toast({
        title: 'No tabs configured',
        description: 'At least one tab is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: appName.trim(),
        app_slug: appSlug.trim(),
        main_app_config: {
          hero_heading: heroHeading.trim(),
          hero_subheading: heroSubheading.trim()
        } as any,
        logo_url: logoUrl || null,
        collections_config: {
          tab_count: tabs.length,
          tabs: tabs
        } as any,
        is_active: isActive,
        is_homepage: isHomepage
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'App updated successfully!' });
      } else {
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert(appData);
        if (error) throw error;
        toast({ title: 'App created successfully!' });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addTab = () => {
    if (tabs.length < 8) {
      setTabs([...tabs, { name: 'New Tab', collection_handle: 'new-collection', icon: '📦' }]);
    }
  };

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
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
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const useCollectionSuggestion = (collection: any) => {
    const emptyTabIndex = tabs.findIndex(tab => 
      tab.collection_handle === 'new-collection' || !tab.collection_handle.trim()
    );
    
    if (emptyTabIndex >= 0) {
      updateTab(emptyTabIndex, {
        name: collection.name,
        collection_handle: collection.handle,
        icon: collection.icon
      });
    } else {
      // Add as new tab if space available
      if (tabs.length < 8) {
        setTabs([...tabs, {
          name: collection.name,
          collection_handle: collection.handle,
          icon: collection.icon
        }]);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    Configure your delivery app with custom tabs and collections
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onBack && (
                  <Button onClick={onBack} variant="outline" size="sm">
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !appName || !appSlug}
                  size="sm"
                  className="min-w-[100px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save App'}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="basic" className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="tabs" className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Tabs & Collections
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>App Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="app-name">App Name *</Label>
                          <Input
                            id="app-name"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="My Delivery App"
                          />
                        </div>
                        <div>
                          <Label htmlFor="app-slug">App Slug *</Label>
                          <Input
                            id="app-slug"
                            value={appSlug}
                            onChange={(e) => setAppSlug(e.target.value)}
                            placeholder="my-delivery-app"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="hero-heading">Hero Heading</Label>
                        <Input
                          id="hero-heading"
                          value={heroHeading}
                          onChange={(e) => setHeroHeading(e.target.value)}
                          placeholder="Austin's Premier Party Supply Delivery"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hero-subheading">Hero Subheading</Label>
                        <Textarea
                          id="hero-subheading"
                          value={heroSubheading}
                          onChange={(e) => setHeroSubheading(e.target.value)}
                          placeholder="Satisfaction Guaranteed, On-Time Delivery"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>App Logo</Label>
                        <div className="flex gap-3 mt-2">
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
                          <div className="mt-3">
                            <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded border p-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                          />
                          <Label htmlFor="is-active">App Active</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-homepage"
                            checked={isHomepage}
                            onCheckedChange={setIsHomepage}
                          />
                          <Label htmlFor="is-homepage">Set as Homepage</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tabs & Collections */}
              <TabsContent value="tabs" className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Configure Tabs ({tabs.length})</h3>
                      <p className="text-sm text-muted-foreground">
                        Set up your delivery app tabs and assign Shopify collections
                      </p>
                    </div>
                    <Button onClick={addTab} disabled={tabs.length >= 8}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tab
                    </Button>
                  </div>

                  {/* Collection Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Popular Collections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_COLLECTIONS.map((collection) => (
                          <Button
                            key={collection.handle}
                            variant="outline"
                            size="sm"
                            onClick={() => useCollectionSuggestion(collection)}
                            className="flex items-center gap-2"
                          >
                            <span>{collection.icon}</span>
                            {collection.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tab Configuration */}
                  <div className="grid gap-4">
                    {tabs.map((tab, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Tab {index + 1}</Badge>
                              <span className="text-lg">{tab.icon}</span>
                              <span className="font-medium">{tab.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTab(index)}
                              disabled={tabs.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Tab Name</Label>
                              <Input
                                value={tab.name}
                                onChange={(e) => updateTab(index, { name: e.target.value })}
                                placeholder="Tab Name"
                              />
                            </div>
                            <div>
                              <Label>Collection Handle</Label>
                              <Input
                                value={tab.collection_handle}
                                onChange={(e) => updateTab(index, { collection_handle: e.target.value })}
                                placeholder="collection-handle"
                              />
                            </div>
                            <div>
                              <Label>Icon (Emoji)</Label>
                              <Input
                                value={tab.icon || ''}
                                onChange={(e) => updateTab(index, { icon: e.target.value })}
                                placeholder="📦"
                                maxLength={2}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="flex-1 p-6">
                <div className="h-full flex items-center justify-center">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center space-y-4">
                      {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="h-12 mx-auto" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{heroHeading || appName}</h3>
                        <p className="text-muted-foreground">{heroSubheading}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {tabs.map((tab, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <span>{tab.icon}</span>
                            {tab.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>App Slug: /{appSlug}</div>
                        <div>Status: {isActive ? 'Active' : 'Inactive'}</div>
                        {isHomepage && <div className="text-primary font-medium">Set as Homepage</div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryAppCreator;