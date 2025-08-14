import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Save, Plus, Palette } from 'lucide-react';
import { VisualCoverPageEditor } from './VisualCoverPageEditor';

interface UnifiedBuilderProps {
  onSuccess?: () => void;
}

export const UnifiedCoverPostCheckoutBuilder: React.FC<UnifiedBuilderProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCoverPage, setSelectedCoverPage] = useState<any>(null);
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const { toast } = useToast();

  // Cover Page Fields
  const [coverTitle, setCoverTitle] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverLogoUrl, setCoverLogoUrl] = useState('');
  const [coverBgImageUrl, setCoverBgImageUrl] = useState('');
  const [coverBgVideoUrl, setCoverBgVideoUrl] = useState('');

  // Post-Checkout Fields
  const [postCheckoutEnabled, setPostCheckoutEnabled] = useState(true);
  const [postCheckoutTitle, setPostCheckoutTitle] = useState('Thank You for Your Order!');
  const [postCheckoutMessage, setPostCheckoutMessage] = useState('We\'ll contact you shortly to confirm delivery details.');
  const [postCheckoutButtonText, setPostCheckoutButtonText] = useState('Order More Items');
  const [postCheckoutButtonUrl, setPostCheckoutButtonUrl] = useState('');
  const [postCheckoutTextColor, setPostCheckoutTextColor] = useState('#000000');
  const [postCheckoutBgColor, setPostCheckoutBgColor] = useState('#ffffff');

  useEffect(() => {
    loadCoverPages();
  }, []);

  const loadCoverPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverPages(data || []);
    } catch (error: any) {
      console.error('Error loading cover pages:', error);
      toast({
        title: "Error",
        description: "Failed to load cover pages.",
        variant: "destructive"
      });
    }
  };

  const handleCoverPageSelect = (coverPage: any) => {
    setSelectedCoverPage(coverPage);
    setIsCreating(false);
    
    // Load cover page data
    setCoverTitle(coverPage.title || '');
    setCoverSubtitle(coverPage.subtitle || '');
    setCoverLogoUrl(coverPage.logo_url || '');
    setCoverBgImageUrl(coverPage.bg_image_url || '');
    setCoverBgVideoUrl(coverPage.bg_video_url || '');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!coverTitle.trim()) {
      toast({
        title: "Error",
        description: "Cover page title is required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(coverTitle);

      if (isCreating) {
        // Create new cover page with integrated post-checkout config
        const { data: coverPageData, error: coverError } = await supabase
          .from('cover_pages')
          .insert({
            title: coverTitle,
            subtitle: coverSubtitle,
            slug: slug,
            logo_url: coverLogoUrl,
            bg_image_url: coverBgImageUrl,
            bg_video_url: coverBgVideoUrl,
            styles: {
              textColor: postCheckoutTextColor,
              backgroundColor: postCheckoutBgColor
            },
            buttons: [
              {
                text: postCheckoutButtonText,
                url: postCheckoutButtonUrl || `/${slug}`,
                variant: 'primary'
              }
            ],
            checklist: [],
            is_active: true,
            created_by: 'admin'
          })
          .select()
          .single();

        if (coverError) throw coverError;

        // Create corresponding delivery app variation with post-checkout config
        const { error: appError } = await supabase
          .from('delivery_app_variations')
          .insert({
            app_name: coverTitle,
            app_slug: slug,
            logo_url: coverLogoUrl,
            collections_config: {
              tabs: [],
              tab_count: 5
            },
            main_app_config: {
              hero_heading: coverTitle
            },
            start_screen_config: {
              title: coverTitle,
              subtitle: coverSubtitle
            },
            custom_post_checkout_config: {
              enabled: postCheckoutEnabled,
              title: postCheckoutTitle,
              message: postCheckoutMessage,
              cta_button_text: postCheckoutButtonText,
              cta_button_url: postCheckoutButtonUrl || `/${slug}`,
              text_color: postCheckoutTextColor,
              background_color: postCheckoutBgColor
            },
            is_active: true
          });

        if (appError) throw appError;

        toast({
          title: "Success!",
          description: `Cover page and post-checkout experience created successfully! Available at /${slug}`,
        });

      } else if (selectedCoverPage) {
        // Update existing cover page
        const { error: updateError } = await supabase
          .from('cover_pages')
          .update({
            title: coverTitle,
            subtitle: coverSubtitle,
            logo_url: coverLogoUrl,
            bg_image_url: coverBgImageUrl,
            bg_video_url: coverBgVideoUrl,
            styles: {
              textColor: postCheckoutTextColor,
              backgroundColor: postCheckoutBgColor
            },
            buttons: [
              {
                text: postCheckoutButtonText,
                url: postCheckoutButtonUrl || `/${selectedCoverPage.slug}`,
                variant: 'primary'
              }
            ]
          })
          .eq('id', selectedCoverPage.id);

        if (updateError) throw updateError;

        // Update corresponding delivery app variation
        const { error: appUpdateError } = await supabase
          .from('delivery_app_variations')
          .update({
            custom_post_checkout_config: {
              enabled: postCheckoutEnabled,
              title: postCheckoutTitle,
              message: postCheckoutMessage,
              cta_button_text: postCheckoutButtonText,
              cta_button_url: postCheckoutButtonUrl || `/${selectedCoverPage.slug}`,
              text_color: postCheckoutTextColor,
              background_color: postCheckoutBgColor
            }
          })
          .eq('app_slug', selectedCoverPage.slug);

        if (appUpdateError) throw appUpdateError;

        toast({
          title: "Success!",
          description: "Cover page and post-checkout experience updated successfully!",
        });
      }

      if (onSuccess) onSuccess();
      loadCoverPages();

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Unified Cover Page & Post-Checkout Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create cover pages and their corresponding post-checkout experiences in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(true);
              setSelectedCoverPage(null);
              setCoverTitle('');
              setCoverSubtitle('');
              setCoverLogoUrl('');
              setCoverBgImageUrl('');
              setCoverBgVideoUrl('');
              setPostCheckoutTitle('Thank You for Your Order!');
              setPostCheckoutMessage('We\'ll contact you shortly to confirm delivery details.');
              setPostCheckoutButtonText('Order More Items');
              setPostCheckoutButtonUrl('');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
          <Button
            variant="default"
            onClick={() => setShowVisualEditor(true)}
          >
            <Palette className="w-4 h-4 mr-2" />
            Visual Editor
          </Button>
        </div>
      </div>

      {!isCreating && coverPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Existing Cover Page to Edit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coverPages.map((page) => (
                <Card 
                  key={page.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedCoverPage?.id === page.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleCoverPageSelect(page)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium">{page.title}</h4>
                    <p className="text-sm text-muted-foreground">{page.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-2">/{page.slug}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cover-page" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cover-page">Cover Page Settings</TabsTrigger>
          <TabsTrigger value="post-checkout">Post-Checkout Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="cover-page" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cover Page Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={coverTitle}
                    onChange={(e) => setCoverTitle(e.target.value)}
                    placeholder="Enter cover page title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={coverSubtitle}
                    onChange={(e) => setCoverSubtitle(e.target.value)}
                    placeholder="Enter subtitle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={coverLogoUrl}
                    onChange={(e) => setCoverLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bg-image">Background Image URL</Label>
                  <Input
                    id="bg-image"
                    value={coverBgImageUrl}
                    onChange={(e) => setCoverBgImageUrl(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-video">Background Video URL (optional)</Label>
                <Input
                  id="bg-video"
                  value={coverBgVideoUrl}
                  onChange={(e) => setCoverBgVideoUrl(e.target.value)}
                  placeholder="https://example.com/background.mp4"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post-checkout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post-Checkout Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={postCheckoutEnabled}
                  onCheckedChange={setPostCheckoutEnabled}
                />
                <Label htmlFor="enabled">Enable Custom Post-Checkout Screen</Label>
              </div>

              {postCheckoutEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="post-title">Thank You Title</Label>
                    <Input
                      id="post-title"
                      value={postCheckoutTitle}
                      onChange={(e) => setPostCheckoutTitle(e.target.value)}
                      placeholder="Thank You for Your Order!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post-message">Thank You Message</Label>
                    <Textarea
                      id="post-message"
                      value={postCheckoutMessage}
                      onChange={(e) => setPostCheckoutMessage(e.target.value)}
                      placeholder="We'll contact you shortly to confirm delivery details."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="button-text">Button Text</Label>
                      <Input
                        id="button-text"
                        value={postCheckoutButtonText}
                        onChange={(e) => setPostCheckoutButtonText(e.target.value)}
                        placeholder="Order More Items"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="button-url">Button URL (optional)</Label>
                      <Input
                        id="button-url"
                        value={postCheckoutButtonUrl}
                        onChange={(e) => setPostCheckoutButtonUrl(e.target.value)}
                        placeholder="Leave empty to use cover page URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Text Color</Label>
                      <Input
                        id="text-color"
                        type="color"
                        value={postCheckoutTextColor}
                        onChange={(e) => setPostCheckoutTextColor(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bg-color">Background Color</Label>
                      <Input
                        id="bg-color"
                        type="color"
                        value={postCheckoutBgColor}
                        onChange={(e) => setPostCheckoutBgColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div 
                      className="p-6 rounded-lg text-center"
                      style={{ 
                        backgroundColor: postCheckoutBgColor,
                        color: postCheckoutTextColor
                      }}
                    >
                      <h3 className="text-xl font-bold mb-2">{postCheckoutTitle}</h3>
                      <p className="mb-4">{postCheckoutMessage}</p>
                      <Button variant="outline">
                        {postCheckoutButtonText}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isCreating ? 'Create Cover Page & Post-Checkout' : 'Update Configuration'}
        </Button>
      </div>

      {/* Visual Editor Modal */}
      <VisualCoverPageEditor
        isOpen={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onSave={(settings) => {
          setShowVisualEditor(false);
          loadCoverPages();
          toast({
            title: "Success!",
            description: "Cover page saved successfully with visual editor!",
          });
        }}
        initialData={selectedCoverPage}
        existingCoverPages={coverPages}
      />
    </div>
  );
};