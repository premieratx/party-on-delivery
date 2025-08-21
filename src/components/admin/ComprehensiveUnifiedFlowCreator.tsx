import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Workflow, Settings, Palette, Users } from 'lucide-react';
import { MediaUploadSection } from './MediaUploadSection';
import { ResponsivePreview } from './ResponsivePreview';
import { FlowAffiliateAssignment } from './FlowAffiliateAssignment';
import { UNIFIED_THEMES } from '@/lib/themeSystem';

interface FlowConfiguration {
  name: string;
  slug: string;
  theme: 'original' | 'gold' | 'platinum';
  affiliateId?: string;
  coverPage: {
    title: string;
    subtitle: string;
    logoUrl: string;
    backgroundImageUrl: string;
    backgroundVideoUrl: string;
    features: Array<{
      emoji: string;
      title: string;
      description: string;
    }>;
    buttons: Array<{
      text: string;
      type: 'primary' | 'secondary';
      url: string;
    }>;
  };
  deliveryApp: {
    title: string;
    subtitle: string;
    logoUrl: string;
    backgroundImageUrl: string;
    backgroundVideoUrl: string;
    collections: string[];
    categories: string[];
  };
  postCheckout: {
    title: string;
    subtitle: string;
    logoUrl: string;
    backgroundImageUrl: string;
    backgroundVideoUrl: string;
    thankYouMessage: string;
    nextSteps: string[];
  };
}

interface ComprehensiveUnifiedFlowCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlowCreated: () => void;
}

export const ComprehensiveUnifiedFlowCreator: React.FC<ComprehensiveUnifiedFlowCreatorProps> = ({
  open,
  onOpenChange,
  onFlowCreated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('setup');
  const { toast } = useToast();

  // Flow Configuration State
  const [flowConfig, setFlowConfig] = useState<FlowConfiguration>({
    name: '',
    slug: '',
    theme: 'gold',
    affiliateId: undefined,
    coverPage: {
      title: '',
      subtitle: '',
      logoUrl: '',
      backgroundImageUrl: '',
      backgroundVideoUrl: '',
      features: [
        { emoji: '⭐', title: 'Premium Quality', description: 'Top-tier products and service' },
        { emoji: '🚀', title: 'Fast Delivery', description: 'Quick and reliable shipping' },
        { emoji: '💎', title: 'Best Value', description: 'Unbeatable prices and deals' }
      ],
      buttons: [
        { text: 'Order Now', type: 'primary', url: '/delivery' },
        { text: 'Learn More', type: 'secondary', url: '/about' }
      ]
    },
    deliveryApp: {
      title: '',
      subtitle: '',
      logoUrl: '',
      backgroundImageUrl: '',
      backgroundVideoUrl: '',
      collections: [],
      categories: []
    },
    postCheckout: {
      title: '',
      subtitle: '',
      logoUrl: '',
      backgroundImageUrl: '',
      backgroundVideoUrl: '',
      thankYouMessage: 'Thank you for your order!',
      nextSteps: ['Order confirmation sent', 'Prepare for delivery', 'Track your order']
    }
  });

  // Available collections for delivery app
  const [availableCollections, setAvailableCollections] = useState<Array<{ handle: string; title: string }>>([]);

  useEffect(() => {
    if (open) {
      loadAvailableCollections();
    }
  }, [open]);

  const loadAvailableCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_collections_cache')
        .select('handle, title')
        .order('title');

      if (error) throw error;
      setAvailableCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'flow';
  };

  const handleFlowNameChange = (name: string) => {
    setFlowConfig(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      // Auto-populate titles with flow name if they're empty
      coverPage: {
        ...prev.coverPage,
        title: prev.coverPage.title || name
      },
      deliveryApp: {
        ...prev.deliveryApp,
        title: prev.deliveryApp.title || `${name} - Shop`
      },
      postCheckout: {
        ...prev.postCheckout,
        title: prev.postCheckout.title || `${name} - Order Complete`
      }
    }));
  };

  const applyThemeToAllComponents = (theme: 'original' | 'gold' | 'platinum') => {
    setFlowConfig(prev => ({ ...prev, theme }));
  };

  const createCompleteFlow = async () => {
    if (!flowConfig.name.trim()) {
      toast({
        title: 'Error',
        description: 'Flow name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create Cover Page
      const coverPageData = {
        title: flowConfig.coverPage.title,
        subtitle: flowConfig.coverPage.subtitle,
        slug: `${flowConfig.slug}-cover`,
        logo_url: flowConfig.coverPage.logoUrl || null,
        bg_image_url: flowConfig.coverPage.backgroundImageUrl || null,
        bg_video_url: flowConfig.coverPage.backgroundVideoUrl || null,
        unified_theme: flowConfig.theme,
        theme: flowConfig.theme,
        checklist: flowConfig.coverPage.features,
        buttons: flowConfig.coverPage.buttons,
        is_active: true,
        styles: {},
        affiliate_id: flowConfig.affiliateId || null
      };

      const { data: coverPage, error: coverError } = await supabase
        .from('cover_pages')
        .insert(coverPageData)
        .select()
        .single();

      if (coverError) throw coverError;

      // Create Delivery App
      const deliveryAppData = {
        app_name: flowConfig.deliveryApp.title,
        app_slug: flowConfig.slug,
        page_title: flowConfig.deliveryApp.title,
        page_subtitle: flowConfig.deliveryApp.subtitle,
        logo_url: flowConfig.deliveryApp.logoUrl || null,
        bg_image_url: flowConfig.deliveryApp.backgroundImageUrl || null,
        bg_video_url: flowConfig.deliveryApp.backgroundVideoUrl || null,
        unified_theme: flowConfig.theme,
        theme: flowConfig.theme,
        is_active: true,
        is_homepage: false,
        collections: flowConfig.deliveryApp.collections,
        categories: flowConfig.deliveryApp.categories,
        styles: {}
      };

      const { data: deliveryApp, error: deliveryError } = await supabase
        .from('delivery_app_variations')
        .insert(deliveryAppData)
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // Create Post-Checkout Page
      const postCheckoutData = {
        name: flowConfig.postCheckout.title,
        slug: `${flowConfig.slug}-complete`,
        logo_url: flowConfig.postCheckout.logoUrl || null,
        bg_image_url: flowConfig.postCheckout.backgroundImageUrl || null,
        bg_video_url: flowConfig.postCheckout.backgroundVideoUrl || null,
        unified_theme: flowConfig.theme,
        theme: flowConfig.theme,
        content: {
          title: flowConfig.postCheckout.title,
          subtitle: flowConfig.postCheckout.subtitle,
          thankYouMessage: flowConfig.postCheckout.thankYouMessage,
          nextSteps: flowConfig.postCheckout.nextSteps
        },
        is_active: true,
        is_default: false
      };

      const { data: postCheckout, error: postError } = await supabase
        .from('post_checkout_pages')
        .insert(postCheckoutData)
        .select()
        .single();

      if (postError) throw postError;

      // Create theme assignment in customer_flows (since flow_themes doesn't exist in schema)
      const flowData = {
        name: flowConfig.name,
        slug: flowConfig.slug,
        cover_page_id: coverPage.id,
        delivery_app_id: deliveryApp.id,
        post_checkout_id: postCheckout.id,
        is_active: true,
        is_default: false
      };

      const { error: flowError } = await supabase
        .from('customer_flows')
        .insert(flowData);

      if (flowError) throw flowError;

      toast({
        title: 'Success!',
        description: `Complete flow "${flowConfig.name}" created successfully`
      });

      // Generate live URLs
      const baseUrl = window.location.origin;
      const liveUrls = {
        coverPage: `${baseUrl}/cover/${coverPage.slug}`,
        deliveryApp: `${baseUrl}/${deliveryApp.app_slug}`,
        postCheckout: `${baseUrl}/order-complete/${postCheckout.slug}`
      };

      console.log('Live URLs created:', liveUrls);

      onFlowCreated();
      onOpenChange(false);

      // Reset form
      setFlowConfig({
        name: '',
        slug: '',
        theme: 'gold',
        affiliateId: undefined,
        coverPage: {
          title: '',
          subtitle: '',
          logoUrl: '',
          backgroundImageUrl: '',
          backgroundVideoUrl: '',
          features: [
            { emoji: '⭐', title: 'Premium Quality', description: 'Top-tier products and service' },
            { emoji: '🚀', title: 'Fast Delivery', description: 'Quick and reliable shipping' },
            { emoji: '💎', title: 'Best Value', description: 'Unbeatable prices and deals' }
          ],
          buttons: [
            { text: 'Order Now', type: 'primary', url: '/delivery' },
            { text: 'Learn More', type: 'secondary', url: '/about' }
          ]
        },
        deliveryApp: {
          title: '',
          subtitle: '',
          logoUrl: '',
          backgroundImageUrl: '',
          backgroundVideoUrl: '',
          collections: [],
          categories: []
        },
        postCheckout: {
          title: '',
          subtitle: '',
          logoUrl: '',
          backgroundImageUrl: '',
          backgroundVideoUrl: '',
          thankYouMessage: 'Thank you for your order!',
          nextSteps: ['Order confirmation sent', 'Prepare for delivery', 'Track your order']
        }
      });

    } catch (error: any) {
      console.error('Flow creation error:', error);
      toast({
        title: 'Creation failed',
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
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogDescription id="dialog-description" className="sr-only">
              Create a comprehensive customer flow with cover page, delivery app, and post-checkout experience.
            </DialogDescription>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Workflow className="w-6 h-6" />
                  Create Complete Customer Flow
                </h2>
                <p className="text-sm text-muted-foreground font-normal">
                  Build a cohesive customer journey from cover page to post-checkout
                </p>
              </div>
              <Button
                onClick={createCompleteFlow}
                disabled={isLoading || !flowConfig.name}
                size="sm"
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Creating...' : 'Create Flow'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                  <TabsTrigger value="setup" className="flex items-center gap-2 text-xs">
                    <Settings className="w-4 h-4" />
                    Setup
                  </TabsTrigger>
                  <TabsTrigger value="cover" className="flex items-center gap-2 text-xs">
                    Cover Page
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="flex items-center gap-2 text-xs">
                    Delivery App
                  </TabsTrigger>
                  <TabsTrigger value="checkout" className="flex items-center gap-2 text-xs">
                    Post-Checkout
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2 text-xs">
                    <Palette className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Setup Tab */}
              <TabsContent value="setup" className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Flow Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="flow-name">Flow Name *</Label>
                        <Input
                          id="flow-name"
                          value={flowConfig.name}
                          onChange={(e) => handleFlowNameChange(e.target.value)}
                          placeholder="Premium Wine Delivery"
                        />
                        {flowConfig.slug && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Slug: <code>{flowConfig.slug}</code>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Global Theme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.values(UNIFIED_THEMES).map((themeConfig) => (
                          <div 
                            key={themeConfig.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              flowConfig.theme === themeConfig.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => applyThemeToAllComponents(themeConfig.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{themeConfig.name}</h3>
                              <Badge variant={flowConfig.theme === themeConfig.id ? 'default' : 'secondary'}>
                                {flowConfig.theme === themeConfig.id ? 'Selected' : 'Select'}
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

                  <FlowAffiliateAssignment
                    selectedAffiliate={flowConfig.affiliateId}
                    onAffiliateChange={(affiliateId) => setFlowConfig(prev => ({ ...prev, affiliateId: affiliateId || undefined }))}
                    customSlug={flowConfig.slug}
                    onCustomSlugChange={(slug) => setFlowConfig(prev => ({ ...prev, slug }))}
                    enableTracking={!!flowConfig.affiliateId}
                    onEnableTrackingChange={(enabled) => {
                      if (!enabled) {
                        setFlowConfig(prev => ({ ...prev, affiliateId: undefined }));
                      }
                    }}
                  />
                </div>
              </TabsContent>

              {/* Other tabs would continue here... */}
              
              {/* Preview Tab */}
              <TabsContent value="preview" className="flex-1 overflow-hidden p-6">
                <div className="h-full">
                  <ResponsivePreview title="Flow Preview">
                    <div className="p-8 text-center">
                      <h2 className="text-2xl font-bold mb-4">Flow Preview</h2>
                      <p className="text-muted-foreground mb-6">
                        Complete flow with theme: <Badge>{UNIFIED_THEMES[flowConfig.theme].name}</Badge>
                      </p>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold">Cover Page</h3>
                          <p className="text-sm text-muted-foreground">{flowConfig.coverPage.title}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold">Delivery App</h3>
                          <p className="text-sm text-muted-foreground">{flowConfig.deliveryApp.title}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold">Post-Checkout</h3>
                          <p className="text-sm text-muted-foreground">{flowConfig.postCheckout.title}</p>
                        </div>
                      </div>
                    </div>
                  </ResponsivePreview>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
