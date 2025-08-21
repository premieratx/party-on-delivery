import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Save, Eye, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';

interface EnhancedPostCheckoutCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface PostCheckoutConfig {
  id?: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
  theme: 'success' | 'celebration' | 'premium' | 'elegant';
  variant: 'original' | 'gold' | 'platinum';
  primaryButton: {
    text: string;
    url: string;
    color?: string;
    textColor?: string;
  };
  secondaryButton?: {
    text: string;
    url: string;
    color?: string;
    textColor?: string;
  };
  showOrderDetails: boolean;
  showDeliveryInfo: boolean;
  showShareOptions: boolean;
  is_default: boolean;
}

const THEMES = [
  { value: 'success', label: 'Success Green', color: '#22c55e', preview: 'bg-green-100' },
  { value: 'celebration', label: 'Celebration Gold', color: '#f59e0b', preview: 'bg-amber-100' },
  { value: 'premium', label: 'Premium Blue', color: '#3b82f6', preview: 'bg-blue-100' },
  { value: 'elegant', label: 'Elegant Purple', color: '#8b5cf6', preview: 'bg-purple-100' }
];

const VARIANTS = [
  { value: 'original', label: 'Original', description: 'Clean, modern design' },
  { value: 'gold', label: 'Gold Tier', description: 'Premium gold styling' },
  { value: 'platinum', label: 'Platinum Elite', description: 'Ultra-premium design' }
];

// Mock data for preview
const MOCK_ORDER_ITEMS = [
  { name: 'Premium Wine Selection', price: 89.99, quantity: 1, image: '/placeholder.svg' },
  { name: 'Artisan Cheese Board', price: 45.50, quantity: 1, image: '/placeholder.svg' }
];

const MOCK_DELIVERY_INFO = {
  address: '123 Main St, Austin, TX 78701',
  date: 'Today',
  time: '2:00 PM - 3:00 PM',
  instructions: 'Ring doorbell, leave at door if no answer'
};

export const EnhancedPostCheckoutCreator: React.FC<EnhancedPostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<PostCheckoutConfig>({
    name: 'Order Confirmed',
    slug: '',
    title: 'Order Confirmed!',
    subtitle: "Thank you for your order. We'll get started on it right away.",
    theme: 'success',
    variant: 'original',
    primaryButton: {
      text: 'Continue Shopping',
      url: '/'
    },
    secondaryButton: {
      text: 'Track Order',
      url: '/orders'
    },
    showOrderDetails: true,
    showDeliveryInfo: true,
    showShareOptions: false,
    is_default: false
  });
  
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [standalonePath, setStandalonePath] = useState<string>('');

  useEffect(() => {
    if (initial) {
      const content = initial.content || {};
      setConfig(prev => ({
        ...prev,
        ...initial,
        name: initial.name || 'Order Confirmed',
        title: content.title || 'Order Confirmed!',
        subtitle: content.subtitle || "Thank you for your order. We'll get started on it right away.",
        logoUrl: content.logo_url,
        theme: content.theme || 'success',
        variant: content.variant || 'original',
        primaryButton: {
          text: content.continue_shopping_text || 'Continue Shopping',
          url: content.continue_shopping_url || '/',
          color: content.primary_button_color,
          textColor: content.primary_button_text_color
        },
        secondaryButton: content.manage_order_text ? {
          text: content.manage_order_text,
          url: content.manage_order_url || '/orders',
          color: content.secondary_button_color,
          textColor: content.secondary_button_text_color
        } : undefined,
        showOrderDetails: content.show_order_details ?? true,
        showDeliveryInfo: content.show_delivery_info ?? true,
        showShareOptions: content.show_share_options ?? false
      }));
    }
  }, [initial]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setConfig(prev => ({
      ...prev,
      name,
      slug: !initial ? generateSlug(name) : prev.slug
    }));
  };

  const handleSave = async () => {
    if (!config.name.trim() || !config.slug.trim()) {
      toast.error('Please fill in name and slug');
      return;
    }

    setSaving(true);
    try {
      const postCheckoutData = {
        name: config.name,
        slug: config.slug,
        content: {
          title: config.title,
          subtitle: config.subtitle,
          logo_url: config.logoUrl,
          theme: config.theme,
          variant: config.variant,
          continue_shopping_text: config.primaryButton.text,
          continue_shopping_url: config.primaryButton.url,
          primary_button_color: config.primaryButton.color,
          primary_button_text_color: config.primaryButton.textColor,
          manage_order_text: config.secondaryButton?.text,
          manage_order_url: config.secondaryButton?.url,
          secondary_button_color: config.secondaryButton?.color,
          secondary_button_text_color: config.secondaryButton?.textColor,
          show_order_details: config.showOrderDetails,
          show_delivery_info: config.showDeliveryInfo,
          show_share_options: config.showShareOptions
        },
        is_default: config.is_default,
        updated_at: new Date().toISOString()
      };

      let result;
      if (config.id) {
        result = await supabase
          .from('post_checkout_pages')
          .update(postCheckoutData)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('post_checkout_pages')
          .insert([postCheckoutData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Set standalone path
      if (!config.id && result.data) {
        setStandalonePath(`/post-checkout/${result.data.slug}`);
      } else if (config.id) {
        setStandalonePath(`/post-checkout/${config.slug}`);
      }

      toast.success(config.id ? 'Post-checkout page updated!' : 'Post-checkout page created!');
      onSaved?.();
    } catch (error) {
      console.error('Error saving post-checkout page:', error);
      toast.error('Failed to save post-checkout page');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `post-checkout-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-checkout-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('post-checkout-assets')
        .getPublicUrl(fileName);

      setConfig(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Enhanced Post-Checkout Creator
                <Badge variant="secondary" className="text-xs">
                  Professional Templates
                </Badge>
              </div>
              {standalonePath && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(standalonePath, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="buttons">Actions</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Content Configuration */}
              <TabsContent value="content" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Page Name *</Label>
                      <Input
                        id="name"
                        value={config.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Order Confirmed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={config.slug}
                        onChange={(e) => setConfig(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="order-confirmed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={config.title}
                        onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Order Confirmed!"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Textarea
                        id="subtitle"
                        value={config.subtitle}
                        onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Thank you for your order. We'll get started on it right away."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Logo</Label>
                      <div className="space-y-2">
                        <Input
                          value={config.logoUrl || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://example.com/logo.png or upload below"
                        />
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLogoUpload} 
                              className="hidden" 
                              disabled={uploading} 
                            />
                            <Button type="button" variant="outline" size="sm" disabled={uploading}>
                              {uploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Logo
                                </>
                              )}
                            </Button>
                          </label>
                          {config.logoUrl && (
                            <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.showOrderDetails}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showOrderDetails: checked }))}
                        />
                        <Label>Show Order Details</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.showDeliveryInfo}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showDeliveryInfo: checked }))}
                        />
                        <Label>Show Delivery Information</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.showShareOptions}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showShareOptions: checked }))}
                        />
                        <Label>Show Share Options</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.is_default}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_default: checked }))}
                        />
                        <Label>Set as Default</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Button Configuration */}
              <TabsContent value="buttons" className="space-y-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Primary Button</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={config.primaryButton.text}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              primaryButton: { ...prev.primaryButton, text: e.target.value }
                            }))}
                            placeholder="Continue Shopping"
                          />
                        </div>
                        <div>
                          <Label>Button URL</Label>
                          <Input
                            value={config.primaryButton.url}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              primaryButton: { ...prev.primaryButton, url: e.target.value }
                            }))}
                            placeholder="/"
                          />
                        </div>
                        <div>
                          <Label>Custom Color</Label>
                          <Input
                            value={config.primaryButton.color || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              primaryButton: { ...prev.primaryButton, color: e.target.value }
                            }))}
                            placeholder="#000000"
                          />
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            value={config.primaryButton.textColor || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              primaryButton: { ...prev.primaryButton, textColor: e.target.value }
                            }))}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Secondary Button (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={config.secondaryButton?.text || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              secondaryButton: { 
                                ...prev.secondaryButton, 
                                text: e.target.value,
                                url: prev.secondaryButton?.url || '/orders'
                              }
                            }))}
                            placeholder="Track Order"
                          />
                        </div>
                        <div>
                          <Label>Button URL</Label>
                          <Input
                            value={config.secondaryButton?.url || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              secondaryButton: { 
                                ...prev.secondaryButton,
                                text: prev.secondaryButton?.text || 'Track Order',
                                url: e.target.value
                              }
                            }))}
                            placeholder="/orders"
                          />
                        </div>
                        <div>
                          <Label>Custom Color</Label>
                          <Input
                            value={config.secondaryButton?.color || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              secondaryButton: { 
                                ...prev.secondaryButton,
                                text: prev.secondaryButton?.text || 'Track Order',
                                url: prev.secondaryButton?.url || '/orders',
                                color: e.target.value
                              }
                            }))}
                            placeholder="#000000"
                          />
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            value={config.secondaryButton?.textColor || ''}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              secondaryButton: { 
                                ...prev.secondaryButton,
                                text: prev.secondaryButton?.text || 'Track Order',
                                url: prev.secondaryButton?.url || '/orders',
                                textColor: e.target.value
                              }
                            }))}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Design Configuration */}
              <TabsContent value="design" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Theme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        {THEMES.map((theme) => (
                          <div
                            key={theme.value}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              config.theme === theme.value ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setConfig(prev => ({ ...prev, theme: theme.value as any }))}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className={`w-6 h-6 rounded-full ${theme.preview}`}
                                style={{ backgroundColor: theme.color }}
                              />
                              <span className="font-medium">{theme.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Style Variant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        {VARIANTS.map((variant) => (
                          <div
                            key={variant.value}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              config.variant === variant.value ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setConfig(prev => ({ ...prev, variant: variant.value as any }))}
                          >
                            <div className="font-medium">{variant.label}</div>
                            <div className="text-sm text-muted-foreground">{variant.description}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Preview */}
              <TabsContent value="preview" className="h-[600px]">
                <PremiumOrderComplete
                  title={config.title}
                  subtitle={config.subtitle}
                  logoUrl={config.logoUrl}
                  orderNumber="12345"
                  orderItems={MOCK_ORDER_ITEMS}
                  subtotal={135.49}
                  deliveryFee={5.99}
                  total={141.48}
                  deliveryInfo={MOCK_DELIVERY_INFO}
                  primaryButton={config.primaryButton}
                  secondaryButton={config.secondaryButton}
                  showOrderDetails={config.showOrderDetails}
                  showDeliveryInfo={config.showDeliveryInfo}
                  showShareOptions={config.showShareOptions}
                  theme={config.theme}
                  variant={config.variant}
                  standalone={true}
                  className="rounded-lg overflow-hidden"
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Full Preview
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Page
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <PremiumOrderComplete
            title={config.title}
            subtitle={config.subtitle}
            logoUrl={config.logoUrl}
            orderNumber="12345"
            orderItems={MOCK_ORDER_ITEMS}
            subtotal={135.49}
            deliveryFee={5.99}
            total={141.48}
            deliveryInfo={MOCK_DELIVERY_INFO}
            primaryButton={config.primaryButton}
            secondaryButton={config.secondaryButton}
            showOrderDetails={config.showOrderDetails}
            showDeliveryInfo={config.showDeliveryInfo}
            showShareOptions={config.showShareOptions}
            theme={config.theme}
            variant={config.variant}
            standalone={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};