// ⚠️ DEPRECATED COMPONENT - DO NOT USE ⚠️
// This component is deprecated and should not be used.
// Use UnifiedCoverPageEditor instead for all cover page functionality.
// Located at: src/components/admin/UnifiedCoverPageEditor.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { Save, Plus, Trash2, Upload, Eye, X } from 'lucide-react';

interface WorkingCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface ButtonConfig {
  text: string;
  type: 'primary' | 'secondary';
  target: string;
}

export const WorkingCoverPageCreator: React.FC<WorkingCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgVideoUrl, setBgVideoUrl] = useState('');
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { text: 'Order Now', type: 'primary', target: '' }
  ]);
  const [checklist, setChecklist] = useState(['Fast Delivery', 'Premium Quality', 'Licensed & Insured']);
  const [theme, setTheme] = useState('gold');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deliveryApps, setDeliveryApps] = useState<Array<{ id: string; app_name: string; app_slug: string }>>([]);
  
  const { toast } = useToast();

  // Load delivery apps for button targets
  useEffect(() => {
    loadDeliveryApps();
  }, []);

  // Load initial data if editing
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setSlug(initial.slug || '');
      setLogoUrl(initial.logo_url || '');
      setBgImageUrl(initial.bg_image_url || '');
      setBgVideoUrl(initial.bg_video_url || '');
      setButtons(initial.buttons || [{ text: 'Order Now', type: 'primary', target: '' }]);
      setChecklist(initial.checklist || ['Fast Delivery', 'Premium Quality', 'Licensed & Insured']);
      setTheme(initial.theme || 'gold');
      setIsActive(initial.is_active !== false);
      setIsDefault(initial.is_default_homepage || false);
    }
  }, [initial]);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !initial) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, initial]);

  const loadDeliveryApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug')
        .eq('is_active', true);
      
      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Failed to load delivery apps:', error);
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'background-image' | 'background-video') => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-pages/${type}/${Date.now()}-${Math.random()}.${fileExt}`;
      
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

      if (type === 'logo') setLogoUrl(publicUrl);
      if (type === 'background-image') setBgImageUrl(publicUrl);
      if (type === 'background-video') setBgVideoUrl(publicUrl);

      toast({
        title: 'Upload successful',
        description: `${type} uploaded successfully`,
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

  const addButton = () => {
    setButtons([...buttons, { text: '', type: 'secondary', target: '' }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: keyof ButtonConfig, value: any) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, '']);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, value: string) => {
    const updated = [...checklist];
    updated[index] = value;
    setChecklist(updated);
  };

  const handleSave = async () => {
    if (!title || !slug) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in title and slug',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const coverData = {
        slug,
        title,
        subtitle,
        logo_url: logoUrl,
        bg_image_url: bgImageUrl,
        bg_video_url: bgVideoUrl,
        buttons: JSON.parse(JSON.stringify(buttons.filter(b => b.text && b.target))),
        checklist: JSON.parse(JSON.stringify(checklist.filter(item => item.trim()))),
        theme,
        unified_theme: theme,
        styles: {},
        is_active: isActive,
        is_default_homepage: isDefault,
        created_by: 'admin',
        updated_at: new Date().toISOString()
      };

      let result;
      if (initial?.id) {
        result = await supabase
          .from('cover_pages')
          .update(coverData)
          .eq('id', initial.id)
          .select();
      } else {
        result = await supabase
          .from('cover_pages')
          .insert([coverData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Cover page saved',
        description: initial ? 'Cover page updated successfully' : 'Cover page created successfully',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Cover Page' : 'Create Cover Page'}</DialogTitle>
          <DialogDescription id="dialog-description">
            Build and customize cover pages with content management and theme configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter cover page title"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Enter subtitle or description"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo')}
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
                      Upload Logo
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
              </div>

              {/* Background Image Upload */}
              <div>
                <Label>Background Image</Label>
                <div className="flex items-center gap-4">
                  {bgImageUrl && (
                    <img src={bgImageUrl} alt="Background" className="w-24 h-16 object-cover border rounded" />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'background-image')}
                      className="hidden"
                      id="bg-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('bg-image-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Background
                    </Button>
                    {bgImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBgImageUrl('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Background Video Upload */}
              <div>
                <Label>Background Video (Optional)</Label>
                <div className="flex items-center gap-4">
                  {bgVideoUrl && (
                    <video src={bgVideoUrl} className="w-24 h-16 object-cover border rounded" muted />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'background-video')}
                      className="hidden"
                      id="bg-video-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('bg-video-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                    {bgVideoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBgVideoUrl('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Action Buttons
                <Button type="button" variant="outline" size="sm" onClick={addButton}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Button
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {buttons.map((button, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded">
                  <Input
                    placeholder="Button text"
                    value={button.text}
                    onChange={(e) => updateButton(index, 'text', e.target.value)}
                  />
                  <Select
                    value={button.type}
                    onValueChange={(value) => updateButton(index, 'type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={button.target}
                    onValueChange={(value) => updateButton(index, 'target', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select delivery app" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryApps.map((app) => (
                        <SelectItem key={app.id} value={app.app_slug}>
                          {app.app_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Checklist Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Features Checklist
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Feature description"
                    value={item}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="ocean">Ocean</SelectItem>
                    <SelectItem value="forest">Forest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-default">Set as Homepage</Label>
                <Switch
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Cover Page'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};