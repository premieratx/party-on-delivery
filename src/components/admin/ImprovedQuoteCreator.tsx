import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  FileText, 
  Calendar,
  Clock,
  Mail,
  Phone,
  Building,
  MapPin,
  CreditCard,
  Percent
} from 'lucide-react';

interface QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  deliveryTime: string;
  deliveryAddress: string;
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

export const ImprovedQuoteCreator: React.FC<QuoteCreatorProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const { cartItems, getTotalPrice } = useUnifiedCart();
  const [quoteData, setQuoteData] = useState<QuoteData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventDate: '',
    deliveryTime: '',
    deliveryAddress: '',
    cartItems: [],
    subtotal: 0,
    deliveryFee: 25,
    tax: 0,
    tip: 0
  });

  useEffect(() => {
    // Update cart items when cart changes
    if (cartItems.length > 0) {
      const subtotal = getTotalPrice();
      const tax = subtotal * 0.0825; // 8.25% tax
      setQuoteData(prev => ({
        ...prev,
        cartItems: cartItems,
        subtotal: subtotal,
        tax: tax
      }));
    }
  }, [cartItems, getTotalPrice]);

  const handleCustomerInfoSubmit = async () => {
    if (!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone || !quoteData.eventDate || !quoteData.deliveryTime || !quoteData.deliveryAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create lead in customer database
      const { error } = await supabase.from('customers').insert({
        name: quoteData.customerName,
        email: quoteData.customerEmail,
        phone: quoteData.customerPhone
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
      deliveryTime: quoteData.deliveryTime,
      deliveryAddress: quoteData.deliveryAddress
    }))}`, '_blank');
  };

  const generateQuoteFromCart = () => {
    // Generate quote from current cart items
    const cartData = {
      ...quoteData,
      cartItems: cartItems,
      subtotal: getTotalPrice(),
      tax: getTotalPrice() * 0.0825
    };

    // Group items by category
    const itemsByCategory = cartItems.reduce((acc: any, item: any) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    const quoteParams = new URLSearchParams({
      quote: 'true',
      data: JSON.stringify(cartData),
      categories: JSON.stringify(itemsByCategory)
    });
    
    // Use window.open with proper URL construction
    const baseUrl = window.location.origin;
    const quoteUrl = `${baseUrl}/quote-preview?${quoteParams.toString()}`;
    
    window.open(quoteUrl, '_blank');
    toast.success('Quote generated! Check the new tab.');
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Professional Quote
            <Badge variant="outline" className="ml-2">
              Step {step} of 3
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={quoteData.customerName}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={quoteData.customerEmail}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="john@example.com"
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
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={quoteData.eventDate}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, eventDate: e.target.value }))}
                    />
                  </div>
                  <div>
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
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Input
                      id="deliveryAddress"
                      value={quoteData.deliveryAddress}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      placeholder="123 Main St, Austin, TX 78701"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Summary */}
            <Separator />
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Cart Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Items:</span>
                  <div className="font-medium">{cartItems.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Subtotal:</span>
                  <div className="font-medium">${getTotalPrice().toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tax (8.25%):</span>
                  <div className="font-medium">${(getTotalPrice() * 0.0825).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-bold text-primary">${(getTotalPrice() * 1.0825 + quoteData.deliveryFee).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCustomerInfoSubmit} 
              disabled={loading}
              className="w-full"
              size="lg"
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
            <h3 className="text-lg font-semibold">Choose Delivery App Theme</h3>
            <p className="text-muted-foreground">
              Select which delivery app view you'd like to use for creating this quote:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card 
                  key={app.id} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Generate Professional Quote</h3>
            
            {/* Quote Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Generate from Cart
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Create a professional quote from items currently in your cart, organized by product categories.
                  </p>
                  <Button onClick={generateQuoteFromCart} className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Quote ({cartItems.length} items)
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Payment Options
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Pay in Full:</span>
                      <Badge variant="outline">100%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deposit Option:</span>
                      <Badge variant="secondary">25%</Badge>
                    </div>
                  </div>
                  <Button variant="outline" onClick={shareCart} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Share Cart Link
                  </Button>
                </div>
              </Card>
            </div>

            {/* Quote Preview Info */}
            <Card className="p-4 bg-primary/5">
              <h4 className="font-semibold mb-2">Quote Will Include:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Company logo and information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Event date and delivery time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Delivery address information</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Products organized by category</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment options (full or 25% deposit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    <span>Tax, fees, and grand total</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App Selection
              </Button>
              {onClose && (
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Close Quote Creator
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};