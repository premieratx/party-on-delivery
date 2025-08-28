import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Eye, 
  Upload, 
  Palette, 
  Smartphone, 
  Tablet, 
  Monitor,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';
import { CANONICAL_DOMAIN } from '@/utils/links';

interface EnhancedPostCheckoutCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

const THEMES = {
  success: { name: 'Success Green', color: '#22c55e' },
  celebration: { name: 'Celebration Gold', color: '#f59e0b' },
  premium: { name: 'Premium Blue', color: '#3b82f6' },
  elegant: { name: 'Elegant Purple', color: '#8b5cf6' }
};

const VARIANTS = {
  original: { name: 'Original', description: 'Clean and minimal' },
  gold: { name: 'Gold Premium', description: 'Luxury gold accents' },
  platinum: { name: 'Platinum Elite', description: 'Premium platinum theme' }
};

const DEVICE_CONFIGS = {
  mobile: { name: 'Mobile', icon: Smartphone, className: 'w-[375px] h-[600px]' },
  tablet: { name: 'Tablet', icon: Tablet, className: 'w-[768px] h-[600px]' },
  desktop: { name: 'Desktop', icon: Monitor, className: 'w-[1024px] h-[600px]' }
};

const MOCK_ORDER_DATA = {
  orderNumber: 'ORD-2024-001',
  orderItems: [
    { name: 'Premium Product A', price: 29.99, quantity: 2, image: '/api/placeholder/60/60' },
    { name: 'Premium Product B', price: 19.99, quantity: 1, image: '/api/placeholder/60/60' }
  ],
  subtotal: 79.97,
  deliveryFee: 15.00,
  total: 94.97,
  deliveryInfo: {
    address: '123 Main St, Austin, TX 78701',
    date: 'Today',
    time: '2:00 PM - 4:00 PM',
    instructions: 'Leave at front door'
  }
};

const EnhancedPostCheckoutCreator: React.FC<EnhancedPostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  
  // Form state - Enhanced version based on PremiumOrderComplete
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('Order Confirmed! 🎉');
  const [subtitle, setSubtitle] = useState('Thank you for choosing our premium service. Your order is being prepared with the utmost care.');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState<keyof typeof THEMES>('celebration');
  const [variant, setVariant] = useState<keyof typeof VARIANTS>('gold');
  
  // Button configuration
  const [primaryButtonText, setPrimaryButtonText] = useState('Track My Order');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('/orders');
  const [primaryButtonColor, setPrimaryButtonColor] = useState('#d4af37');
  const [primaryButtonTextColor, setPrimaryButtonTextColor] = useState('#000000');
  
  const [secondaryButtonText, setSecondaryButtonText] = useState('Continue Premium Shopping');
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState('/checkout');
  const [secondaryButtonColor, setSecondaryButtonColor] = useState('#8b5cf6');
  const [secondaryButtonTextColor, setSecondaryButtonTextColor] = useState('#ffffff');
  
  // Display options
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(true);
  
  // Enhanced features
  const [nextStepsMessage, setNextStepsMessage] = useState("Your order is now in our fulfillment queue. You'll receive SMS and email updates as we prepare and deliver your items.");
  const [supportPhone, setSupportPhone] = useState('+1 (512) 555-0123');
  const [supportEmail, setSupportEmail] = useState('concierge@premiumdelivery.com');
  const [supportHours, setSupportHours] = useState('Available 24/7 for our premium clients');
  
  // Testimonial
  const [testimonialEnabled, setTestimonialEnabled] = useState(true);
  const [testimonialText, setTestimonialText] = useState('Absolutely incredible service! The attention to detail and speed of delivery exceeded all expectations. This is luxury convenience at its finest.');
  const [testimonialAuthor, setTestimonialAuthor] = useState('Sarah M., Austin');
  const [testimonialRating, setTestimonialRating] = useState(5);
  
  // Animation settings
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [celebrationEffect, setCelebrationEffect] = useState(true);

  // Load initial data
  React.useEffect(() => {
    if (initial && open) {
      console.log('Loading initial post-checkout data:', initial);
      setName(initial.name || '');
      setSlug(initial.slug || '');
      
      const content = typeof initial.content === 'string' ? 
        JSON.parse(initial.content) : initial.content || {};
      
      setTitle(content.title || initial.name || 'Order Confirmed! 🎉');
      setSubtitle(content.subtitle || 'Thank you for choosing our premium service.');
      setLogoUrl(content.logo_url || initial.logo_url || '');
      setTheme(content.theme || 'celebration');
      setVariant(content.variant || 'gold');
      
      // Load button configurations
      setPrimaryButtonText(content.primary_button_text || 'Track My Order');
      setPrimaryButtonUrl(content.primary_button_url || '/orders');
      setPrimaryButtonColor(content.primary_button_color || '#d4af37');
      setPrimaryButtonTextColor(content.primary_button_text_color || '#000000');
      
      setSecondaryButtonText(content.secondary_button_text || 'Continue Shopping');
      setSecondaryButtonUrl(content.secondary_button_url || '/checkout');
      setSecondaryButtonColor(content.secondary_button_color || '#8b5cf6');
      setSecondaryButtonTextColor(content.secondary_button_text_color || '#ffffff');
      
      // Load display options
      setShowOrderDetails(content.show_order_details !== false);
      setShowDeliveryInfo(content.show_delivery_info !== false);
      setShowShareOptions(content.show_share_options || false);
      
      // Load enhanced features
      setNextStepsMessage(content.nextStepsMessage || "Your order is now in our fulfillment queue.");
      setSupportPhone(content.supportContact?.phone || '+1 (512) 555-0123');
      setSupportEmail(content.supportContact?.email || 'concierge@premiumdelivery.com');
      setSupportHours(content.supportContact?.hours || 'Available 24/7 for our premium clients');
      
      // Load testimonial
      setTestimonialEnabled(content.testimonial?.enabled !== false);
      setTestimonialText(content.testimonial?.text || 'Absolutely incredible service!');
      setTestimonialAuthor(content.testimonial?.author || 'Sarah M., Austin');
      setTestimonialRating(content.testimonial?.rating || 5);
      
      // Load animations
      setAnimationsEnabled(content.animations?.enabled !== false);
      setCelebrationEffect(content.animations?.celebrationEffect !== false);
    } else if (open && !initial) {
      // Reset for new post-checkout page
      resetForm();
    }
  }, [initial, open]);

  const resetForm = () => {
    setName('');
    setSlug('');
    setTitle('Order Confirmed! 🎉');
    setSubtitle('Thank you for choosing our premium service. Your order is being prepared with the utmost care.');
    setLogoUrl('');
    setTheme('celebration');
    setVariant('gold');
    setPrimaryButtonText('Track My Order');
    setPrimaryButtonUrl('/orders');
    setPrimaryButtonColor('#d4af37');
    setPrimaryButtonTextColor('#000000');
    setSecondaryButtonText('Continue Premium Shopping');
    setSecondaryButtonUrl('/checkout');
    setSecondaryButtonColor('#8b5cf6');
    setSecondaryButtonTextColor('#ffffff');
    setShowOrderDetails(true);
    setShowDeliveryInfo(true);
    setShowShareOptions(true);
    setNextStepsMessage("Your order is now in our fulfillment queue. You'll receive SMS and email updates as we prepare and deliver your items.");
    setSupportPhone('+1 (512) 555-0123');
    setSupportEmail('concierge@premiumdelivery.com');
    setSupportHours('Available 24/7 for our premium clients');
    setTestimonialEnabled(true);
    setTestimonialText('Absolutely incredible service! The attention to detail and speed of delivery exceeded all expectations. This is luxury convenience at its finest.');
    setTestimonialAuthor('Sarah M., Austin');
    setTestimonialRating(5);
    setAnimationsEnabled(true);
    setCelebrationEffect(true);
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  React.useEffect(() => {
    if (name && !initial) {
      setSlug(generateSlug(name));
    }
  }, [name, initial]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a page name.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const content = {
        title,
        subtitle,
        logo_url: logoUrl,
        theme,
        variant,
        primary_button_text: primaryButtonText,
        primary_button_url: primaryButtonUrl,
        primary_button_color: primaryButtonColor,
        primary_button_text_color: primaryButtonTextColor,
        secondary_button_text: secondaryButtonText,
        secondary_button_url: secondaryButtonUrl,
        secondary_button_color: secondaryButtonColor,
        secondary_button_text_color: secondaryButtonTextColor,
        show_order_details: showOrderDetails,
        show_delivery_info: showDeliveryInfo,
        show_share_options: showShareOptions,
        nextStepsMessage,
        supportContact: {
          phone: supportPhone,
          email: supportEmail,
          hours: supportHours
        },
        testimonial: {
          enabled: testimonialEnabled,
          text: testimonialText,
          author: testimonialAuthor,
          rating: testimonialRating
        },
        animations: {
          enabled: animationsEnabled,
          celebrationEffect,
          entranceAnimation: 'fade'
        }
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('post_checkout_pages')
          .update({
            name,
            slug,
            content,
            logo_url: logoUrl,
            theme
          })
          .eq('id', initial.id);

        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "Post-checkout page updated successfully."
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('post_checkout_pages')
          .insert({
            name,
            slug,
            content,
            logo_url: logoUrl,
            theme,
            is_active: true,
            is_default: false
          });

        if (error) throw error;
        
        toast({
          title: "Success!",
          description: `Enhanced post-checkout page "${name}" created successfully!`
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving post-checkout page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post-checkout page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0" aria-describedby="dialog-description">
        <DialogDescription className="sr-only">
          Enhanced post-checkout page creation interface
        </DialogDescription>
        <DialogHeader className="sticky top-0 bg-background z-10 border-b pb-4">
          <DialogTitle className="text-xl font-semibold">
            {initial ? 'Edit Post-Checkout Page' : 'Create Post-Checkout Page'}  
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Configure your post-checkout page content and appearance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-100px)]">
          <Tabs defaultValue="content" className="flex-1 flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="content" className="h-full overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Page Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Premium Order Complete"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="premium-order-complete"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {slug && `${CANONICAL_DOMAIN}/post-checkout/${slug}`}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Main Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Order Confirmed! 🎉"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Thank you for choosing our premium service..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryButtonText">Primary Button Text</Label>
                    <Input
                      id="primaryButtonText"
                      value={primaryButtonText}
                      onChange={(e) => setPrimaryButtonText(e.target.value)}
                      placeholder="Track My Order"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryButtonUrl">Primary Button URL</Label>
                    <Input
                      id="primaryButtonUrl"
                      value={primaryButtonUrl}
                      onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                      placeholder="/orders"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secondaryButtonText">Secondary Button Text</Label>
                    <Input
                      id="secondaryButtonText"
                      value={secondaryButtonText}
                      onChange={(e) => setSecondaryButtonText(e.target.value)}
                      placeholder="Continue Shopping"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryButtonUrl">Secondary Button URL</Label>
                    <Input
                      id="secondaryButtonUrl"
                      value={secondaryButtonUrl}
                      onChange={(e) => setSecondaryButtonUrl(e.target.value)}
                      placeholder="/checkout"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design" className="h-full overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={(value: keyof typeof THEMES) => setTheme(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(THEMES).map(([key, theme]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: theme.color }}
                              />
                              {theme.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Variant</Label>
                    <Select value={variant} onValueChange={(value: keyof typeof VARIANTS) => setVariant(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VARIANTS).map(([key, variant]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{variant.name}</div>
                              <div className="text-xs text-muted-foreground">{variant.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryButtonColor">Primary Button Color</Label>
                    <Input
                      id="primaryButtonColor"
                      type="color"
                      value={primaryButtonColor}
                      onChange={(e) => setPrimaryButtonColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryButtonTextColor">Primary Button Text</Label>
                    <Input
                      id="primaryButtonTextColor"
                      type="color"
                      value={primaryButtonTextColor}
                      onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secondaryButtonColor">Secondary Button Color</Label>
                    <Input
                      id="secondaryButtonColor"
                      type="color"
                      value={secondaryButtonColor}
                      onChange={(e) => setSecondaryButtonColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryButtonTextColor">Secondary Button Text</Label>
                    <Input
                      id="secondaryButtonTextColor"
                      type="color"
                      value={secondaryButtonTextColor}
                      onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="h-full overflow-y-auto p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showOrderDetails">Show Order Details</Label>
                    <Switch
                      id="showOrderDetails"
                      checked={showOrderDetails}
                      onCheckedChange={setShowOrderDetails}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDeliveryInfo">Show Delivery Info</Label>
                    <Switch
                      id="showDeliveryInfo"
                      checked={showDeliveryInfo}
                      onCheckedChange={setShowDeliveryInfo}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showShareOptions">Show Share Options</Label>
                    <Switch
                      id="showShareOptions"
                      checked={showShareOptions}
                      onCheckedChange={setShowShareOptions}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nextStepsMessage">Next Steps Message</Label>
                  <Textarea
                    id="nextStepsMessage"
                    value={nextStepsMessage}
                    onChange={(e) => setNextStepsMessage(e.target.value)}
                    placeholder="Your order is now in our fulfillment queue..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="+1 (512) 555-0123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportHours">Support Hours</Label>
                    <Input
                      id="supportHours"
                      value={supportHours}
                      onChange={(e) => setSupportHours(e.target.value)}
                      placeholder="Available 24/7"
                    />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex items-center justify-between w-full">
                        <span>Customer Testimonial</span>
                        <Switch
                          checked={testimonialEnabled}
                          onCheckedChange={setTestimonialEnabled}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {testimonialEnabled && (
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="testimonialText">Testimonial Text</Label>
                        <Textarea
                          id="testimonialText"
                          value={testimonialText}
                          onChange={(e) => setTestimonialText(e.target.value)}
                          placeholder="Customer testimonial..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="testimonialAuthor">Author</Label>
                          <Input
                            id="testimonialAuthor"
                            value={testimonialAuthor}
                            onChange={(e) => setTestimonialAuthor(e.target.value)}
                            placeholder="Customer Name, Location"
                          />
                        </div>
                        <div>
                          <Label htmlFor="testimonialRating">Rating (1-5)</Label>
                          <Input
                            id="testimonialRating"
                            type="number"
                            min="1"
                            max="5"
                            value={testimonialRating}
                            onChange={(e) => setTestimonialRating(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Animations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="animationsEnabled">Enable Animations</Label>
                      <Switch
                        id="animationsEnabled"
                        checked={animationsEnabled}
                        onCheckedChange={setAnimationsEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="celebrationEffect">Celebration Effect</Label>
                      <Switch
                        id="celebrationEffect"
                        checked={celebrationEffect}
                        onCheckedChange={setCelebrationEffect}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="h-full overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    {Object.entries(DEVICE_CONFIGS).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={previewDevice === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewDevice(key as keyof typeof DEVICE_CONFIGS)}
                        className="flex items-center gap-2"
                      >
                        <config.icon className="w-4 h-4" />
                        {config.name}
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <div className={`${DEVICE_CONFIGS[previewDevice].className} border rounded-lg overflow-hidden bg-white shadow-lg`}>
                      <PremiumOrderComplete
                        title={title}
                        subtitle={subtitle}
                        logoUrl={logoUrl}
                        orderNumber={MOCK_ORDER_DATA.orderNumber}
                        orderItems={MOCK_ORDER_DATA.orderItems}
                        subtotal={MOCK_ORDER_DATA.subtotal}
                        deliveryFee={MOCK_ORDER_DATA.deliveryFee}
                        total={MOCK_ORDER_DATA.total}
                        deliveryInfo={MOCK_ORDER_DATA.deliveryInfo}
                        primaryButton={{
                          text: primaryButtonText,
                          url: primaryButtonUrl,
                          color: primaryButtonColor,
                          textColor: primaryButtonTextColor
                        }}
                        secondaryButton={{
                          text: secondaryButtonText,
                          url: secondaryButtonUrl,
                          color: secondaryButtonColor,
                          textColor: secondaryButtonTextColor
                        }}
                        showOrderDetails={showOrderDetails}
                        showDeliveryInfo={showDeliveryInfo}
                        showShareOptions={showShareOptions}
                        theme={theme}
                        variant={variant}
                        standalone={true}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between items-center p-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {initial ? 'Update' : 'Create'} Page
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPostCheckoutCreator;