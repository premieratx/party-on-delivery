import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FontSelector } from '@/components/ui/font-selector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Star, Plus, X, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
}

interface PostCheckoutScreen {
  id?: string;
  screen_name: string;
  screen_slug: string;
  main_title: string;
  subtitle: string;
  thank_you_message: string;
  order_tracking_text: string;
  contact_info: any;
  social_links: any;
  additional_content: string;
  background_image_url: string;
  background_video_url: string;
  logo_url: string;
  custom_css: string;
  cta_buttons: Array<{
    text: string;
    url: string;
    style: FontStyle;
    variant: string;
  }>;
  styles: {
    main_title: FontStyle;
    subtitle: FontStyle;
    thank_you_message: FontStyle;
    order_tracking_text: FontStyle;
    additional_content: FontStyle;
  };
  is_active: boolean;
  is_default: boolean;
}

const defaultFontStyle: FontStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000'
};

export const FullFeaturedPostCheckoutCreator: React.FC = () => {
  const [postCheckoutScreens, setPostCheckoutScreens] = useState<PostCheckoutScreen[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<PostCheckoutScreen | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<PostCheckoutScreen>({
    screen_name: '',
    screen_slug: '',
    main_title: 'Thank You for Your Order!',
    subtitle: 'Your order has been confirmed',
    thank_you_message: 'We appreciate your business and look forward to serving you again.',
    order_tracking_text: 'You will receive tracking information via email once your order ships.',
    contact_info: {},
    social_links: {},
    additional_content: '',
    background_image_url: '',
    background_video_url: '',
    logo_url: '',
    custom_css: '',
    cta_buttons: [],
    styles: {
      main_title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
      subtitle: { ...defaultFontStyle, fontSize: 20 },
      thank_you_message: { ...defaultFontStyle, fontSize: 16 },
      order_tracking_text: { ...defaultFontStyle, fontSize: 14 },
      additional_content: { ...defaultFontStyle, fontSize: 16 }
    },
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    loadPostCheckoutScreens();
  }, []);

  const loadPostCheckoutScreens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_checkout_screens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostCheckoutScreens(data || []);
    } catch (error) {
      console.error('Error loading post-checkout screens:', error);
      toast.error('Failed to load post-checkout screens');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.screen_name || !formData.screen_slug) {
      toast.error('Screen name and slug are required');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        screen_name: formData.screen_name,
        main_title: formData.main_title,
        subtitle: formData.subtitle,
        thank_you_message: formData.thank_you_message,
        order_tracking_text: formData.order_tracking_text,
        contact_info: formData.contact_info,
        social_links: formData.social_links,
        additional_content: formData.additional_content,
        background_image_url: formData.background_image_url,
        background_video_url: formData.background_video_url,
        logo_url: formData.logo_url,
        custom_css: formData.custom_css,
        cta_buttons: formData.cta_buttons,
        styles: formData.styles,
        is_active: formData.is_active,
        is_default: formData.is_default
      };
      
      if (selectedScreen?.id) {
        // Update existing
        const { error } = await supabase
          .from('post_checkout_screens')
          .update(updateData)
          .eq('id', selectedScreen.id);

        if (error) throw error;
        toast.success('Post-checkout screen updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert({
            ...updateData,
            screen_slug: formData.screen_slug
          });

        if (error) throw error;
        toast.success('Post-checkout screen created successfully');
      }

      loadPostCheckoutScreens();
      resetForm();
    } catch (error) {
      console.error('Error saving post-checkout screen:', error);
      toast.error('Failed to save post-checkout screen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post-checkout screen?')) return;

    try {
      const { error } = await supabase
        .from('post_checkout_screens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Post-checkout screen deleted successfully');
      loadPostCheckoutScreens();
      
      if (selectedScreen?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting post-checkout screen:', error);
      toast.error('Failed to delete post-checkout screen');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_checkout_screens')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Set as default post-checkout screen');
      loadPostCheckoutScreens();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set as default');
    }
  };

  const selectScreen = (screen: PostCheckoutScreen) => {
    setSelectedScreen(screen);
    setFormData({ ...screen });
  };

  const resetForm = () => {
    setSelectedScreen(null);
    setFormData({
      screen_name: '',
      screen_slug: '',
      main_title: 'Thank You for Your Order!',
      subtitle: 'Your order has been confirmed',
      thank_you_message: 'We appreciate your business and look forward to serving you again.',
      order_tracking_text: 'You will receive tracking information via email once your order ships.',
      contact_info: {},
      social_links: {},
      additional_content: '',
      background_image_url: '',
      background_video_url: '',
      logo_url: '',
      custom_css: '',
      cta_buttons: [],
      styles: {
        main_title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
        subtitle: { ...defaultFontStyle, fontSize: 20 },
        thank_you_message: { ...defaultFontStyle, fontSize: 16 },
        order_tracking_text: { ...defaultFontStyle, fontSize: 14 },
        additional_content: { ...defaultFontStyle, fontSize: 16 }
      },
      is_active: true,
      is_default: false
    });
  };

  const addCTAButton = () => {
    setFormData({
      ...formData,
      cta_buttons: [...formData.cta_buttons, { 
        text: 'Shop Again', 
        url: '/', 
        style: { ...defaultFontStyle },
        variant: 'default'
      }]
    });
  };

  const updateCTAButton = (index: number, updates: any) => {
    const newButtons = [...formData.cta_buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setFormData({ ...formData, cta_buttons: newButtons });
  };

  const removeCTAButton = (index: number) => {
    setFormData({
      ...formData,
      cta_buttons: formData.cta_buttons.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="container mx-auto p-6 max-h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Screens List */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              Post-Checkout Screens
              <Button onClick={resetForm} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {postCheckoutScreens.map((screen) => (
                    <div
                      key={screen.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedScreen?.id === screen.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => selectScreen(screen)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{screen.screen_name}</h4>
                          <p className="text-sm text-muted-foreground">{screen.screen_slug}</p>
                          {screen.is_default && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded mt-1">
                              <Star className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(screen.id!);
                            }}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(screen.id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              {selectedScreen ? 'Edit Post-Checkout Screen' : 'Create Post-Checkout Screen'}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Screen Name</label>
                      <Input
                        value={formData.screen_name}
                        onChange={(e) => setFormData({ ...formData, screen_name: e.target.value })}
                        placeholder="Thank You Screen"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Screen Slug</label>
                      <Input
                        value={formData.screen_slug}
                        onChange={(e) => setFormData({ ...formData, screen_slug: e.target.value })}
                        placeholder="thank-you-screen"
                        disabled={!!selectedScreen}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                      />
                      <label className="text-sm font-medium">Set as Default</label>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Content</h3>
                  <div>
                    <label className="text-sm font-medium">Main Title</label>
                    <Input
                      value={formData.main_title}
                      onChange={(e) => setFormData({ ...formData, main_title: e.target.value })}
                      placeholder="Thank You for Your Order!"
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.main_title}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, main_title: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subtitle</label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Your order has been confirmed"
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.subtitle}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, subtitle: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Thank You Message</label>
                    <Textarea
                      value={formData.thank_you_message}
                      onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })}
                      placeholder="We appreciate your business..."
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.thank_you_message}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, thank_you_message: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Order Tracking Text</label>
                    <Textarea
                      value={formData.order_tracking_text}
                      onChange={(e) => setFormData({ ...formData, order_tracking_text: e.target.value })}
                      placeholder="You will receive tracking information..."
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.order_tracking_text}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, order_tracking_text: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Additional Content</label>
                    <Textarea
                      value={formData.additional_content}
                      onChange={(e) => setFormData({ ...formData, additional_content: e.target.value })}
                      placeholder="Additional information or promotions..."
                      rows={4}
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.additional_content}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, additional_content: style }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Media</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Background Image URL</label>
                      <Input
                        value={formData.background_image_url}
                        onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Background Video URL</label>
                      <Input
                        value={formData.background_video_url}
                        onChange={(e) => setFormData({ ...formData, background_video_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Call-to-Action Buttons</h3>
                    <Button onClick={addCTAButton} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Button
                    </Button>
                  </div>
                  {formData.cta_buttons.map((button, index) => (
                    <div key={index} className="border rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Button {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCTAButton(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          value={button.text}
                          onChange={(e) => updateCTAButton(index, { text: e.target.value })}
                          placeholder="Button text"
                        />
                        <Input
                          value={button.url}
                          onChange={(e) => updateCTAButton(index, { url: e.target.value })}
                          placeholder="Button URL"
                        />
                        <Select
                          value={button.variant}
                          onValueChange={(value) => updateCTAButton(index, { variant: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                            <SelectItem value="ghost">Ghost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FontSelector
                        value={button.style}
                        onChange={(style) => updateCTAButton(index, { style })}
                      />
                    </div>
                  ))}
                </div>

                {/* Custom CSS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Custom CSS</h3>
                  <Textarea
                    value={formData.custom_css}
                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                    placeholder="/* Custom CSS styles */"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};