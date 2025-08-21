import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Eye } from 'lucide-react';

// Embedded Post-Checkout Preview Component
const PostCheckoutPreview: React.FC<{
  name: string;
  content: {
    logo_url?: string;
    custom_message?: string;
    primary_button_text?: string;
    primary_button_url?: string;
    secondary_button_text?: string;
    secondary_button_url?: string;
    background_color?: string;
    text_color?: string;
  };
}> = ({ name, content }) => {
  return (
    <div 
      className="min-h-full flex items-center justify-center p-4"
      style={{ backgroundColor: content.background_color || '#ffffff' }}
    >
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        {content.logo_url && (
          <img src={content.logo_url} alt="Logo" className="h-16 w-auto mx-auto" />
        )}
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold" style={{ color: content.text_color || '#000000' }}>
            {name}
          </h1>
          <p className="text-xl" style={{ color: content.text_color || '#666666' }}>
            {content.custom_message || 'Thank you for your order!'}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          {content.primary_button_text && content.primary_button_url && (
            <button className="px-6 py-3 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90">
              {content.primary_button_text}
            </button>
          )}
          
          {content.secondary_button_text && content.secondary_button_url && (
            <button className="px-6 py-3 rounded-lg font-medium border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              {content.secondary_button_text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const EmbeddedPostCheckoutCreator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  // Form fields
  const [name, setName] = useState('Thank You for Your Order!');
  const [logoUrl, setLogoUrl] = useState('');
  const [customMessage, setCustomMessage] = useState('We\'ll contact you shortly to confirm delivery details.');
  const [primaryButtonText, setPrimaryButtonText] = useState('Order More Items');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('/delivery');
  const [secondaryButtonText, setSecondaryButtonText] = useState('Track Order');
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState('/track');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [isActive, setIsActive] = useState(true);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Page name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(name);
      const content = {
        logo_url: logoUrl,
        custom_message: customMessage,
        primary_button_text: primaryButtonText,
        primary_button_url: primaryButtonUrl,
        secondary_button_text: secondaryButtonText,
        secondary_button_url: secondaryButtonUrl,
        background_color: backgroundColor,
        text_color: textColor
      };

      const postCheckoutData = {
        name,
        slug,
        content: JSON.stringify(content),
        is_active: isActive
      };

      const { error } = await supabase
        .from('post_checkout_pages')
        .insert(postCheckoutData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Post-checkout page created! Available at /post-checkout/${slug}`,
      });

      // Reset form
      setName('Thank You for Your Order!');
      setLogoUrl('');
      setCustomMessage('We\'ll contact you shortly to confirm delivery details.');

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post-checkout page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewContent = {
    logo_url: logoUrl,
    custom_message: customMessage || 'Thank you for your order!',
    primary_button_text: primaryButtonText,
    primary_button_url: primaryButtonUrl,
    secondary_button_text: secondaryButtonText,
    secondary_button_url: secondaryButtonUrl,
    background_color: backgroundColor,
    text_color: textColor
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
              <Label htmlFor="name">Page Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Thank You for Your Order!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMessage">Custom Message</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="We'll contact you shortly to confirm delivery details."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryButtonText">Primary Button Text</Label>
                <Input
                  id="primaryButtonText"
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  placeholder="Order More Items"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryButtonUrl">Primary Button URL</Label>
                <Input
                  id="primaryButtonUrl"
                  value={primaryButtonUrl}
                  onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                  placeholder="/delivery"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secondaryButtonText">Secondary Button Text</Label>
                <Input
                  id="secondaryButtonText"
                  value={secondaryButtonText}
                  onChange={(e) => setSecondaryButtonText(e.target.value)}
                  placeholder="Track Order"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryButtonUrl">Secondary Button URL</Label>
                <Input
                  id="secondaryButtonUrl"
                  value={secondaryButtonUrl}
                  onChange={(e) => setSecondaryButtonUrl(e.target.value)}
                  placeholder="/track"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Colors & Preview</CardTitle>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Post-Checkout Page
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
                  <PostCheckoutPreview
                    name={name}
                    content={previewContent}
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