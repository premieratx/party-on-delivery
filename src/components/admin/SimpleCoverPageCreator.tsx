import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditableCoverScreen } from "@/components/enhanced-cover/EditableCoverScreen";
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface SimpleCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const SimpleCoverPageCreator: React.FC<SimpleCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form fields
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
  const [buttons, setButtons] = useState([
    { text: 'Order Now', type: 'primary' as const, url: '/delivery' },
    { text: 'Learn More', type: 'secondary' as const, url: '/about' }
  ]);
  const [isActive, setIsActive] = useState(true);

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(80); // pixels
  const [headlineSize, setHeadlineSize] = useState(48); // pixels
  const [logoVerticalPos, setLogoVerticalPos] = useState(0); // margin-top in rem
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0); // margin-top in rem
  const [subtitleVerticalPos, setSubtitleVerticalPos] = useState(0); // margin-top in rem
  const [featuresVerticalPos, setFeaturesVerticalPos] = useState(0); // margin-top in rem
  const [buttonsVerticalPos, setButtonsVerticalPos] = useState(0); // margin-top in rem

  // Load initial data
  useEffect(() => {
    if (initial && open) {
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
        setButtons(parsedButtons);
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
      }
    }
  }, [initial, open]);

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
            buttonsVerticalPos
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
          description: `Cover page created! Available at /${slug}`,
        });
      }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? 'Edit Cover Page' : 'Create Cover Page'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Content Form */}
          <div className="w-1/2 space-y-6 overflow-y-auto pr-4">
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

                <div className="space-y-2">
                  <Label htmlFor="backgroundVideo">Background Video URL</Label>
                  <Input
                    id="backgroundVideo"
                    value={backgroundVideoUrl}
                    onChange={(e) => setBackgroundVideoUrl(e.target.value)}
                    placeholder="https://example.com/background.mp4"
                  />
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
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttons.map((button, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end">
                    <div className="space-y-2">
                      <Label>Text</Label>
                      <Input
                        value={button.text}
                        onChange={(e) => {
                          const newButtons = [...buttons];
                          newButtons[index].text = e.target.value;
                          setButtons(newButtons);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={button.type} 
                        onValueChange={(value: 'primary' | 'secondary') => {
                          const newButtons = [...buttons];
                          newButtons[index].type = value;
                          setButtons(newButtons);
                        }}
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
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={button.url || ''}
                        onChange={(e) => {
                          const newButtons = [...buttons];
                          newButtons[index].url = e.target.value;
                          setButtons(newButtons);
                        }}
                        placeholder="/delivery"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Size Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Size: {logoSize}px</Label>
                  <Slider
                    value={[logoSize]}
                    onValueChange={(value) => setLogoSize(value[0])}
                    min={40}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Headline Size: {headlineSize}px</Label>
                  <Slider
                    value={[headlineSize]}
                    onValueChange={(value) => setHeadlineSize(value[0])}
                    min={24}
                    max={80}
                    step={2}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vertical Positioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Position: {logoVerticalPos}rem</Label>
                  <Slider
                    value={[logoVerticalPos]}
                    onValueChange={(value) => setLogoVerticalPos(value[0])}
                    min={-5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Headline Position: {headlineVerticalPos}rem</Label>
                  <Slider
                    value={[headlineVerticalPos]}
                    onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                    min={-5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Subtitle Position: {subtitleVerticalPos}rem</Label>
                  <Slider
                    value={[subtitleVerticalPos]}
                    onValueChange={(value) => setSubtitleVerticalPos(value[0])}
                    min={-5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Features Position: {featuresVerticalPos}rem</Label>
                  <Slider
                    value={[featuresVerticalPos]}
                    onValueChange={(value) => setFeaturesVerticalPos(value[0])}
                    min={-5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Buttons Position: {buttonsVerticalPos}rem</Label>
                  <Slider
                    value={[buttonsVerticalPos]}
                    onValueChange={(value) => setButtonsVerticalPos(value[0])}
                    min={-5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
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

            <div className="flex justify-end space-x-2 pb-6">
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
          <div className="w-1/2 border-l pl-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Live Preview</h3>
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
                      ...btn,
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
      </DialogContent>
    </Dialog>
  );
};