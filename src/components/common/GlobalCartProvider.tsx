import React, { createContext, useContext, useState, useCallback } from 'react';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate, useLocation } from 'react-router-dom';

interface GlobalCartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  forceShowCart: () => void;
}

const GlobalCartContext = createContext<GlobalCartContextType | undefined>(undefined);

export const useGlobalCart = () => {
  const context = useContext(GlobalCartContext);
  if (!context) {
    throw new Error('useGlobalCart must be used within GlobalCartProvider');
  }
  return context;
};

interface GlobalCartProviderProps {
  children: React.ReactNode;
}

export const GlobalCartProvider: React.FC<GlobalCartProviderProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [forceVisible, setForceVisible] = useState(true); // Always show cart
  const { cartItems, getTotalPrice, getTotalItems } = useUnifiedCart();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🛒 GlobalCartProvider: Rendering with', cartItems.length, 'items');

  const openCart = useCallback(() => {
    console.log('🛒 GlobalCartProvider: Opening cart');
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    console.log('🛒 GlobalCartProvider: Closing cart');
    setIsCartOpen(false);
  }, []);

  const forceShowCart = useCallback(() => {
    console.log('🛒 GlobalCartProvider: Force showing cart');
    setForceVisible(true);
    setIsCartOpen(true);
  }, []);

  const handleCheckout = useCallback(() => {
    console.log('🛒 GlobalCartProvider: Proceeding to checkout');
    
    // Store current location for return
    localStorage.setItem('checkout-return-url', location.pathname + location.search);
    
    // Always navigate to main checkout
    navigate('/checkout');
    closeCart();
  }, [navigate, location, closeCart]);

  // Determine if we should show the cart bar (always show unless on specific pages)
  const shouldShowCartBar = !location.pathname.includes('/checkout') && 
                           !location.pathname.includes('/order-complete') &&
                           !location.pathname.includes('/admin');

  const isAdminUser = location.pathname.includes('/admin');

  return (
    <GlobalCartContext.Provider value={{ isCartOpen, openCart, closeCart, forceShowCart }}>
      {children}
      
      {/* Always render cart modal */}
      <UnifiedCart 
        isOpen={isCartOpen}
        onClose={closeCart}
      />
      
      {/* Always render bottom cart bar unless on specific pages */}
      {shouldShowCartBar && (
        <BottomCartBar
          items={cartItems}
          totalPrice={getTotalPrice()}
          isVisible={forceVisible}
          onOpenCart={openCart}
          onCheckout={handleCheckout}
          shouldHide={false} // Never hide
          showAdmin={isAdminUser}
          currentAppSlug={location.pathname.includes('/app/') ? location.pathname.split('/app/')[1] : undefined}
        />
      )}
    </GlobalCartContext.Provider>
  );
};