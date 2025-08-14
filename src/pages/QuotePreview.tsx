import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Minus,
  CreditCard
} from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  deliveryTime: string;
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
}

export default function QuotePreview() {
  const [searchParams] = useSearchParams();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addToCart, updateQuantity, getTotalPrice, getTotalItems } = useUnifiedCart();

  useEffect(() => {
    const quoteParam = searchParams.get('quote');
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        setQuoteData(data);
        
        // Initialize quantities from cart items
        const initialQuantities: Record<string, number> = {};
        data.cartItems?.forEach((item: any) => {
          initialQuantities[item.id] = item.quantity || 1;
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Failed to parse quote data:', error);
        toast.error('Failed to load quote data');
      }
    }
  }, [searchParams]);

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
    
    // Update cart for checkout
    const item = quoteData?.cartItems.find(item => item.id === itemId);
    if (item) {
      updateQuantity(itemId, item.variant || '', newQuantity);
    }
  };

  const calculateSubtotal = () => {
    if (!quoteData?.cartItems) return 0;
    
    return quoteData.cartItems.reduce((total, item) => {
      const quantity = quantities[item.id] || 1;
      const price = parseFloat(item.price) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.0825; // 8.25% tax rate
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const deliveryFee = quoteData?.deliveryFee || 0;
    const tip = quoteData?.tip || 0;
    return subtotal + tax + deliveryFee + tip;
  };

  const proceedToCheckout = () => {
    // Add all items to cart and redirect to checkout
    quoteData?.cartItems.forEach(item => {
      const quantity = quantities[item.id] || 1;
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: item.id,
          title: item.title,
          name: item.title,
          price: parseFloat(item.price),
          variant: item.variant,
          image: item.image
        });
      }
    });
    
    toast.success('Items added to cart!');
    window.location.href = '/checkout';
  };

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Quote...</h2>
          <p className="text-muted-foreground">Please wait while we load your quote.</p>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Custom Quote</CardTitle>
            <p className="text-muted-foreground">Party On Delivery - Austin's Premier Event Service</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer & Event Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{new Date(quoteData.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span className="capitalize">{quoteData.deliveryTime}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span>
                  <br />
                  <span>{quoteData.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{quoteData.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{quoteData.customerPhone}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Quote Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quoteData.cartItems?.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.variant && (
                          <Badge variant="secondary" className="mt-1">
                            {item.variant}
                          </Badge>
                        )}
                        <p className="text-lg font-semibold text-primary">
                          ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.id, (quantities[item.id] || 1) - 1)}
                          disabled={(quantities[item.id] || 1) <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantities[item.id] || 1}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.id, (quantities[item.id] || 1) + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${((parseFloat(item.price) || 0) * (quantities[item.id] || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Quote Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax (8.25%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>${(quoteData.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver Tip:</span>
                    <span>${(quoteData.tip || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={proceedToCheckout}
                    className="w-full" 
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Looks Good - Proceed to Checkout
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Click above to confirm this quote and proceed to secure checkout
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}