import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CheckoutFlow } from "@/components/delivery/CheckoutFlow";
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
  const [loading, setLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<LocalDeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });

  useEffect(() => {
    // No need to load separate cart - use unified cart directly
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
              <Button onClick={() => {
                const referrer = localStorage.getItem('deliveryAppReferrer') || '/';
                navigate(referrer);
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header - Mobile Optimized */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate back to the delivery app they came from
                  const referrer = localStorage.getItem('deliveryAppReferrer') || '/';
                  navigate(referrer);
                }}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Products</span>
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

          {/* Checkout Form */}
          <CheckoutFlow
            cartItems={cartItems.map(item => ({
              id: item.productId || item.id,
              title: item.title,
              name: item.title,
              price: item.price,
              image: item.image || '',
              quantity: item.quantity,
              variant: item.variant
            }))}
            deliveryInfo={{
              date: deliveryInfo.date,
              timeSlot: deliveryInfo.timeSlot,
              address: deliveryInfo.address,
              instructions: deliveryInfo.instructions || ''
            }}
            totalPrice={totalAmount}
            onBack={() => {
              const override = (() => { try { return sessionStorage.getItem('home-override'); } catch { return null; } })();
              const referrer = localStorage.getItem('deliveryAppReferrer');
              navigate(override || referrer || '/');
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
          />
        </div>
      </div>
    </CheckoutIsolation>
  );
};

export default Checkout;