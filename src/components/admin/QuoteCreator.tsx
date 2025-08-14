import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ArrowLeft, Send, FileText } from 'lucide-react';

interface QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  deliveryTime: string;
  selectedApp?: string;
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
}

interface QuoteCreatorProps {
  onClose?: () => void;
}

export const QuoteCreator: React.FC<QuoteCreatorProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventDate: '',
    deliveryTime: '',
    cartItems: [],
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    tip: 0
  });

  const handleCustomerInfoSubmit = async () => {
    if (!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone || !quoteData.eventDate || !quoteData.deliveryTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create lead in customer database
      const { error } = await supabase.from('customers').insert({
        name: quoteData.customerName,
        email: quoteData.customerEmail,
        phone: quoteData.customerPhone,
        // Mark as lead until they make a purchase
        customer_type: 'lead'
      });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      // Fetch delivery apps
      const { data: appsData, error: appsError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true);

      if (appsError) throw appsError;
      
      setApps(appsData || []);
      setStep(2);
      toast.success('Customer information saved! Now select a delivery app.');
    } catch (error) {
      console.error('Error saving customer info:', error);
      toast.error('Failed to save customer information');
    } finally {
      setLoading(false);
    }
  };

  const handleAppSelection = (appSlug: string) => {
    setQuoteData(prev => ({ ...prev, selectedApp: appSlug }));
    setStep(3);
    // Open the delivery app in quote mode
    window.open(`/app/${appSlug}?quote=true&customer=${encodeURIComponent(JSON.stringify({
      name: quoteData.customerName,
      email: quoteData.customerEmail,
      phone: quoteData.customerPhone,
      eventDate: quoteData.eventDate,
      deliveryTime: quoteData.deliveryTime
    }))}`, '_blank');
  };

  const generateQuote = () => {
    // Generate quote and open in new tab
    const quoteParams = new URLSearchParams({
      quote: 'true',
      data: JSON.stringify(quoteData)
    });
    window.open(`/quote-preview?${quoteParams.toString()}`, '_blank');
  };

  const shareCart = () => {
    // Share current cart state
    const cartData = JSON.stringify(quoteData);
    const shareUrl = `${window.location.origin}/quote-cart?data=${encodeURIComponent(cartData)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Cart link copied to clipboard!');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Custom Quote
          <Badge variant="outline" className="ml-auto">
            Step {step} of 3
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={quoteData.customerName}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={quoteData.customerEmail}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={quoteData.customerPhone}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={quoteData.eventDate}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Select value={quoteData.deliveryTime} onValueChange={(value) => setQuoteData(prev => ({ ...prev, deliveryTime: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                    <SelectItem value="specific">Specific Time (To be arranged)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleCustomerInfoSubmit} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next: Select Delivery App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Delivery App</h3>
            <p className="text-muted-foreground">
              Select which delivery app view you'd like to use for creating this quote:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card 
                  key={app.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAppSelection(app.app_slug)}
                >
                  <CardContent className="p-4 text-center">
                    {app.logo_url && (
                      <img 
                        src={app.logo_url} 
                        alt={app.app_name}
                        className="w-16 h-16 mx-auto mb-2 object-contain"
                      />
                    )}
                    <h4 className="font-semibold">{app.app_name}</h4>
                    {app.short_path && (
                      <Badge variant="secondary" className="mt-2">
                        /{app.short_path}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customer Info
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quote Actions</h3>
            <p className="text-muted-foreground">
              The delivery app has opened in a new tab. Add products to the cart, then use the actions below:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={shareCart} variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Share Cart Link
              </Button>
              <Button onClick={generateQuote}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Quote
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Close Quote Creator
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setStep(2)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App Selection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};