import React, { useState, useEffect } from 'react';
import ProductCategories from '@/components/delivery/ProductCategories';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CustomDeliveryCoverModal } from '@/components/custom-delivery/CustomDeliveryCoverModal';
import { CustomDeliveryAppsGrid } from '@/components/custom-delivery/CustomDeliveryAppsGrid';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';

const COVER_SHOWN_SESSION_KEY = 'homepage_cover_shown_session';

const Index = () => {
  // Enable wake lock to keep screen on during app usage
  useWakeLock();
  
  // Use optimized product loading with immediate start
  const { refreshProducts, loading: productsLoading } = useOptimizedProductLoader();
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [homepageApp, setHomepageApp] = useState<any>(null);
  const [showCoverModal, setShowCoverModal] = useState(() => {
    // Check if cover was already shown in this session
    return !sessionStorage.getItem(COVER_SHOWN_SESSION_KEY);
  });
  const [showAppsGrid, setShowAppsGrid] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const navigate = useNavigate();

  // Load the homepage delivery app configuration 
  useEffect(() => {
    const loadHomepageApp = async () => {
      try {
        setIsPreloading(true);
        
        // Load homepage app config safely with error handling
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_homepage', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!error && data) {
          setHomepageApp(data);
        } else {
          // Set default if no homepage app found
          setHomepageApp({
            app_name: "Party On Delivery",
            logo_url: null
          });
        }
      } catch (error) {
        console.error('Error loading homepage app:', error);
        // Set default fallback
        setHomepageApp({
          app_name: "Party On Delivery", 
          logo_url: null
        });
      } finally {
        setIsPreloading(false);
      }
    };

    loadHomepageApp();
  }, []);

  const handleStartShopping = () => {
    // Mark cover as shown for this session
    sessionStorage.setItem(COVER_SHOWN_SESSION_KEY, 'true');
    setShowCoverModal(false);
  };

  const handleViewApps = () => {
    // Mark cover as shown for this session
    sessionStorage.setItem(COVER_SHOWN_SESSION_KEY, 'true');
    setShowCoverModal(false);
    setShowAppsGrid(true);
  };

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(String(product.price)) || 0,
      image: product.image,
      variant: product.variant
    };
    
    console.log('🛒 Index: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = cartItem.variant || 'default';
      return itemId === cartItem.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
    updateQuantity(cartItem.id, cartItem.variant, currentQty + 1, cartItem);
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
    // Store delivery app referrer and app context for checkout
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'main-delivery-app',
      appName: 'Party On Delivery'
    }));
    
    // Navigate to checkout
    navigate('/checkout');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation */}
      <GlobalNavigation />
      
      {/* Show cover modal first */}
      {showCoverModal && (
        <CustomDeliveryCoverModal
          open={showCoverModal}
          onOpenChange={setShowCoverModal}
          onStartOrder={handleStartShopping}
          onSecondaryAction={handleViewApps}
          secondaryButtonText="Browse Apps"
          appName={homepageApp?.app_name || "Party On Delivery"}
          logoUrl={homepageApp?.logo_url}
        />
      )}

      {/* Show delivery apps grid if selected */}
      {showAppsGrid && (
        <CustomDeliveryAppsGrid
          onAppSelect={(appSlug) => navigate(`/app/${appSlug}`)}
          onBack={() => {
            setShowAppsGrid(false);
            // Don't show cover modal again if it was already shown in this session
            if (!sessionStorage.getItem(COVER_SHOWN_SESSION_KEY)) {
              setShowCoverModal(true);
            }
          }}
        />
      )}

      {/* Show main delivery app when cover is dismissed */}
      {!showCoverModal && !showAppsGrid && (
        <React.Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <ProductCategories />
        </React.Suspense>
      )}

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

      {/* Bottom cart bar with admin button */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
        shouldHide={false}
        showAdmin={true}
        currentAppSlug={undefined} // Main app doesn't have a specific slug
      />
    </div>
  );
};

export default Index;
