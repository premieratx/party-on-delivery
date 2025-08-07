import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedCartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  eventName?: string;
  category?: string;
  productId?: string;
}

// Debounce utility for performance
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useLocalStorage<UnifiedCartItem[]>('unified-cart', []);
  const [cartFlash, setCartFlash] = useState(false);
  const abandonedCartTimerRef = useRef<NodeJS.Timeout>();

  // Debounced abandoned cart tracking
  const trackAbandonedCart = useCallback(
    debounce(async () => {
      if (cartItems.length === 0) return;

      try {
        const sessionId = localStorage.getItem('sessionId') || 
          Math.random().toString(36).substring(2, 15);
        localStorage.setItem('sessionId', sessionId);

        const customerInfo = (() => {
          try {
            return JSON.parse(localStorage.getItem('customerInfo') || '{}');
          } catch {
            return {};
          }
        })();

        const deliveryInfo = (() => {
          try {
            return JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
          } catch {
            return {};
          }
        })();
        
        await supabase.functions.invoke('track-abandoned-cart', {
          body: {
            session_id: sessionId,
            cart_items: cartItems,
            customer_email: customerInfo.email,
            customer_name: customerInfo.firstName ? 
              `${customerInfo.firstName} ${customerInfo.lastName}` : null,
            customer_phone: customerInfo.phone,
            delivery_address: deliveryInfo.address,
            subtotal: getTotalPrice(),
            total_amount: getTotalPrice(),
            affiliate_code: localStorage.getItem('affiliateCode')
          }
        });
      } catch (error) {
        // Don't break the app if abandoned cart tracking fails
        console.warn('Abandoned cart tracking failed (non-critical):', error);
      }
    }, 30000), // 30 second debounce
    [cartItems]
  );


  // SIMPLE INDEPENDENT CART LOGIC - NO CROSS-PRODUCT INTERFERENCE
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'> | UnifiedCartItem[]) => {
    console.log('🛒 addToCart called with:', item);
    
    setCartItems(prev => {
      // Create completely fresh array to avoid any reference issues
      const freshCart = prev.map(cartItem => ({ ...cartItem }));
      
      if (Array.isArray(item)) {
        // DISABLED: No more party planner bulk add
        console.warn('🛒 Bulk add disabled - adding items individually');
        return freshCart;
      } else {
        // Single item add - INCREMENT existing or ADD new
        const normalizedItem: UnifiedCartItem = {
          id: item.id || item.productId || '',
          productId: item.productId || item.id,
          title: item.title || item.name || '',
          name: item.name || item.title || '',
          price: Number(item.price) || 0,
          quantity: 1,
          image: item.image || '',
          variant: item.variant,
          eventName: item.eventName,
          category: item.category
        };
        
        if (!normalizedItem.id) {
          console.warn('🛒 Invalid item ID, ignoring');
          return freshCart;
        }
        
        // Find exact match using product ID and variant
        const existingIndex = freshCart.findIndex(cartItem => 
          cartItem.id === normalizedItem.id && 
          cartItem.variant === normalizedItem.variant
        );
        
        if (existingIndex >= 0) {
          // INCREMENT existing item by 1
          freshCart[existingIndex] = {
            ...freshCart[existingIndex],
            quantity: freshCart[existingIndex].quantity + 1
          };
          console.log('🛒 Incremented existing item to qty:', freshCart[existingIndex].quantity);
        } else {
          // ADD new item
          freshCart.push(normalizedItem);
          console.log('🛒 Added new item with qty: 1');
        }
        
        return freshCart;
      }
    });
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
    trackAbandonedCart();
  }, [trackAbandonedCart]);

  // ISOLATED PRODUCT QUANTITY UPDATE - ZERO INTERFERENCE
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(Number(newQuantity) || 0));
    
    console.log(`🛒 UPDATE ${id} (variant: ${variant || 'none'}) to qty: ${safeQuantity}`);
    
    setCartItems(prev => {
      // Create completely fresh cart array
      const freshCart = prev.map(item => ({ ...item }));
      
      // Find EXACT match - no interference with other products
      const targetIndex = freshCart.findIndex(item => 
        item.id === id && item.variant === variant
      );
      
      console.log(`🛒 Target index for ${id}: ${targetIndex}`);
      
      if (targetIndex >= 0) {
        if (safeQuantity <= 0) {
          // Remove this specific item only
          freshCart.splice(targetIndex, 1);
          console.log(`🛒 REMOVED ${id} - Cart now has ${freshCart.length} items`);
        } else {
          // Update ONLY this item's quantity
          freshCart[targetIndex] = {
            ...freshCart[targetIndex],
            quantity: safeQuantity
          };
          console.log(`🛒 UPDATED ${id} to qty ${safeQuantity}`);
        }
      }
      
      return freshCart;
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    console.log('🛒 REMOVING ALL of item:', { id, variant });
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && item.variant === variant)
    ));
  }, []);

  const emptyCart = useCallback(() => {
    console.log('🛒 EMPTYING CART');
    setCartItems([]);
  }, []);

  // PRECISE INDEPENDENT QUANTITY LOOKUP
  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const item = cartItems.find(item => 
      item.id === id && item.variant === variant
    );
    
    const qty = item?.quantity || 0;
    console.log(`🛒 GET QTY for ${id}: ${qty}`);
    return qty;
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (Number(item.quantity) || 0);
    }, 0);
  }, [cartItems]);

  // Manual abandoned cart tracking (for immediate use)
  const trackAbandonedCartNow = useCallback(async () => {
    if (cartItems.length === 0) return;

    try {
      const sessionId = localStorage.getItem('sessionId') || 
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sessionId', sessionId);

      const customerInfo = (() => {
        try {
          return JSON.parse(localStorage.getItem('customerInfo') || '{}');
        } catch {
          return {};
        }
      })();

      const deliveryInfo = (() => {
        try {
          return JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
        } catch {
          return {};
        }
      })();
      
      await supabase.functions.invoke('track-abandoned-cart', {
        body: {
          session_id: sessionId,
          cart_items: cartItems,
          customer_email: customerInfo.email,
          customer_name: customerInfo.firstName ? 
            `${customerInfo.firstName} ${customerInfo.lastName}` : null,
          customer_phone: customerInfo.phone,
          delivery_address: deliveryInfo.address,
          subtotal: getTotalPrice(),
          total_amount: getTotalPrice(),
          affiliate_code: localStorage.getItem('affiliateCode')
        }
      });
    } catch (error) {
      console.error('Error tracking abandoned cart:', error);
    }
  }, [cartItems, getTotalPrice]);

  return {
    cartItems,
    cartFlash,
    addToCart,
    updateQuantity,
    removeItem,
    emptyCart,
    getCartItemQuantity,
    getTotalPrice,
    getTotalItems,
    trackAbandonedCart: trackAbandonedCartNow
  };
};