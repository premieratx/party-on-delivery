import React, { useState, useEffect } from 'react';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';

export default function CustomPartyOnDeliveryTabsPage() {
  // Enable wake lock to keep screen on during app usage
  useWakeLock();
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', 'party-on-delivery---concierge-')
          .single();

        if (error) {
          console.error('Error loading app config:', error);
        } else {
          setAppConfig(data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAppConfig();
  }, []);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(product.price),
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.title : undefined
    };
    
    addToCart(cartItem);
  };

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    updateQuantity(productId, variantId, quantity);
  };

  const handleRemoveFromCart = (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
  };

  const handleEmptyCart = () => {
    emptyCart();
  };

  const handleCheckout = () => {
    // Store app context for checkout
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'party-on-delivery---concierge-',
      appName: 'Party On Delivery & Concierge'
    }));
    
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  // Convert unified cart items to the format expected by ProductCategories
  const cartItemsForCategories = cartItems.map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    variant: item.variant
  }));

  // Mock delivery info for cart component
  const mockDeliveryInfo = {
    date: new Date(),
    timeSlot: '12:00 PM - 2:00 PM',
    address: 'Sample Address',
    instructions: ''
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">App configuration not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show custom delivery tabs with collections from database */}
      <CustomDeliveryTabsPage
        appName={appConfig.app_name}
        collectionsConfig={appConfig.collections_config}
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={() => setIsCartOpen(true)}
        onBack={() => window.location.href = '/app/party-on-delivery---concierge-'}
        onGoHome={() => window.location.href = '/'}
      />

      {/* Cart sidebar */}
      <DeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={mockDeliveryInfo}
        onEmptyCart={handleEmptyCart}
      />

      {/* Bottom cart bar */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={getTotalItems() > 0}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
