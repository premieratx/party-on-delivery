import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Upload, Eye, X, Package } from 'lucide-react';

interface WorkingDeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface DeliveryAppTab {
  name: string;
  collection_handle: string;
  icon: string;
}

const ICON_OPTIONS = [
  { value: '⭐', label: '⭐ Featured' },
  { value: '🥃', label: '🥃 Spirits' },
  { value: '🍺', label: '🍺 Beer' },
  { value: '🍷', label: '🍷 Wine' },
  { value: '🥤', label: '🥤 Seltzers' },
  { value: '🧊', label: '🧊 Mixers' },
  { value: '🍸', label: '🍸 Cocktails' },
  { value: '🎉', label: '🎉 Party Supplies' },
  { value: '🍿', label: '🍿 Snacks' },
  { value: '📦', label: '📦 Products' },
  { value: '🔥', label: '🔥 Hot Deals' },
  { value: '🎊', label: '🎊 Celebration' }
];

export const WorkingDeliveryAppCreator: React.FC<WorkingDeliveryAppCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
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
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();

  // Load initial data if editing
  useEffect(() => {
    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      setLogoUrl(initial.logo_url || '');
      setTabs(initial.collections_config?.tabs || [
        { name: 'Featured', collection_handle: 'featured', icon: '⭐' }
      ]);
      setIsActive(initial.is_active !== false);
      setIsHomepage(initial.is_homepage || false);
    }
  }, [initial]);

  // Auto-generate slug from app name
  useEffect(() => {
    if (appName && !initial) {
      const generatedSlug = appName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setAppSlug(generatedSlug);
    }
  }, [appName, initial]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `delivery-apps/logos/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);

      toast({
        title: 'Upload successful',
        description: 'Logo uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const addTab = () => {
    setTabs([...tabs, { name: '', collection_handle: '', icon: '📦' }]);
  };

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
  };

  const updateTab = (index: number, field: keyof DeliveryAppTab, value: string) => {
    const updated = [...tabs];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-generate collection handle from name
    if (field === 'name') {
      updated[index].collection_handle = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    setTabs(updated);
  };

  const handleSave = async () => {
    if (!appName || !appSlug || !heroHeading) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in app name, slug, and hero heading',
        variant: 'destructive',
      });
      return;
    }

    if (tabs.length === 0 || tabs.some(tab => !tab.name || !tab.collection_handle)) {
      toast({
        title: 'Invalid tabs',
        description: 'Please ensure all tabs have names and collection handles',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: appName,
        app_slug: appSlug,
        main_app_config: {
          hero_heading: heroHeading,
          hero_subheading: heroSubheading,
          hero_scrolling_text: ''
        } as any,
        logo_url: logoUrl,
        collections_config: JSON.parse(JSON.stringify({
          tab_count: tabs.length,
          tabs: tabs
        })),
        is_active: isActive,
        is_homepage: isHomepage,
        updated_at: new Date().toISOString()
      };

      let result;
      if (initial?.id) {
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id)
          .select();
      } else {
        result = await supabase
          .from('delivery_app_variations')
          .insert([appData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Delivery app saved',
        description: initial ? 'Delivery app updated successfully' : 'Delivery app created successfully',
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {initial ? 'Edit Delivery App' : 'Create Delivery App'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>App Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app-name">App Name *</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Enter app name"
                  />
                </div>
                <div>
                  <Label htmlFor="app-slug">URL Slug *</Label>
                  <Input
                    id="app-slug"
                    value={appSlug}
                    onChange={(e) => setAppSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="hero-heading">Hero Heading *</Label>
                <Input
                  id="hero-heading"
                  value={heroHeading}
                  onChange={(e) => setHeroHeading(e.target.value)}
                  placeholder="Main headline for your app"
                />
              </div>
              
              <div>
                <Label htmlFor="hero-subheading">Hero Subheading</Label>
                <Textarea
                  id="hero-subheading"
                  value={heroSubheading}
                  onChange={(e) => setHeroSubheading(e.target.value)}
                  placeholder="Subtitle or description"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogoUrl('')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Product Categories
                <Button type="button" variant="outline" size="sm" onClick={addTab}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tab
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tabs.map((tab, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded">
                  <Input
                    placeholder="Tab name"
                    value={tab.name}
                    onChange={(e) => updateTab(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="collection-handle"
                    value={tab.collection_handle}
                    onChange={(e) => updateTab(index, 'collection_handle', e.target.value)}
                  />
                  <Select
                    value={tab.icon}
                    onValueChange={(value) => updateTab(index, 'icon', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTab(index)}
                    disabled={tabs.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Each tab will display products from the corresponding Shopify collection
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-homepage">Set as Homepage</Label>
                <Switch
                  id="is-homepage"
                  checked={isHomepage}
                  onCheckedChange={setIsHomepage}
                />
              </div>

              {isHomepage && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Setting this app as homepage will disable the current homepage app
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Delivery App'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};