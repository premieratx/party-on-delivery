import React, { useState } from 'react';
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
  CreditCard,
  DollarSign,
  Building2,
  User
} from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { formatCurrency } from '@/utils/currency';

interface QuoteItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
  variant?: string;
}

interface FormalQuoteProps {
  quote: {
    quoteNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    eventType: string;
    eventDate?: string;
    eventLocation?: string;
    guestCount?: number;
    items: QuoteItem[];
    subtotal: number;
    deliveryFee?: number;
    salesTax?: number;
    totalAmount: number;
    notes?: string;
    companyInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    };
  };
  onPayDeposit?: () => void;
  onPayFull?: () => void;
  onProceedToCheckout?: () => void;
}

export const FormalQuoteView: React.FC<FormalQuoteProps> = ({ 
  quote, 
  onPayDeposit,
  onPayFull,
  onProceedToCheckout 
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    quote.items.forEach(item => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });
  
  const { addToCart } = useUnifiedCart();

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
  };

  const calculateSubtotal = () => {
    return quote.items.reduce((total, item) => {
      const quantity = quantities[item.id] || item.quantity;
      return total + (item.price * quantity);
    }, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.0825; // 8.25% Texas sales tax
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const delivery = quote.deliveryFee || 25;
    return subtotal + tax + delivery;
  };

  const groupItemsByCategory = () => {
    const grouped: Record<string, QuoteItem[]> = {};
    quote.items.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });
    return grouped;
  };

  const handleProceedToCheckout = () => {
    // Add all current quantities to unified cart
    quote.items.forEach(item => {
      const quantity = quantities[item.id] || item.quantity;
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: item.id,
          title: item.title,
          name: item.title,
          price: item.price,
          variant: item.variant,
          image: item.image
        });
      }
    });
    
    toast.success('Items added to cart!');
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      window.location.href = '/checkout';
    }
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();
  const depositAmount = total * 0.5; // 50% deposit
  const groupedItems = groupItemsByCategory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Company Header */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-center mb-4">
              {quote.companyInfo?.logo ? (
                <img 
                  src={quote.companyInfo.logo} 
                  alt="Company Logo" 
                  className="h-16 w-auto"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <Building2 className="h-12 w-12 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold text-primary">Party On Delivery</h1>
                    <p className="text-sm text-muted-foreground">Austin's Premier Event Service</p>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                {quote.companyInfo?.address || "Austin, TX"}
              </p>
              <p className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                {quote.companyInfo?.phone || "(512) 555-0123"}
              </p>
              <p className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {quote.companyInfo?.email || "hello@partyondelivery.com"}
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Quote Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">Formal Event Quote</CardTitle>
                <p className="text-muted-foreground">Quote #{quote.quoteNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {quote.eventType}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Customer & Event Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{quote.customerName}</p>
                  <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
                  {quote.customerPhone && (
                    <p className="text-sm text-muted-foreground">{quote.customerPhone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{quote.eventType}</p>
                  {quote.guestCount && (
                    <p className="text-sm text-muted-foreground">{quote.guestCount} guests</p>
                  )}
                  {quote.eventDate && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(quote.eventDate).toLocaleDateString()}
                    </p>
                  )}
                  {quote.eventLocation && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {quote.eventLocation}
                    </p>
                  )}
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
                  Recommended Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-lg mb-3 text-primary border-b border-primary/20 pb-1">
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg bg-card/50">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{item.title}</h4>
                              {item.variant && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {item.variant}
                                </Badge>
                              )}
                              <p className="text-sm font-semibold text-primary">
                                {formatCurrency(item.price)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, (quantities[item.id] || item.quantity) - 1)}
                                disabled={(quantities[item.id] || item.quantity) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={quantities[item.id] || item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center text-sm"
                                min="1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, (quantities[item.id] || item.quantity) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold">
                                {formatCurrency(item.price * (quantities[item.id] || item.quantity))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Quote Summary */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Quote Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales Tax (8.25%):</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(quote.deliveryFee || 25)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      onClick={onPayDeposit}
                      variant="outline"
                      size="lg"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Deposit ({formatCurrency(depositAmount)})
                    </Button>
                    <Button 
                      onClick={onPayFull}
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Full Amount ({formatCurrency(total)})
                    </Button>
                  </div>
                  <Button 
                    onClick={handleProceedToCheckout}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Continue Shopping & Checkout
                  </Button>
                </div>

                {quote.notes && (
                  <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2">Additional Notes:</h4>
                    <p className="text-sm text-muted-foreground">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};