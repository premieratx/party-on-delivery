import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CheckoutFlow } from "@/components/delivery/CheckoutFlow";
import { DeliveryInfo } from "@/components/DeliveryWidget";
import { CheckoutIsolation } from "@/components/checkout/CheckoutIsolation";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName: string;
  category: string;
}

export const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });

  useEffect(() => {
    // Load cart data from localStorage
    const savedCart = localStorage.getItem('party-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Checkout: Loaded cart from localStorage:', parsedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        setCartItems([]);
      }
    }
    setLoading(false);
  }, []);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-4 sm:p-8 text-center">
              <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Your Cart is Empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CheckoutIsolation>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Shopping</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Checkout</h1>
          </div>
          
          <div className="text-right">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {totalItems} items
            </div>
            <div className="text-lg sm:text-xl font-bold">
              ${totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Cart Items Summary - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {cartItems.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {item.eventName && `${item.eventName} • `}
                      {item.category}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm sm:text-base font-medium">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <CheckoutFlow
          cartItems={cartItems.map(item => ({
            id: item.productId,
            title: item.title,
            name: item.title,
            price: item.price,
            image: item.image || '',
            quantity: item.quantity,
            variant: undefined
          }))}
          deliveryInfo={deliveryInfo}
          totalPrice={totalAmount}
          onBack={() => navigate('/')}
          onDeliveryInfoChange={setDeliveryInfo}
          onUpdateQuantity={(id, variant, quantity) => {
            setCartItems(prev => {
              const updatedItems = prev.map(item => 
                item.productId === id ? { ...item, quantity } : item
              );
              // Save to localStorage immediately
              localStorage.setItem('party-cart', JSON.stringify(updatedItems));
              return updatedItems;
            });
          }}
        />
      </div>
    </div>
    </CheckoutIsolation>
  );
};

export default Checkout;