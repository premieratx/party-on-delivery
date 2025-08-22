import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminState } from "@/hooks/useAdminState";
import { EditableCoverScreen } from "@/components/enhanced-cover/EditableCoverScreen";
import { MediaUploadSection } from "./MediaUploadSection";
import { Loader2, Save, Plus, Trash2, Move, Percent, DollarSign, Truck, MapPin, Clock } from 'lucide-react';

interface EnhancedCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
}

interface ButtonConfig {
  text: string;
  type: 'primary' | 'secondary';
  assignment_type: 'url' | 'delivery_app' | 'special';
  url?: string;
  delivery_app_id?: string;
  special_action?: 'free_delivery' | 'prefill_address' | 'prefill_datetime';
  markup_percentage?: number;
  markup_dollar_amount?: number;
  prefill_data?: {
    address?: string;
    date?: string;
    time?: string;
  };
}

export const EnhancedCoverPageCreator: React.FC<EnhancedCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const { toast } = useToast();
  const { formData, setFormValue, getFormValue } = useAdminState();

  // Form fields with auto-persistence
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🎉');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState('');
  const [variant, setVariant] = useState<'original' | 'gold' | 'platinum'>('gold');
  const [features, setFeatures] = useState([
    { emoji: '⭐', title: 'Premium Quality', description: 'Top-tier products and service' },
    { emoji: '🚀', title: 'Fast Delivery', description: 'Quick and reliable shipping' },
    { emoji: '💎', title: 'Best Value', description: 'Unbeatable prices and deals' }
  ]);
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { 
      text: 'Order Now', 
      type: 'primary', 
      assignment_type: 'delivery_app',
      delivery_app_id: '',
      markup_percentage: 0
    }
  ]);
  const [isActive, setIsActive] = useState(true);

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(80);
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 15 }); // percentage based
  const [headlineSize, setHeadlineSize] = useState(48);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subtitleVerticalPos, setSubtitleVerticalPos] = useState(0);
  const [featuresVerticalPos, setFeaturesVerticalPos] = useState(0);
  const [buttonsVerticalPos, setButtonsVerticalPos] = useState(0);

  // Enhanced auto-save functionality with logging
  const autoSave = useCallback(() => {
    if (!open) return;
    
    const formKey = initial?.id ? `cover_edit_${initial.id}` : 'cover_create_new';
    const formState = {
      title, subtitle, logoUrl, logoEmoji, backgroundImageUrl, backgroundVideoUrl,
      variant, features, buttons, isActive, logoSize, logoPosition, headlineSize,
      logoVerticalPos, headlineVerticalPos, subtitleVerticalPos, featuresVerticalPos, buttonsVerticalPos,
      lastAutoSave: Date.now()
    };
    
    // Only save if there's actual content
    if (title.trim() || subtitle.trim() || logoUrl || backgroundImageUrl) {
      setFormValue(formKey, formState);
      // console.log('💾 Cover page auto-saved:', { 
      //   formKey, 
      //   title: title.trim() || 'Untitled',
      //   hasContent: !!(title.trim() || subtitle.trim() || logoUrl || backgroundImageUrl)
      // });
    }
  }, [
    open, initial?.id, title, subtitle, logoUrl, logoEmoji, backgroundImageUrl, backgroundVideoUrl,
    variant, features, buttons, isActive, logoSize, logoPosition, headlineSize,
    logoVerticalPos, headlineVerticalPos, subtitleVerticalPos, featuresVerticalPos, buttonsVerticalPos,
    setFormValue
  ]);

  // Auto-save every 30 seconds (reduced from 3 seconds to prevent spam)
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load delivery apps
  useEffect(() => {
    const loadDeliveryApps = async () => {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug')
        .eq('is_active', true)
        .order('app_name');
      
      if (!error && data) {
        setDeliveryApps(data);
      }
    };
    
    if (open) {
      loadDeliveryApps();
    }
  }, [open]);

  // Load initial data or restore from auto-save
  useEffect(() => {
    if (!open) return;

    const formKey = initial?.id ? `cover_edit_${initial.id}` : 'cover_create_new';
    const savedState = getFormValue(formKey);

    if (initial && initial.id) {
      // Editing existing - load from database
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setLogoUrl(initial.logo_url || '');
      setBackgroundImageUrl(initial.bg_image_url || '');
      setBackgroundVideoUrl(initial.bg_video_url || '');
      setVariant(initial.theme || 'gold');
      setIsActive(initial.is_active !== false);

      // Parse existing data
      const parsedFeatures = typeof initial.checklist === 'string' ? 
        JSON.parse(initial.checklist || '[]') : initial.checklist || [];
      const parsedButtons = typeof initial.buttons === 'string' ? 
        JSON.parse(initial.buttons || '[]') : initial.buttons || [];
      const parsedStyles = typeof initial.styles === 'string' ? 
        JSON.parse(initial.styles || '{}') : initial.styles || {};

      if (parsedFeatures.length > 0) {
        setFeatures(parsedFeatures.map((item: any, index: number) => ({
          emoji: parsedStyles.features?.[index]?.emoji || '⭐',
          title: typeof item === 'string' ? item : item.title || item,
          description: typeof item === 'string' ? 'Premium feature' : item.description || 'Premium feature'
        })));
      }

      if (parsedButtons.length > 0) {
        const convertedButtons = parsedButtons.map((btn: any) => ({
          text: btn.text || 'Order Now',
          type: btn.type || 'primary',
          assignment_type: btn.assignment_type || 'url',
          url: btn.url,
          delivery_app_id: btn.delivery_app_id || '',
          special_action: btn.special_action,
          markup_percentage: btn.markup_percentage || 0,
          markup_dollar_amount: btn.markup_dollar_amount || 0,
          prefill_data: btn.prefill_data || {}
        }));
        setButtons(convertedButtons);
      }

      if (parsedStyles.logoEmoji) {
        setLogoEmoji(parsedStyles.logoEmoji);
      }

      // Load sizing and positioning data
      if (parsedStyles.sizing) {
        setLogoSize(parsedStyles.sizing.logoSize || 80);
        setHeadlineSize(parsedStyles.sizing.headlineSize || 48);
      }
      
      if (parsedStyles.positioning) {
        setLogoVerticalPos(parsedStyles.positioning.logoVerticalPos || 0);
        setHeadlineVerticalPos(parsedStyles.positioning.headlineVerticalPos || 0);
        setSubtitleVerticalPos(parsedStyles.positioning.subtitleVerticalPos || 0);
        setFeaturesVerticalPos(parsedStyles.positioning.featuresVerticalPos || 0);
        setButtonsVerticalPos(parsedStyles.positioning.buttonsVerticalPos || 0);
        setLogoPosition(parsedStyles.positioning.logoPosition || { x: 50, y: 15 });
      }
    } else if (savedState && !initial?.id) {
      // Restore from auto-save for new cover page
      setTitle(savedState.title || '');
      setSubtitle(savedState.subtitle || '');
      setLogoUrl(savedState.logoUrl || '');
      setLogoEmoji(savedState.logoEmoji || '🎉');
      setBackgroundImageUrl(savedState.backgroundImageUrl || '');
      setBackgroundVideoUrl(savedState.backgroundVideoUrl || '');
      setVariant(savedState.variant || 'gold');
      setFeatures(savedState.features || features);
      setButtons(savedState.buttons || buttons);
      setIsActive(savedState.isActive !== false);
      setLogoSize(savedState.logoSize || 80);
      setLogoPosition(savedState.logoPosition || { x: 50, y: 15 });
      setHeadlineSize(savedState.headlineSize || 48);
      setLogoVerticalPos(savedState.logoVerticalPos || 0);
      setHeadlineVerticalPos(savedState.headlineVerticalPos || 0);
      setSubtitleVerticalPos(savedState.subtitleVerticalPos || 0);
      setFeaturesVerticalPos(savedState.featuresVerticalPos || 0);
      setButtonsVerticalPos(savedState.buttonsVerticalPos || 0);

      console.log('🔄 Cover page session restored from auto-save');
      toast({
        title: "Session Restored", 
        description: "Your previous work has been restored automatically.",
        duration: 3000,
      });
    }
  }, [initial, open]); // Fixed: Removed getFormValue and toast from dependencies to prevent infinite loop

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(title);
      const coverPageData = {
        title,
        subtitle,
        slug,
        logo_url: logoUrl,
        bg_image_url: backgroundImageUrl,
        bg_video_url: backgroundVideoUrl,
        theme: variant,
        checklist: JSON.stringify(features.map(f => f.title)),
        buttons: JSON.stringify(buttons),
        styles: JSON.stringify({
          variant,
          logoEmoji,
          features: features.map(f => ({ emoji: f.emoji })),
          sizing: {
            logoSize,
            headlineSize
          },
          positioning: {
            logoVerticalPos,
            headlineVerticalPos,
            subtitleVerticalPos,
            featuresVerticalPos,
            buttonsVerticalPos,
            logoPosition
          }
        }),
        is_active: isActive
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('cover_pages')
          .update(coverPageData)
          .eq('id', initial.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Cover page updated successfully",
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('cover_pages')
          .insert(coverPageData);

        if (error) throw error;

        toast({
          title: "Success!",
          description: `Cover page created! Available at https://order.partyondelivery.com/cover/${slug}`,
        });
      }

      // Clear auto-save data on successful save
      const formKey = initial?.id ? `cover_edit_${initial.id}` : 'cover_create_new';
      setFormValue(formKey, null);
      
      console.log('✅ Cover page saved successfully and auto-save cleared');

      onSaved?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save cover page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addButton = () => {
    setButtons([...buttons, {
      text: 'New Button',
      type: 'secondary',
      assignment_type: 'url',
      url: '',
      markup_percentage: 0
    }]);
  };

  const removeButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  const updateButton = (index: number, updates: Partial<ButtonConfig>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setButtons(newButtons);
  };

  const renderButtonAssignment = (button: ButtonConfig, index: number) => {
    return (
      <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={button.text}
              onChange={(e) => updateButton(index, { text: e.target.value })}
              placeholder="Order Now"
            />
          </div>
          <div className="space-y-2">
            <Label>Button Style</Label>
            <Select 
              value={button.type} 
              onValueChange={(value: 'primary' | 'secondary') => updateButton(index, { type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Assignment Type</Label>
          <Select 
            value={button.assignment_type} 
            onValueChange={(value: 'url' | 'delivery_app' | 'special') => updateButton(index, { assignment_type: value, url: '', delivery_app_id: '', special_action: undefined })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">Custom URL</SelectItem>
              <SelectItem value="delivery_app">Delivery App</SelectItem>
              <SelectItem value="special">Special Action</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {button.assignment_type === 'url' && (
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={button.url || ''}
              onChange={(e) => updateButton(index, { url: e.target.value })}
              placeholder="/delivery or https://example.com"
            />
          </div>
        )}

        {button.assignment_type === 'delivery_app' && (
          <div className="space-y-2">
            <Label>Delivery App</Label>
            <Select 
              value={button.delivery_app_id || ''} 
              onValueChange={(value) => updateButton(index, { delivery_app_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery app" />
              </SelectTrigger>
              <SelectContent>
                {deliveryApps.map(app => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.app_name} ({app.app_slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {button.assignment_type === 'special' && (
          <div className="space-y-2">
            <Label>Special Action</Label>
            <Select 
              value={button.special_action || ''} 
              onValueChange={(value: 'free_delivery' | 'prefill_address' | 'prefill_datetime') => updateButton(index, { special_action: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select special action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free_delivery">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Free Delivery
                  </div>
                </SelectItem>
                <SelectItem value="prefill_address">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pre-fill Address
                  </div>
                </SelectItem>
                <SelectItem value="prefill_datetime">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pre-fill Date & Time
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {button.special_action === 'prefill_address' && (
          <div className="space-y-2">
            <Label>Default Address</Label>
            <Textarea
              value={button.prefill_data?.address || ''}
              onChange={(e) => updateButton(index, { 
                prefill_data: { ...button.prefill_data, address: e.target.value }
              })}
              placeholder="123 Main St, Austin, TX 78701"
            />
          </div>
        )}

        {button.special_action === 'prefill_datetime' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Default Date</Label>
              <Input
                type="date"
                value={button.prefill_data?.date || ''}
                onChange={(e) => updateButton(index, { 
                  prefill_data: { ...button.prefill_data, date: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Time</Label>
              <Input
                type="time"
                value={button.prefill_data?.time || ''}
                onChange={(e) => updateButton(index, { 
                  prefill_data: { ...button.prefill_data, time: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {(button.assignment_type === 'delivery_app' || button.assignment_type === 'url') && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Markup %
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={button.markup_percentage || 0}
                onChange={(e) => updateButton(index, { markup_percentage: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Markup $
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={button.markup_dollar_amount || 0}
                onChange={(e) => updateButton(index, { markup_dollar_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeButton(index)}
            disabled={buttons.length <= 1}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Button
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initial?.id ? 'Edit Cover Page' : 'Create Cover Page'}
            <Badge variant="secondary" className="text-xs">Auto-Saving</Badge>
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Design and configure your cover page with custom branding, content, and interactive elements.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Content Form */}
          <div className="w-1/2 space-y-4 overflow-y-auto pr-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Amazing Products & Services"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Get premium quality products delivered to your door"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variant">Theme</Label>
                  <Select value={variant} onValueChange={(value: 'original' | 'gold' | 'platinum') => setVariant(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Media Upload Section */}
            <MediaUploadSection
              title="Media Assets"
              logoUrl={logoUrl}
              onLogoUrlChange={setLogoUrl}
              backgroundImageUrl={backgroundImageUrl}
              onBackgroundImageUrlChange={setBackgroundImageUrl}
              backgroundVideoUrl={backgroundVideoUrl}
              onBackgroundVideoUrlChange={setBackgroundVideoUrl}
              componentType="cover"
            />

            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoEmoji">Fallback Emoji</Label>
                    <Input
                      id="logoEmoji"
                      value={logoEmoji}
                      onChange={(e) => setLogoEmoji(e.target.value)}
                      placeholder="🎉"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Size: {logoSize}px</Label>
                    <Slider
                      value={[logoSize]}
                      onValueChange={(value) => setLogoSize(value[0])}
                      min={40}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horizontal Position: {logoPosition.x}%</Label>
                    <Slider
                      value={[logoPosition.x]}
                      onValueChange={(value) => setLogoPosition(prev => ({ ...prev, x: value[0] }))}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vertical Position: {logoPosition.y}%</Label>
                    <Slider
                      value={[logoPosition.y]}
                      onValueChange={(value) => setLogoPosition(prev => ({ ...prev, y: value[0] }))}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Element Positioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Headline Size: {headlineSize}px</Label>
                    <Slider
                      value={[headlineSize]}
                      onValueChange={(value) => setHeadlineSize(value[0])}
                      min={24}
                      max={72}
                      step={2}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title Offset: {headlineVerticalPos}px</Label>
                      <Slider
                        value={[headlineVerticalPos]}
                        onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                        min={-50}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle Offset: {subtitleVerticalPos}px</Label>
                      <Slider
                        value={[subtitleVerticalPos]}
                        onValueChange={(value) => setSubtitleVerticalPos(value[0])}
                        min={-50}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Features Offset: {featuresVerticalPos}px</Label>
                      <Slider
                        value={[featuresVerticalPos]}
                        onValueChange={(value) => setFeaturesVerticalPos(value[0])}
                        min={-50}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Buttons Offset: {buttonsVerticalPos}px</Label>
                      <Slider
                        value={[buttonsVerticalPos]}
                        onValueChange={(value) => setButtonsVerticalPos(value[0])}
                        min={-50}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div className="space-y-2">
                      <Label>Emoji</Label>
                      <Input
                        value={feature.emoji}
                        onChange={(e) => {
                          const newFeatures = [...features];
                          newFeatures[index].emoji = e.target.value;
                          setFeatures(newFeatures);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={feature.title}
                        onChange={(e) => {
                          const newFeatures = [...features];
                          newFeatures[index].title = e.target.value;
                          setFeatures(newFeatures);
                        }}
                      />
                    </div>
                    <div className="col-span-2 space-y-2 flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Description</Label>
                        <Input
                          value={feature.description}
                          onChange={(e) => {
                            const newFeatures = [...features];
                            newFeatures[index].description = e.target.value;
                            setFeatures(newFeatures);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (features.length > 1) {
                            setFeatures(features.filter((_, i) => i !== index));
                          }
                        }}
                        disabled={features.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline" 
                  onClick={() => setFeatures([...features, { emoji: '⭐', title: 'New Feature', description: 'Feature description' }])}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttons.map((button, index) => renderButtonAssignment(button, index))}
                
                <Button
                  type="button"
                  variant="outline" 
                  onClick={addButton}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Button
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 pb-6 border-t pt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {initial?.id ? 'Update' : 'Create'} Cover Page
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="w-1/2 border-l pl-6 overflow-hidden">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4 flex-shrink-0">Live Preview</h3>
              <div className="flex-1 overflow-hidden rounded-lg border bg-muted/10">
                <div className="w-full h-full scale-[0.4] origin-top-left" style={{ width: '250%', height: '250%' }}>
                  <EditableCoverScreen
                    title={title || 'Your Amazing Title'}
                    subtitle={subtitle || 'Your compelling subtitle here'}
                    logoUrl={logoUrl}
                    logoEmoji={logoEmoji}
                    backgroundImageUrl={backgroundImageUrl}
                    backgroundVideoUrl={backgroundVideoUrl}
                    features={features}
                    buttons={buttons.map(btn => ({
                      text: btn.text,
                      type: btn.type,
                      url: btn.assignment_type === 'url' ? btn.url : 
                           btn.assignment_type === 'delivery_app' ? `/app/${deliveryApps.find(app => app.id === btn.delivery_app_id)?.app_slug || 'delivery'}` :
                           btn.special_action === 'free_delivery' ? '/delivery?free_shipping=true' :
                           btn.special_action === 'prefill_address' ? `/delivery?address=${encodeURIComponent(btn.prefill_data?.address || '')}` :
                           btn.special_action === 'prefill_datetime' ? `/delivery?date=${btn.prefill_data?.date}&time=${btn.prefill_data?.time}` : '/delivery',
                      onClick: () => console.log(`Button clicked: ${btn.text}`)
                    }))}
                    variant={variant}
                    logoSizing={{
                      width: `${logoSize}px`,
                      height: `${logoSize}px`
                    }}
                    typography={{
                      titleSize: `${headlineSize}px`
                    }}
                    positioning={{
                      logoMarginTop: `${logoVerticalPos}rem`,
                      titleMarginTop: `${headlineVerticalPos}rem`,
                      subtitleMarginTop: `${subtitleVerticalPos}rem`,
                      featuresMarginTop: `${featuresVerticalPos}rem`,
                      buttonsMarginTop: `${buttonsVerticalPos}rem`
                    }}
                    standalone={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {initial?.id ? 'Update' : 'Create'} Cover Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};