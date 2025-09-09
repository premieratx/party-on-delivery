import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { RefactoredCheckoutFlow } from "@/components/checkout/RefactoredCheckoutFlow";
import { CheckoutIsolation } from "@/components/checkout/CheckoutIsolation";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";

interface LocalDeliveryInfo {
  date: Date | null;
  timeSlot: string;
  address: string;
  instructions: string;
}

export const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity } = useUnifiedCart();
  
  // Scroll to top when checkout page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  console.log('🔄 Checkout page rendering, cart items:', cartItems.length);
  
  const [deliveryInfo, setDeliveryInfo] = useState<LocalDeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });
  
  // Add discount state management
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  } | null>(null);

  const handleDiscountChange = (discount: {code: string, amount: number, type: 'fixed_amount' | 'percentage', value: string} | null) => {
    console.log('🎫 Discount applied in checkout:', discount);
    setAppliedDiscount(discount);
  };

  // Remove loading state - not needed
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const totalAmount = cartItems.reduce((sum, item) => sum + (applyMarkup(item.price) * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
              <Button onClick={() => {
                try {
                  const lastDeliveryApp = localStorage.getItem('last-delivery-app-url') || 
                                        localStorage.getItem('deliveryAppReferrer');
                  
                  if (lastDeliveryApp && lastDeliveryApp !== '/checkout') {
                    navigate(lastDeliveryApp);
                  } else {
                    navigate('/');
                  }
                } catch (error) {
                  console.warn('Navigation error, using fallback:', error);
                  navigate('/');
                }
              }} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CheckoutIsolation>
      {/* Mobile: Ensure checkout starts at very top */}
      <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-safe safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-6 max-w-4xl">
          {/* Enhanced Header - Mobile Optimized with Back Button */}
          <div className="flex items-center justify-between mb-3 sm:mb-6 px-1">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  try {
                    const lastDeliveryApp = localStorage.getItem('last-delivery-app-url') || 
                                          localStorage.getItem('deliveryAppReferrer');
                    
                    if (lastDeliveryApp && lastDeliveryApp !== '/checkout') {
                      navigate(lastDeliveryApp);
                    } else {
                      navigate('/');
                    }
                  } catch (error) {
                    console.warn('Navigation error, using fallback:', error);
                    navigate('/');
                  }
                }}
                className="p-2 h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">Checkout</h1>
            </div>
            
            <div className="text-right">
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </div>
              <div className="text-base sm:text-xl font-bold">
                ${totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Enhanced Checkout Form - Mobile First */}
          <RefactoredCheckoutFlow
            cartItems={cartItems.map(item => {
              console.log('🛒 Processing cart item:', item);
              return {
                id: item.productId || item.id,
                title: item.title,
                name: item.title,
                price: item.price,
                image: item.image || '',
                quantity: item.quantity,
                variant: item.variant
              };
            })}
            deliveryInfo={{
              date: deliveryInfo.date,
              timeSlot: deliveryInfo.timeSlot,
              address: deliveryInfo.address,
              instructions: deliveryInfo.instructions || ''
            }}
            totalPrice={totalAmount}
            onBack={() => {
              // Enhanced back navigation to return to the correct delivery app
              try {
                const lastDeliveryApp = localStorage.getItem('last-delivery-app-url') || 
                                      localStorage.getItem('deliveryAppReferrer') ||
                                      sessionStorage.getItem('home-override');
                
                if (lastDeliveryApp && lastDeliveryApp !== '/checkout' && lastDeliveryApp !== window.location.pathname) {
                  navigate(lastDeliveryApp);
                } else {
                  // Fallback to stored referrer or home
                  const referrer = localStorage.getItem('deliveryAppReferrer') || '/';
                  navigate(referrer);
                }
              } catch (error) {
                console.warn('Navigation error, using fallback:', error);
                navigate('/');
              }
            }}
            onDeliveryInfoChange={(info) => {
              setDeliveryInfo({
                date: info.date,
                timeSlot: info.timeSlot,
                address: info.address,
                instructions: info.instructions || ''
              });
            }}
            onUpdateQuantity={(id, variant, quantity) => {
              console.log('🛒 Checkout: Updating quantity via unified cart:', { id, variant, quantity });
              updateQuantity(id, variant, quantity);
            }}
            appliedDiscount={appliedDiscount}
            onDiscountChange={handleDiscountChange}
          />
        </div>
      </div>
    </CheckoutIsolation>
  );
};

export default Checkout;