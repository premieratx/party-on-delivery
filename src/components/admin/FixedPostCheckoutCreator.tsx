import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Save, Loader2, ShoppingBag, UserCheck, Eye, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostCheckoutCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

const THEMES = [
  { value: 'success', label: 'Success Green', color: '#22c55e' },
  { value: 'celebration', label: 'Celebration Gold', color: '#f59e0b' },
  { value: 'premium', label: 'Premium Blue', color: '#3b82f6' },
  { value: 'elegant', label: 'Elegant Purple', color: '#8b5cf6' }
];

export const FixedPostCheckoutCreator: React.FC<PostCheckoutCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('Order Confirmed!');
  const [subtitle, setSubtitle] = useState('Thank you for your order. We\'ll get started on it right away.');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState('success');
  const [continueShoppingText, setContinueShoppingText] = useState('Continue Shopping');
  const [continueShoppingUrl, setContinueShoppingUrl] = useState('/');
  const [manageOrderText, setManageOrderText] = useState('Manage Order');
  const [manageOrderUrl, setManageOrderUrl] = useState('/orders');
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  
  // Loading state
  const [saving, setSaving] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || 'Order Confirmed!');
      setSubtitle(initial.subtitle || 'Thank you for your order. We\'ll get started on it right away.');
      setSlug(initial.slug || '');
      setLogoUrl(initial.logo_url || '');
      setTheme(initial.theme || 'success');
      setContinueShoppingText(initial.continue_shopping_text || 'Continue Shopping');
      setContinueShoppingUrl(initial.continue_shopping_url || '/');
      setManageOrderText(initial.manage_order_text || 'Manage Order');
      setManageOrderUrl(initial.manage_order_url || '/orders');
      setShowOrderDetails(initial.show_order_details ?? true);
      setShowDeliveryInfo(initial.show_delivery_info ?? true);
      setIsDefault(initial.is_default ?? false);
    } else {
      // Reset for new post-checkout page
      setTitle('Order Confirmed!');
      setSubtitle('Thank you for your order. We\'ll get started on it right away.');
      setSlug('');
      setLogoUrl('');
      setTheme('success');
      setContinueShoppingText('Continue Shopping');
      setContinueShoppingUrl('/');
      setManageOrderText('Manage Order');
      setManageOrderUrl('/orders');
      setShowOrderDetails(true);
      setShowDeliveryInfo(true);
      setIsDefault(false);
    }
  }, [initial, open]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setTitle(title);
    if (!initial) {
      setSlug(generateSlug(title));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and slug",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const postCheckoutData = {
        name: title, // Using title as name since it's required
        slug,
        content: {
          title,
          subtitle,
          logo_url: logoUrl,
          theme,
          continue_shopping_text: continueShoppingText,
          continue_shopping_url: continueShoppingUrl,
          manage_order_text: manageOrderText,
          manage_order_url: manageOrderUrl,
          show_order_details: showOrderDetails,
          show_delivery_info: showDeliveryInfo,
        } as any,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('post_checkout_pages')
          .update(postCheckoutData)
          .eq('id', initial.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Post-checkout page updated successfully"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('post_checkout_pages')
          .insert(postCheckoutData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Post-checkout page created successfully"
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving post-checkout page:', error);
      toast({
        title: "Error",
        description: "Failed to save post-checkout page",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedTheme = THEMES.find(t => t.value === theme) || THEMES[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {initial ? 'Edit' : 'Create'} Post-Checkout Page
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="buttons">Buttons & Actions</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="content" className="space-y-4 h-full overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Order Confirmed!"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g., order-confirmed"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Thank you message for the customer"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((themeOption) => (
                        <SelectItem key={themeOption.value} value={themeOption.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: themeOption.color }}
                            />
                            {themeOption.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showOrderDetails}
                    onCheckedChange={setShowOrderDetails}
                  />
                  <Label>Show Order Details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showDeliveryInfo}
                    onCheckedChange={setShowDeliveryInfo}
                  />
                  <Label>Show Delivery Information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                  />
                  <Label>Set as Default</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4 h-full overflow-y-auto">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Continue Shopping Button
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={continueShoppingText}
                        onChange={(e) => setContinueShoppingText(e.target.value)}
                        placeholder="Continue Shopping"
                      />
                    </div>
                    <div>
                      <Label>Button URL</Label>
                      <Input
                        value={continueShoppingUrl}
                        onChange={(e) => setContinueShoppingUrl(e.target.value)}
                        placeholder="/"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Manage Order Button
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={manageOrderText}
                        onChange={(e) => setManageOrderText(e.target.value)}
                        placeholder="Manage Order"
                      />
                    </div>
                    <div>
                      <Label>Button URL</Label>
                      <Input
                        value={manageOrderUrl}
                        onChange={(e) => setManageOrderUrl(e.target.value)}
                        placeholder="/orders"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full bg-gradient-to-br from-background to-muted/30 rounded-lg p-8">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  {/* Success Icon */}
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: `${selectedTheme.color}20` }}>
                    <CheckCircle className="w-8 h-8" style={{ color: selectedTheme.color }} />
                  </div>

                  {/* Logo */}
                  {logoUrl && (
                    <div className="flex justify-center">
                      <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold" style={{ color: selectedTheme.color }}>
                      {title}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      {subtitle}
                    </p>
                  </div>

                  {/* Order Badge */}
                  <Badge variant="secondary" className="text-sm py-2 px-4">
                    Order #12345
                  </Badge>

                  {/* Mock Order Details */}
                  {showOrderDetails && (
                    <Card className="text-left">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Order Summary</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Premium Wine Selection</span>
                            <span>$89.99</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span>$4.99</span>
                          </div>
                          <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>$94.98</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Mock Delivery Info */}
                  {showDeliveryInfo && (
                    <Card className="text-left">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Delivery Information</h3>
                        <div className="text-sm space-y-1">
                          <p><strong>Address:</strong> 123 Main St, Austin, TX 78701</p>
                          <p><strong>Date:</strong> Today</p>
                          <p><strong>Time:</strong> 6:00 PM - 8:00 PM</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" className="px-6">
                      {continueShoppingText}
                    </Button>
                    <Button className="px-6" style={{ backgroundColor: selectedTheme.color }}>
                      {manageOrderText}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Post-Checkout Page
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};