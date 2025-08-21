import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface SimplePostCheckoutCreatorProps {
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
    messages?: string[];
    primary_button_text?: string;
    primary_button_url?: string;
    secondary_button_text?: string;
    secondary_button_url?: string;
    background_color?: string;
    text_color?: string;
  };
  logoSize?: number;
  headlineSize?: number;
  positioning?: {
    logoVerticalPos?: number;
    headlineVerticalPos?: number;
    messagesVerticalPos?: number;
    buttonsVerticalPos?: number;
  };
}> = ({ name, content, logoSize = 64, headlineSize = 32, positioning = {} }) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: content.background_color || '#ffffff' }}
    >
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        {content.logo_url && (
          <div style={{ marginTop: `${positioning.logoVerticalPos || 0}rem` }}>
            <img 
              src={content.logo_url} 
              alt="Logo" 
              className="mx-auto" 
              style={{ height: `${logoSize}px`, width: 'auto' }}
            />
          </div>
        )}
        
        <div className="space-y-4" style={{ marginTop: `${positioning.headlineVerticalPos || 0}rem` }}>
          <h1 
            className="font-bold" 
            style={{ 
              color: content.text_color || '#000000',
              fontSize: `${headlineSize}px`
            }}
          >
            {name}
          </h1>
          
          <div 
            className="space-y-3"
            style={{ marginTop: `${positioning.messagesVerticalPos || 0}rem` }}
          >
            {content.messages && content.messages.length > 0 ? (
              content.messages.map((message, index) => (
                <p 
                  key={index}
                  className="text-xl" 
                  style={{ color: content.text_color || '#666666' }}
                >
                  {message}
                </p>
              ))
            ) : (
              <p className="text-xl" style={{ color: content.text_color || '#666666' }}>
                {content.custom_message || 'Thank you for your order!'}
              </p>
            )}
          </div>
        </div>

        <div 
          className="flex gap-4 justify-center"
          style={{ marginTop: `${positioning.buttonsVerticalPos || 0}rem` }}
        >
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

export const SimplePostCheckoutCreator: React.FC<SimplePostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [messages, setMessages] = useState(['']);
  const [primaryButtonText, setPrimaryButtonText] = useState('');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('');
  const [secondaryButtonText, setSecondaryButtonText] = useState('');
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [isActive, setIsActive] = useState(true);

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(64);
  const [headlineSize, setHeadlineSize] = useState(32);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [messagesVerticalPos, setMessagesVerticalPos] = useState(0);
  const [buttonsVerticalPos, setButtonsVerticalPos] = useState(0);

  // Load initial data
  useEffect(() => {
    if (initial && open) {
      setName(initial.name || '');
      setIsActive(initial.is_active !== false);

      const content = typeof initial.content === 'string' ? 
        JSON.parse(initial.content || '{}') : initial.content || {};

      setLogoUrl(content.logo_url || '');
      setCustomMessage(content.custom_message || '');
      setMessages(content.messages || ['']);
      setPrimaryButtonText(content.primary_button_text || '');
      setPrimaryButtonUrl(content.primary_button_url || '');
      setSecondaryButtonText(content.secondary_button_text || '');
      setSecondaryButtonUrl(content.secondary_button_url || '');
      setBackgroundColor(content.background_color || '#ffffff');
      setTextColor(content.text_color || '#000000');

      // Load sizing and positioning
      if (content.sizing) {
        setLogoSize(content.sizing.logoSize || 64);
        setHeadlineSize(content.sizing.headlineSize || 32);
      }
      
      if (content.positioning) {
        setLogoVerticalPos(content.positioning.logoVerticalPos || 0);
        setHeadlineVerticalPos(content.positioning.headlineVerticalPos || 0);
        setMessagesVerticalPos(content.positioning.messagesVerticalPos || 0);
        setButtonsVerticalPos(content.positioning.buttonsVerticalPos || 0);
      }
    }
  }, [initial, open]);

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
        messages: messages.filter(m => m.trim()),
        primary_button_text: primaryButtonText,
        primary_button_url: primaryButtonUrl,
        secondary_button_text: secondaryButtonText,
        secondary_button_url: secondaryButtonUrl,
        background_color: backgroundColor,
        text_color: textColor,
        sizing: {
          logoSize,
          headlineSize
        },
        positioning: {
          logoVerticalPos,
          headlineVerticalPos,
          messagesVerticalPos,
          buttonsVerticalPos
        }
      };

      const postCheckoutData = {
        name,
        slug,
        content: JSON.stringify(content),
        is_active: isActive
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('post_checkout_pages')
          .update(postCheckoutData)
          .eq('id', initial.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Post-checkout page updated successfully",
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('post_checkout_pages')
          .insert(postCheckoutData);

        if (error) throw error;

        toast({
          title: "Success!",
          description: `Post-checkout page created! Available at /post-checkout/${slug}`,
        });
      }

      onSaved?.();
      onOpenChange(false);

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
    messages: messages.filter(m => m.trim()),
    primary_button_text: primaryButtonText,
    primary_button_url: primaryButtonUrl,
    secondary_button_text: secondaryButtonText,
    secondary_button_url: secondaryButtonUrl,
    background_color: backgroundColor,
    text_color: textColor
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? 'Edit Post-Checkout Page' : 'Create Post-Checkout Page'}
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Create custom post-purchase thank you pages with personalized messages and actions.
          </DialogDescription>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => {
                        const newMessages = [...messages];
                        newMessages[index] = e.target.value;
                        setMessages(newMessages);
                      }}
                      placeholder="Additional message..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (messages.length > 1) {
                          setMessages(messages.filter((_, i) => i !== index));
                        }
                      }}
                      disabled={messages.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMessages([...messages, ''])}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Message
                </Button>

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
                <CardTitle>Styling</CardTitle>
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
                    min={32}
                    max={150}
                    step={4}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Headline Size: {headlineSize}px</Label>
                  <Slider
                    value={[headlineSize]}
                    onValueChange={(value) => setHeadlineSize(value[0])}
                    min={18}
                    max={60}
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
                    min={-4}
                    max={4}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Headline Position: {headlineVerticalPos}rem</Label>
                  <Slider
                    value={[headlineVerticalPos]}
                    onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                    min={-4}
                    max={4}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Messages Position: {messagesVerticalPos}rem</Label>
                  <Slider
                    value={[messagesVerticalPos]}
                    onValueChange={(value) => setMessagesVerticalPos(value[0])}
                    min={-4}
                    max={4}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Buttons Position: {buttonsVerticalPos}rem</Label>
                  <Slider
                    value={[buttonsVerticalPos]}
                    onValueChange={(value) => setButtonsVerticalPos(value[0])}
                    min={-4}
                    max={4}
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
                {initial?.id ? 'Update' : 'Create'} Post-Checkout Page
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="w-1/2 border-l pl-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Live Preview</h3>
              <div className="flex-1 overflow-hidden rounded-lg border bg-muted/10">
                <div className="w-full h-full scale-[0.4] origin-top-left" style={{ width: '250%', height: '250%' }}>
                  <PostCheckoutPreview
                    name={name || 'Thank You for Your Order!'}
                    content={previewContent}
                    logoSize={logoSize}
                    headlineSize={headlineSize}
                    positioning={{
                      logoVerticalPos,
                      headlineVerticalPos,
                      messagesVerticalPos,
                      buttonsVerticalPos
                    }}
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