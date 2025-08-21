import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditableCoverScreen } from "@/components/enhanced-cover/EditableCoverScreen";
import { Loader2, Save, Plus, Eye } from 'lucide-react';

export const EmbeddedCoverPageCreator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  // Form fields
  const [title, setTitle] = useState('Amazing Products & Services');
  const [subtitle, setSubtitle] = useState('Get premium quality products delivered to your door');
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
  const [buttons, setButtons] = useState([
    { text: 'Order Now', type: 'primary' as const, url: '/delivery' },
    { text: 'Learn More', type: 'secondary' as const, url: '/about' }
  ]);
  const [isActive, setIsActive] = useState(true);

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
          features: features.map(f => ({ emoji: f.emoji }))
        }),
        is_active: isActive
      };

      const { error } = await supabase
        .from('cover_pages')
        .insert(coverPageData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Cover page created! Available at /${slug}`,
      });

      // Reset form
      setTitle('Amazing Products & Services');
      setSubtitle('Get premium quality products delivered to your door');
      setLogoUrl('');
      setBackgroundImageUrl('');
      setBackgroundVideoUrl('');

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Visual Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoEmoji">Logo Emoji (if no URL)</Label>
                <Input
                  id="logoEmoji"
                  value={logoEmoji}
                  onChange={(e) => setLogoEmoji(e.target.value)}
                  placeholder="🎉"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImage">Background Image URL</Label>
              <Input
                id="backgroundImage"
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                placeholder="https://example.com/background.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Preview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Cover Page
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="w-full h-96 scale-[0.6] origin-top" style={{ width: '166.67%', height: '600px' }}>
                  <EditableCoverScreen
                    title={title}
                    subtitle={subtitle}
                    logoUrl={logoUrl}
                    logoEmoji={logoEmoji}
                    backgroundImageUrl={backgroundImageUrl}
                    backgroundVideoUrl={backgroundVideoUrl}
                    features={features}
                    buttons={buttons.map(btn => ({
                      ...btn,
                      onClick: () => console.log(`Button clicked: ${btn.text}`)
                    }))}
                    variant={variant}
                    standalone={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};