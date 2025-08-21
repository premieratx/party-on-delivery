import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, Palette, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { UNIFIED_THEMES, getThemeCSS } from '@/lib/themeSystem';

interface UnifiedPostCheckoutCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

// Pixel-perfect post-checkout preview component
const PostCheckoutPreview: React.FC<{
  name: string;
  content: {
    logo_url?: string;
    custom_message?: string;
    primary_button_text?: string;
    primary_button_url?: string;
    secondary_button_text?: string;
    secondary_button_url?: string;
  };
  theme: 'original' | 'gold' | 'platinum';
  device: 'mobile' | 'tablet' | 'desktop';
}> = ({ name, content, theme, device }) => {
  const themeConfig = UNIFIED_THEMES[theme];
  const cssVars = getThemeCSS(themeConfig);
  
  const deviceClasses = {
    mobile: 'w-[375px] h-[667px]',
    tablet: 'w-[768px] h-[600px]',
    desktop: 'w-[1000px] h-[600px]'
  };
  
  return (
    <div 
      className={`${deviceClasses[device]} border rounded-xl overflow-hidden shadow-xl`}
      style={cssVars as React.CSSProperties}
    >
      <div 
        className="h-full flex items-center justify-center p-6"
        style={{ 
          background: themeConfig.colors.gradient,
          color: themeConfig.colors.text
        }}
      >
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {content.logo_url && (
            <img src={content.logo_url} alt="Logo" className="h-16 w-auto mx-auto" />
          )}
          
          <div className="space-y-4">
            <h1 
              className="text-4xl font-bold" 
              style={{ 
                fontFamily: themeConfig.fonts.heading,
                color: themeConfig.colors.text
              }}
            >
              {name}
            </h1>
            <p 
              className="text-xl opacity-90"
              style={{ color: themeConfig.colors.text }}
            >
              {content.custom_message || 'Thank you for your order!'}
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            {content.primary_button_text && (
              <button 
                className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: themeConfig.colors.primary,
                  color: themeConfig.colors.background,
                  boxShadow: themeConfig.shadows.button
                }}
              >
                {content.primary_button_text}
              </button>
            )}
            {content.secondary_button_text && (
              <button 
                className="px-6 py-3 rounded-xl font-medium border-2 transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'transparent',
                  color: themeConfig.colors.text,
                  borderColor: themeConfig.colors.primary
                }}
              >
                {content.secondary_button_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnifiedPostCheckoutCreator: React.FC<UnifiedPostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [name, setName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryButtonText, setPrimaryButtonText] = useState('');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('');
  const [secondaryButtonText, setSecondaryButtonText] = useState('');
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState('');
  const [theme, setTheme] = useState<'original' | 'gold' | 'platinum'>('gold');
  const [isDefault, setIsDefault] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Load initial data
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setName(initial.name || '');
      setCustomMessage(initial.content?.custom_message || '');
      setLogoUrl(initial.content?.logo_url || '');
      setPrimaryButtonText(initial.content?.primary_button_text || '');
      setPrimaryButtonUrl(initial.content?.primary_button_url || '');
      setSecondaryButtonText(initial.content?.secondary_button_text || '');
      setSecondaryButtonUrl(initial.content?.secondary_button_url || '');
      setTheme(initial.theme || 'gold');
      setIsDefault(initial.is_default || false);
    } else {
      // Reset for new post-checkout page
      setName('');
      setCustomMessage('Thank you for your order! Your items will be delivered soon.');
      setLogoUrl('');
      setPrimaryButtonText('Track Order');
      setPrimaryButtonUrl('/orders');
      setSecondaryButtonText('Continue Shopping');
      setSecondaryButtonUrl('/delivery');
      setTheme('gold');
      setIsDefault(false);
    }
  }, [open, initial]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'order-complete';
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Page name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const slug = generateSlug(name);
      
      const postCheckoutData = {
        name: name.trim(),
        slug: initial ? initial.slug : `${slug}-${Date.now()}`,
        content: {
          logo_url: logoUrl || null,
          custom_message: customMessage.trim(),
          primary_button_text: primaryButtonText.trim(),
          primary_button_url: primaryButtonUrl.trim(),
          secondary_button_text: secondaryButtonText.trim(),
          secondary_button_url: secondaryButtonUrl.trim()
        } as any,
        theme: theme,
        is_default: isDefault
      };

      if (initial?.id) {
        const { error } = await supabase
          .from('post_checkout_pages')
          .update(postCheckoutData)
          .eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'Post-checkout page updated successfully!' });
      } else {
        const { error } = await supabase
          .from('post_checkout_pages')
          .insert(postCheckoutData);
        if (error) throw error;
        toast({ title: 'Post-checkout page created successfully!' });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto flex flex-col" aria-describedby="dialog-description">
        <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {initial ? `Edit: ${initial.name}` : 'Create Post-Checkout Page'}
                </h2>
                <DialogDescription id="dialog-description" className="text-sm text-muted-foreground font-normal">
                  Pixel-perfect order completion experience with cohesive theming
                </DialogDescription>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading || !name}
                size="sm"
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Page'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="content" className="flex flex-col">
              <div className="px-6 pt-4 border-b flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name">Page Name *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Order Complete"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Custom Message</Label>
                        <Textarea
                          id="message"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Thank you for your order! Your items will be delivered soon."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="logo-url">Logo URL</Label>
                        <Input
                          id="logo-url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-default"
                          checked={isDefault}
                          onCheckedChange={setIsDefault}
                        />
                        <Label htmlFor="is-default">Default Post-Checkout Page</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Buttons Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Buttons</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Primary Button</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <Input
                            value={primaryButtonText}
                            onChange={(e) => setPrimaryButtonText(e.target.value)}
                            placeholder="Track Order"
                          />
                          <Input
                            value={primaryButtonUrl}
                            onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                            placeholder="/orders"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Secondary Button</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <Input
                            value={secondaryButtonText}
                            onChange={(e) => setSecondaryButtonText(e.target.value)}
                            placeholder="Continue Shopping"
                          />
                          <Input
                            value={secondaryButtonUrl}
                            onChange={(e) => setSecondaryButtonUrl(e.target.value)}
                            placeholder="/delivery"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="theme" className="p-6">
                <div className="max-w-2xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.values(UNIFIED_THEMES).map((themeConfig) => (
                          <div 
                            key={themeConfig.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              theme === themeConfig.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setTheme(themeConfig.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{themeConfig.name}</h3>
                              <Badge variant={theme === themeConfig.id ? 'default' : 'secondary'}>
                                {theme === themeConfig.id ? 'Selected' : 'Select'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {themeConfig.description}
                            </p>
                            <div className="flex gap-2">
                              {Object.entries(themeConfig.colors).slice(0, 5).map(([name, color]) => (
                                <div
                                  key={name}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={name}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="p-6">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden">
                    <PostCheckoutPreview
                      name={name || 'Order Complete'}
                      content={{
                        logo_url: logoUrl,
                        custom_message: customMessage,
                        primary_button_text: primaryButtonText,
                        primary_button_url: primaryButtonUrl,
                        secondary_button_text: secondaryButtonText,
                        secondary_button_url: secondaryButtonUrl
                      }}
                      theme={theme}
                      device={previewDevice}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
      </DialogContent>
    </Dialog>
  );
};