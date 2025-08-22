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
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminState } from "@/hooks/useAdminState";
import { EditableCoverScreen } from "@/components/enhanced-cover/EditableCoverScreen";
import { MediaUploadSection } from "./MediaUploadSection";
import { Loader2, Save, Plus, Trash2, Move, Percent, DollarSign, Truck, MapPin, Clock } from 'lucide-react';
import { CANONICAL_DOMAIN } from '@/utils/domain';

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
  assignment_type: 'url' | 'special';
  url?: string;
  // Removed delivery_app_id - standalone architecture
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
  const [backgroundImageSize, setBackgroundImageSize] = useState(100); // Background image size percentage
  const [backgroundImagePosition, setBackgroundImagePosition] = useState('center'); // Background position
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
      assignment_type: 'url',
      // Removed delivery_app_id - standalone architecture
      markup_percentage: 0
    }
  ]);
  const [isActive, setIsActive] = useState(true);

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(80);
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 15 }); // percentage based
  const [headlineSize, setHeadlineSize] = useState(48);
  const [subtitleSize, setSubtitleSize] = useState(20); // Add subtitle size control
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subtitleVerticalPos, setSubtitleVerticalPos] = useState(0);
  const [featuresVerticalPos, setFeaturesVerticalPos] = useState(0);
  const [buttonsVerticalPos, setButtonsVerticalPos] = useState(0);
  
  // New controls for badge and colors
  const [badgeText, setBadgeText] = useState('✨ PREMIUM EXPERIENCE ✨');
  const [badgeSize, setBadgeSize] = useState(14);
  const [badgeVerticalPos, setBadgeVerticalPos] = useState(0);
  const [borderColor, setBorderColor] = useState('#334155');
  const [fontColor, setFontColor] = useState('#ffffff');

  // Enhanced auto-save functionality with logging
  const autoSave = useCallback(() => {
    if (!open) return;
    
    const formKey = initial?.id ? `cover_edit_${initial.id}` : 'cover_create_new';
    const formState = {
      title, subtitle, logoUrl, logoEmoji, backgroundImageUrl, backgroundVideoUrl,
      backgroundImageSize, backgroundImagePosition,
      variant, features, buttons, isActive, logoSize, logoPosition, headlineSize, subtitleSize,
      logoVerticalPos, headlineVerticalPos, subtitleVerticalPos, featuresVerticalPos, buttonsVerticalPos,
      badgeText, badgeSize, badgeVerticalPos, borderColor, fontColor,
      lastAutoSave: Date.now()
    };
    
    // Only save if there's actual content
    if (title.trim() || subtitle.trim() || logoUrl || backgroundImageUrl) {
      setFormValue(formKey, formState);
    }
  }, [
    open, initial?.id, title, subtitle, logoUrl, logoEmoji, backgroundImageUrl, backgroundVideoUrl,
    backgroundImageSize, backgroundImagePosition,
    variant, features, buttons, isActive, logoSize, logoPosition, headlineSize, subtitleSize,
    logoVerticalPos, headlineVerticalPos, subtitleVerticalPos, featuresVerticalPos, buttonsVerticalPos,
    badgeText, badgeSize, badgeVerticalPos, borderColor, fontColor,
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

      // Parse existing data - single parsing to avoid conflicts
      const parsedFeatures = typeof initial.checklist === 'string' ? 
        JSON.parse(initial.checklist || '[]') : initial.checklist || [];
      const parsedButtons = typeof initial.buttons === 'string' ? 
        JSON.parse(initial.buttons || '[]') : initial.buttons || [];
      const parsedStyles = typeof initial.styles === 'string' ? 
        JSON.parse(initial.styles || '{}') : initial.styles || {};

      // Apply all style settings from parsedStyles
      if (parsedStyles.logoEmoji) {
        setLogoEmoji(parsedStyles.logoEmoji);
      }

      // Load sizing data from styles or legacy fields
      if (parsedStyles.sizing) {
        setLogoSize(parsedStyles.sizing.logoSize || 80);
        setHeadlineSize(parsedStyles.sizing.headlineSize || 48);
        setSubtitleSize(parsedStyles.sizing.subtitleSize || 20);
      } else {
        // Fallback to legacy fields if no sizing in styles
        setLogoSize(initial.logo_width || initial.logo_height || 80);
      }
      
      // Load positioning data
      if (parsedStyles.positioning) {
        setLogoVerticalPos(parsedStyles.positioning.logoVerticalPos || 0);
        setHeadlineVerticalPos(parsedStyles.positioning.headlineVerticalPos || 0);
        setSubtitleVerticalPos(parsedStyles.positioning.subtitleVerticalPos || 0);
        setFeaturesVerticalPos(parsedStyles.positioning.featuresVerticalPos || 0);
        setButtonsVerticalPos(parsedStyles.positioning.buttonsVerticalPos || 0);
        setLogoPosition(parsedStyles.positioning.logoPosition || { x: 50, y: 15 });
      }
      
      // Load background image settings
      if (parsedStyles.backgroundImage) {
        setBackgroundImageSize(parsedStyles.backgroundImage.size || 100);
        setBackgroundImagePosition(parsedStyles.backgroundImage.position || 'center');
      }
      
      // Load badge and color settings
      if (parsedStyles.badge) {
        setBadgeText(parsedStyles.badge.text || '✨ PREMIUM EXPERIENCE ✨');
        setBadgeSize(parsedStyles.badge.size || 14);
        setBadgeVerticalPos(parsedStyles.badge.verticalPos || 0);
      }
      if (parsedStyles.colors) {
        setBorderColor(parsedStyles.colors.border || '#334155');
        setFontColor(parsedStyles.colors.font || '#ffffff');
      }

      if (parsedFeatures.length > 0) {
        setFeatures(parsedFeatures.map((item: any, index: number) => ({
          emoji: parsedStyles.features?.[index]?.emoji || item.emoji || '⭐',
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
          // Removed delivery_app_id - standalone architecture
          special_action: btn.special_action,
          markup_percentage: btn.markup_percentage || 0,
          markup_dollar_amount: btn.markup_dollar_amount || 0,
          prefill_data: btn.prefill_data || {}
        }));
        setButtons(convertedButtons);
      }
    } else if (savedState && !initial?.id) {
      // Restore from auto-save for new cover page
      setTitle(savedState.title || '');
      setSubtitle(savedState.subtitle || '');
      setLogoUrl(savedState.logoUrl || '');
      setLogoEmoji(savedState.logoEmoji || '🎉');
      setBackgroundImageUrl(savedState.backgroundImageUrl || '');
      setBackgroundVideoUrl(savedState.backgroundVideoUrl || '');
      setBackgroundImageSize(savedState.backgroundImageSize || 100);
      setBackgroundImagePosition(savedState.backgroundImagePosition || 'center');
      setVariant(savedState.variant || 'gold');
      setFeatures(savedState.features || features);
      setButtons(savedState.buttons || buttons);
      setIsActive(savedState.isActive !== false);
      setLogoSize(savedState.logoSize || 80);
      setLogoPosition(savedState.logoPosition || { x: 50, y: 15 });
      setHeadlineSize(savedState.headlineSize || 48);
      setSubtitleSize(savedState.subtitleSize || 20);
      setLogoVerticalPos(savedState.logoVerticalPos || 0);
      setHeadlineVerticalPos(savedState.headlineVerticalPos || 0);
      setSubtitleVerticalPos(savedState.subtitleVerticalPos || 0);
      setFeaturesVerticalPos(savedState.featuresVerticalPos || 0);
      setButtonsVerticalPos(savedState.buttonsVerticalPos || 0);
      
      // Restore badge and color settings
      setBadgeText(savedState.badgeText || '✨ PREMIUM EXPERIENCE ✨');
      setBadgeSize(savedState.badgeSize || 14);
      setBadgeVerticalPos(savedState.badgeVerticalPos || 0);
      setBorderColor(savedState.borderColor || '#334155');
      setFontColor(savedState.fontColor || '#ffffff');

      console.log('🔄 Cover page session restored from auto-save');
      toast({
        title: "Session Restored", 
        description: "Your previous work has been restored automatically.",
        duration: 3000,
      });
    }
  }, [initial, open]);

  const generateSlug = async (title: string, excludeId?: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for duplicates and generate unique slug
    while (true) {
      const { data: existing } = await supabase
        .from('cover_pages')
        .select('id')
        .eq('slug', slug)
        // Only add the neq filter if we have a valid excludeId
        .not('id', 'eq', excludeId || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();
      
      if (!existing) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      if (counter > 100) {
        return `${baseSlug}-${Date.now()}`;
      }
    }
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
      const slug = await generateSlug(title, initial?.id);
      const coverPageData = {
        title,
        subtitle,
        slug,
        logo_url: logoUrl,
        logo_width: logoSize,
        logo_height: logoSize,
        bg_image_url: backgroundImageUrl,
        bg_video_url: backgroundVideoUrl,
        theme: variant,
        checklist: JSON.stringify(features),
        buttons: JSON.stringify(buttons),
        styles: JSON.stringify({
          variant,
          logoEmoji,
          features: features,
          sizing: {
            logoSize,
            headlineSize,
            subtitleSize
          },
          positioning: {
            logoVerticalPos,
            headlineVerticalPos,
            subtitleVerticalPos,
            featuresVerticalPos,
            buttonsVerticalPos,
            logoPosition
          },
          backgroundImage: {
            size: backgroundImageSize,
            position: backgroundImagePosition
          },
          badge: {
            text: badgeText,
            size: badgeSize,
            verticalPos: badgeVerticalPos
          },
          colors: {
            border: borderColor,
            font: fontColor
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

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Duplicate Name",
              description: "A cover page with this name already exists. Please choose a different title.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Success!",
          description: "Cover page updated successfully",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`/cover/${slug}`, '_blank')}
            >
              View Page
            </Button>
          )
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('cover_pages')
          .insert(coverPageData);

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Duplicate Name",
              description: "A cover page with this name already exists. Please choose a different title.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Success!",
          description: `Cover page created! Available at ${CANONICAL_DOMAIN}/cover/${slug}`,
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`/cover/${slug}`, '_blank')}
            >
              View Page
            </Button>
          )
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
            onValueChange={(value: 'url' | 'special') => updateButton(index, { assignment_type: value, url: '', special_action: undefined })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">Custom URL</SelectItem>
              {/* Delivery app option removed - standalone architecture */}
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

        {/* All delivery app functionality removed - standalone architecture */}

        {button.assignment_type === 'special' && (
          <div className="space-y-4">
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
                      Pre-fill Date/Time
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {button.special_action === 'prefill_address' && (
              <div className="space-y-2">
                <Label>Default Address</Label>
                <Input
                  value={button.prefill_data?.address || ''}
                  onChange={(e) => updateButton(index, { 
                    prefill_data: { ...button.prefill_data, address: e.target.value }
                  })}
                  placeholder="123 Main St, City, State, ZIP"
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
          </div>
        )}

        <div className="flex justify-end">
          <Button
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
      <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur-sm flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {initial?.id ? 'Edit Cover Page' : 'Create Cover Page'}
            <Badge variant="secondary" className="text-xs">Auto-Saving</Badge>
          </DialogTitle>
          <DialogDescription>
            Design and configure your cover page with custom branding, content, and interactive elements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Configuration Panel */}
          <div className="flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Store"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Premium products delivered"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
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

            {/* Media Section */}
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

            {/* Size & Position Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Size & Position Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Logo</h4>
                  <div className="space-y-2">
                    <Label>Logo Size: {logoSize}px</Label>
                    <Slider
                      value={[logoSize]}
                      onValueChange={(value) => setLogoSize(value[0])}
                      min={20}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo Vertical Position: {logoVerticalPos}px</Label>
                    <Slider
                      value={[logoVerticalPos]}
                      onValueChange={(value) => setLogoVerticalPos(value[0])}
                      min={-50}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Headline Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Headline</h4>
                  <div className="space-y-2">
                    <Label>Headline Size: {headlineSize}px</Label>
                    <Slider
                      value={[headlineSize]}
                      onValueChange={(value) => setHeadlineSize(value[0])}
                      min={20}
                      max={80}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Vertical Position: {headlineVerticalPos}px</Label>
                    <Slider
                      value={[headlineVerticalPos]}
                      onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                      min={-50}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Subtitle Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Subtitle</h4>
                  <div className="space-y-2">
                    <Label>Subtitle Size: {subtitleSize}px</Label>
                    <Slider
                      value={[subtitleSize]}
                      onValueChange={(value) => setSubtitleSize(value[0])}
                      min={12}
                      max={40}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle Vertical Position: {subtitleVerticalPos}px</Label>
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

                {/* Features Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Features</h4>
                  <div className="space-y-2">
                    <Label>Features Vertical Position: {featuresVerticalPos}px</Label>
                    <Slider
                      value={[featuresVerticalPos]}
                      onValueChange={(value) => setFeaturesVerticalPos(value[0])}
                      min={-50}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Buttons Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Buttons</h4>
                  <div className="space-y-2">
                    <Label>Buttons Vertical Position: {buttonsVerticalPos}px</Label>
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

                {/* Background Image Controls */}
                {backgroundImageUrl && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Background Image</h4>
                    <div className="space-y-2">
                      <Label>Image Size: {backgroundImageSize}%</Label>
                      <Slider
                        value={[backgroundImageSize]}
                        onValueChange={(value) => setBackgroundImageSize(value[0])}
                        min={50}
                        max={150}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={backgroundImagePosition} onValueChange={setBackgroundImagePosition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                 )}
               </CardContent>
             </Card>

            {/* Badge & Color Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Badge & Color Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Badge Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Top Badge</h4>
                  <div className="space-y-2">
                    <Label>Badge Text</Label>
                    <Input
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="✨ PREMIUM EXPERIENCE ✨"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge Size: {badgeSize}px</Label>
                    <Slider
                      value={[badgeSize]}
                      onValueChange={(value) => setBadgeSize(value[0])}
                      min={8}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge Vertical Position: {badgeVerticalPos}px</Label>
                    <Slider
                      value={[badgeVerticalPos]}
                      onValueChange={(value) => setBadgeVerticalPos(value[0])}
                      min={-50}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Color Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Border Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="w-16 h-10 p-1 border-2"
                        />
                        <Input
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          placeholder="#334155"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Font Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="w-16 h-10 p-1 border-2"
                        />
                        <Input
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

             {/* Button Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Button Configuration
                  <Button onClick={addButton} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttons.map((button, index) => (
                  <div key={index}>
                    {renderButtonAssignment(button, index)}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Feature List */}
            <Card>
              <CardHeader>
                <CardTitle>Feature List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2">
                    <Input
                      value={feature.emoji}
                      onChange={(e) => {
                        const newFeatures = [...features];
                        newFeatures[index].emoji = e.target.value;
                        setFeatures(newFeatures);
                      }}
                      placeholder="🎉"
                      className="text-center"
                    />
                    <Input
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...features];
                        newFeatures[index].title = e.target.value;
                        setFeatures(newFeatures);
                      }}
                      placeholder="Title"
                    />
                    <Input
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...features];
                        newFeatures[index].description = e.target.value;
                        setFeatures(newFeatures);
                      }}
                      placeholder="Description"
                      className="col-span-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activation */}
            <Card>
              <CardHeader>
                <CardTitle>Page Status</CardTitle>
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

              </div>
            </ScrollArea>
            
            {/* Fixed Footer */}
            <div className="flex justify-end space-x-2 p-6 border-t bg-background/95 backdrop-blur-sm">
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

          {/* Live Preview - Fixed Height */}
          <div className="flex flex-col bg-gradient-to-br from-background to-muted/20 border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/10 shrink-0">
              <h3 className="font-semibold">Live Preview</h3>
              <p className="text-sm text-muted-foreground">See your changes in real-time</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditableCoverScreen
                title={title}
                subtitle={subtitle}
                logoUrl={logoUrl}
                logoEmoji={logoEmoji}
                backgroundImageUrl={backgroundImageUrl}
                backgroundVideoUrl={backgroundVideoUrl}
                backgroundImageStyles={{
                  backgroundSize: `${backgroundImageSize}%`,
                  backgroundPosition: backgroundImagePosition
                }}
                variant={variant}
                features={features}
                buttons={buttons}
                sizing={{
                  logoSize: logoSize,
                  headlineSize: headlineSize,
                  subtitleSize: subtitleSize
                }}
                positioning={{
                  logoMarginTop: `${logoVerticalPos}px`,
                  titleMarginTop: `${headlineVerticalPos}px`,
                  subtitleMarginTop: `${subtitleVerticalPos}px`,
                  featuresMarginTop: `${featuresVerticalPos}px`,
                  buttonsMarginTop: `${buttonsVerticalPos}px`
                }}
                badgeConfig={{
                  text: badgeText,
                  size: badgeSize,
                  verticalPos: badgeVerticalPos
                }}
                customColors={{
                  border: borderColor,
                  font: fontColor
                }}
                standalone={true}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};