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
import { Save, Upload, Eye, X, ShoppingCart, Plus, Trash2 } from 'lucide-react';

interface WorkingPostCheckoutCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface SocialMediaLink {
  platform: string;
  url: string;
  icon: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'website', label: 'Website', icon: '🌐' }
];

export const WorkingPostCheckoutCreator: React.FC<WorkingPostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [pageName, setPageName] = useState('');
  const [slug, setSlug] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [theme, setTheme] = useState('gold');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();

  // Load initial data if editing
  useEffect(() => {
    if (initial) {
      setPageName(initial.page_name || '');
      setSlug(initial.slug || '');
      setHeroTitle(initial.hero_title || '');
      setHeroSubtitle(initial.hero_subtitle || '');
      setLogoUrl(initial.logo_url || '');
      setBackgroundImageUrl(initial.background_image_url || '');
      setThankYouMessage(initial.thank_you_message || '');
      setDeliveryInstructions(initial.delivery_instructions || '');
      setSocialLinks(initial.social_links || []);
      setTheme(initial.theme || 'gold');
      setIsActive(initial.is_active !== false);
      setIsDefault(initial.is_default || false);
    }
  }, [initial]);

  // Auto-generate slug from page name
  useEffect(() => {
    if (pageName && !initial) {
      const generatedSlug = pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [pageName, initial]);

  const uploadFile = async (file: File, type: 'logo' | 'background') => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `post-checkout/${type}/${Date.now()}-${Math.random()}.${fileExt}`;
      
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
      if (type === 'background') setBackgroundImageUrl(publicUrl);

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

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: 'instagram', url: '', icon: '📸' }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialMediaLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update icon when platform changes
    if (field === 'platform') {
      const platformData = SOCIAL_PLATFORMS.find(p => p.value === value);
      if (platformData) {
        updated[index].icon = platformData.icon;
      }
    }
    
    setSocialLinks(updated);
  };

  const handleSave = async () => {
    if (!pageName || !slug || !heroTitle) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in page name, slug, and hero title',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        name: pageName,
        slug,
        bg_image_url: backgroundImageUrl,
        logo_url: logoUrl,
        content: {
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          thank_you_message: thankYouMessage,
          delivery_instructions: deliveryInstructions,
          social_links: socialLinks.filter(link => link.url)
        } as any,
        theme,
        is_active: isActive,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      };

      let result;
      if (initial?.id) {
        result = await supabase
          .from('post_checkout_pages')
          .update(pageData)
          .eq('id', initial.id)
          .select();
      } else {
        result = await supabase
          .from('post_checkout_pages')
          .insert([pageData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Post-checkout page saved',
        description: initial ? 'Page updated successfully' : 'Page created successfully',
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
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {initial ? 'Edit Post-Checkout Page' : 'Create Post-Checkout Page'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="page-name">Page Name *</Label>
                  <Input
                    id="page-name"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="Enter page name"
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
                <Label htmlFor="hero-title">Hero Title *</Label>
                <Input
                  id="hero-title"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Thank you for your order!"
                />
              </div>
              
              <div>
                <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Your order has been confirmed and will be delivered soon"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Assets */}
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
                  {backgroundImageUrl && (
                    <img src={backgroundImageUrl} alt="Background" className="w-24 h-16 object-cover border rounded" />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'background')}
                      className="hidden"
                      id="bg-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('bg-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Background
                    </Button>
                    {backgroundImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBackgroundImageUrl('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="thank-you-message">Thank You Message</Label>
                <Textarea
                  id="thank-you-message"
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Thank you for choosing our service..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
                <Textarea
                  id="delivery-instructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="What to expect with your delivery..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Social Media Links
                <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded">
                  <Select
                    value={link.platform}
                    onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.icon} {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
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
                <Label htmlFor="is-default">Set as Default</Label>
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
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Page'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};