import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Save, Eye, Upload, Plus, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';

interface PostCheckoutButton {
  text: string;
  url: string;
}

interface PostCheckoutConfig {
  id?: string;
  title: string;
  subtitle: string;
  logo_url?: string;
  custom_text: string;
  buttons: PostCheckoutButton[];
  background_color: string;
  text_color: string;
  is_active: boolean;
  cover_page_id?: string;
  affiliate_id?: string;
}

interface SimplifiedPostCheckoutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PostCheckoutConfig;
  onSaved?: () => void;
}

const DEFAULT_CONFIG: PostCheckoutConfig = {
  title: "Order Complete!",
  subtitle: "Thank you for your order!",
  custom_text: "Your order has been confirmed and is being prepared.",
  buttons: [
    { text: "Continue Shopping", url: "/" }
  ],
  background_color: "#ffffff",
  text_color: "#000000",
  is_active: true,
};

export const SimplifiedPostCheckoutEditor: React.FC<SimplifiedPostCheckoutEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PostCheckoutConfig>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState(false);
  const [availableAffiliates, setAvailableAffiliates] = useState<any[]>([]);
  const [availableCoverPages, setAvailableCoverPages] = useState<any[]>([]);

  useEffect(() => {
    if (initial) {
      setConfig(initial);
    } else {
      setConfig(DEFAULT_CONFIG);
    }
  }, [initial]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: coverPages } = await supabase.from('cover_pages').select('id, title, slug');
        setAvailableCoverPages(coverPages || []);
        
        // Skip affiliates to avoid 403 errors
        setAvailableAffiliates([]);
      } catch (error) {
        console.error('Error loading data:', error);
        setAvailableAffiliates([]);
        setAvailableCoverPages([]);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    console.log('💾 Saving post-checkout screen...', config);
    if (!config.title.trim()) {
      toast({
        title: "Missing title", 
        description: "Please add a title",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      if (config.id) {
        console.log('📝 Updating existing post-checkout screen:', config.id);
        const { error } = await supabase
          .from('post_checkout_screens')
          .update(config)
          .eq('id', config.id);
        
        if (error) throw error;
        toast({ title: "Post-checkout screen updated successfully!" });
      } else {
        console.log('✨ Creating new post-checkout screen');
        const configWithCoverPage = {
          ...config,
          cover_page_id: config.cover_page_id || null
        };
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert([configWithCoverPage]);
        
        if (error) throw error;
        toast({ title: "Post-checkout screen created successfully!" });
      }
      
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Save error:', error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);
      
      setConfig(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: "Logo uploaded successfully!" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addButton = () => {
    console.log('Adding post-checkout button...');
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: "New Button", url: "/" }]
    }));
  };

  const updateButton = (index: number, field: keyof PostCheckoutButton, value: string) => {
    console.log(`Updating post-checkout button ${index}, field: ${field}, value: ${value}`);
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const removeButton = (index: number) => {
    console.log(`Removing post-checkout button ${index}`);
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const renderPreview = () => (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: config.background_color }}
    >
      <Card className="w-full max-w-2xl">
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          {config.logo_url && (
            <div className="mb-4">
              <img 
                src={config.logo_url} 
                alt="Logo" 
                className="h-12 mx-auto object-contain"
              />
            </div>
          )}
          
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: config.text_color }}
          >
            {config.title}
          </h1>
          
          <p className="text-muted-foreground mb-4">
            Thank you! Your order #12345 has been confirmed.
          </p>
          
          <p 
            className="text-lg mb-6"
            style={{ color: config.text_color }}
          >
            {config.subtitle}
          </p>
        </div>
        
        <div className="px-6 pb-6">
          {/* Order Summary */}
          <div className="p-4 rounded-lg border bg-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(45.99)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatCurrency(3.99)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax</span>
                <span>{formatCurrency(4.12)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(54.10)}</span>
              </div>
            </div>
          </div>

          {/* Custom Text */}
          {config.custom_text && (
            <div className="text-center p-6 border-2 border-dashed border-primary rounded-lg mb-6">
              <p 
                className="text-lg"
                style={{ color: config.text_color }}
              >
                {config.custom_text}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {config.buttons.map((button, index) => (
              <Button 
                key={index}
                className="w-full"
                size="lg"
              >
                {button.text}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  if (previewMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0" aria-describedby="dialog-description">
          <DialogDescription className="sr-only">
            Post-checkout screen preview interface
          </DialogDescription>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Post-Checkout Screen Preview</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Edit Mode
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="h-[calc(95vh-80px)] overflow-y-auto">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0" aria-describedby="dialog-description">
        <DialogDescription className="sr-only">
          Simplified post-checkout editor interface
        </DialogDescription>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Post-Checkout Screen</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="h-[calc(95vh-80px)] overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">Logo</Label>
                  <div className="mt-2 space-y-2">
                    {config.logo_url && (
                      <div className="flex items-center gap-2">
                        <img src={config.logo_url} alt="Logo" className="h-8 object-contain" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, logo_url: '' }))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="title">Headline</Label>
                    <Input
                      id="title"
                      value={config.title}
                      onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Order Complete!"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Sub-headline</Label>
                    <Input
                      id="subtitle"
                      value={config.subtitle}
                      onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Thank you for your order!"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom_text">Custom Text</Label>
                    <Textarea
                      id="custom_text"
                      value={config.custom_text}
                      onChange={(e) => setConfig(prev => ({ ...prev, custom_text: e.target.value }))}
                      placeholder="Additional message for customers..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Buttons */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Buttons</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addButton}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Button
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {config.buttons.map((button, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Button text"
                          value={button.text}
                          onChange={(e) => updateButton(index, 'text', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Button URL"
                          value={button.url}
                          onChange={(e) => updateButton(index, 'url', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Styling */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="bg_color">Background Color</Label>
                    <Input
                      id="bg_color"
                      type="color"
                      value={config.background_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="text_color">Text Color</Label>
                    <Input
                      id="text_color"
                      type="color"
                      value={config.text_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Associations */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Associate with Cover Page</Label>
                    <Select 
                      value={config.cover_page_id || ""} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, cover_page_id: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cover page" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="none">None</SelectItem>
                        {availableCoverPages.map(page => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title} ({page.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Associate with Affiliate</Label>
                    <Select 
                      value={config.affiliate_id || ""} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, affiliate_id: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an affiliate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {availableAffiliates.map(affiliate => (
                          <SelectItem key={affiliate.id} value={affiliate.id}>
                            {affiliate.name} ({affiliate.affiliate_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="lg:sticky lg:top-0">
              <Card>
                <CardContent className="p-2">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs text-gray-600 border-b">
                      Live Preview
                    </div>
                    <div className="h-[500px] overflow-y-auto">
                      {renderPreview()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};