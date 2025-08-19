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
import { Loader2, Save, Plus } from 'lucide-react';

interface UnifiedBuilderProps {
  onSuccess?: () => void;
}

export const UnifiedCoverPostCheckoutBuilder: React.FC<UnifiedBuilderProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCoverPage, setSelectedCoverPage] = useState<any>(null);
  const [coverPages, setCoverPages] = useState<any[]>([]);
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
        // Create new cover page
        const { error: coverError } = await supabase
          .from('cover_pages')
          .insert({
            title: coverTitle,
            subtitle: coverSubtitle,
            slug: slug,
            logo_url: coverLogoUrl,
            bg_image_url: coverBgImageUrl,
            bg_video_url: coverBgVideoUrl,
            checklist: [],
            buttons: [{
              text: postCheckoutButtonText,
              type: 'url',
              url: postCheckoutButtonUrl || `/${slug}`
            }],
            is_active: true
          });

        if (coverError) throw coverError;

        toast({
          title: "Success!",
          description: `Cover page created successfully! Available at /${slug}`,
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
            bg_video_url: coverBgVideoUrl
          })
          .eq('id', selectedCoverPage.id);

        if (updateError) throw updateError;

        toast({
          title: "Success!",
          description: "Cover page updated successfully!",
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
          <h3 className="text-lg font-medium">Cover Page & Post-Checkout Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create cover pages and configure post-checkout experiences
          </p>
        </div>
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
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {!isCreating && coverPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Cover Page to Edit</CardTitle>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isCreating ? 'Create Cover Page' : 'Update Cover Page'}
        </Button>
      </div>
    </div>
  );
};