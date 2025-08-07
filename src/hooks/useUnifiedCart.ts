import { useState, useEffect, useCallback, useRef } from 'react';
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
  const migrationDoneRef = useRef(false);

  // DISABLED: No more party-cart migration - causes cart interference
  // useEffect(() => {
  //   Migration disabled to prevent cart conflicts
  // }, []);

  // DISABLED: No party-cart sync to prevent interference

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

  // Cleanup function for timers
  useEffect(() => {
    return () => {
      if (abandonedCartTimerRef.current) {
        clearTimeout(abandonedCartTimerRef.current);
      }
    };
  }, []);

  // COMPLETELY REWRITTEN - SIMPLE STORE LOGIC
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'> | UnifiedCartItem[]) => {
    console.log('🛒 addToCart called with:', item);
    
    setCartItems(prev => {
      if (Array.isArray(item)) {
        // Party planner bulk add - REPLACE entire cart
        return item.map(newItem => ({
          id: newItem.id || newItem.productId || '',
          productId: newItem.productId || newItem.id,
          title: newItem.title || newItem.name || '',
          name: newItem.name || newItem.title || '',
          price: Number(newItem.price) || 0,
          quantity: Number(newItem.quantity) || 1,
          image: newItem.image || '',
          variant: newItem.variant,
          eventName: newItem.eventName,
          category: newItem.category
        }));
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
        
        if (!normalizedItem.id || normalizedItem.price <= 0) {
          console.warn('🛒 Invalid item, ignoring');
          return prev;
        }
        
        const existingIndex = prev.findIndex(cartItem => 
          cartItem.id === normalizedItem.id && 
          cartItem.variant === normalizedItem.variant
        );
        
        if (existingIndex >= 0) {
          // INCREMENT existing item
          const newCart = [...prev];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + 1
          };
          console.log('🛒 Incremented existing item to qty:', newCart[existingIndex].quantity);
          return newCart;
        } else {
          // ADD new item
          console.log('🛒 Added new item with qty: 1');
          return [...prev, normalizedItem];
        }
      }
    });
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
    trackAbandonedCart();
  }, [trackAbandonedCart]);

  // NUCLEAR OPTION: Absolutely zero cross-product interference
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(Number(newQuantity) || 0));
    const searchKey = `${id}_${variant || 'none'}`;
    
    console.log(`🛒 UPDATE ${searchKey} to qty: ${safeQuantity}`);
    
    setCartItems(prev => {
      // Create a completely new array to avoid any reference issues
      const currentCart = [...prev];
      
      // Find the EXACT item we want to update (and ONLY that item)
      const targetIndex = currentCart.findIndex(item => {
        const itemKey = `${item.id}_${item.variant || 'none'}`;
        return itemKey === searchKey;
      });
      
      console.log(`🛒 Found ${searchKey} at index: ${targetIndex}`);
      console.log(`🛒 Current cart:`, currentCart.map(item => `${item.id}_${item.variant || 'none'}: ${item.quantity}`));
      
      if (targetIndex >= 0) {
        // Item exists - update or remove it
        if (safeQuantity <= 0) {
          // Remove this specific item
          currentCart.splice(targetIndex, 1);
          console.log(`🛒 REMOVED ${searchKey} - New cart:`, currentCart.map(item => `${item.id}_${item.variant || 'none'}: ${item.quantity}`));
        } else {
          // Update this specific item
          currentCart[targetIndex] = {
            ...currentCart[targetIndex],
            quantity: safeQuantity
          };
          console.log(`🛒 UPDATED ${searchKey} to ${safeQuantity} - New cart:`, currentCart.map(item => `${item.id}_${item.variant || 'none'}: ${item.quantity}`));
        }
      } else if (safeQuantity > 0) {
        // Item doesn't exist - add it
        const newItem: UnifiedCartItem = {
          id,
          productId: id,
          title: `Product ${id}`,
          name: `Product ${id}`,
          price: 0,
          quantity: safeQuantity,
          image: '',
          variant
        };
        currentCart.push(newItem);
        console.log(`🛒 ADDED ${searchKey} with qty ${safeQuantity} - New cart:`, currentCart.map(item => `${item.id}_${item.variant || 'none'}: ${item.quantity}`));
      }
      
      return currentCart;
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
    // DO NOT clear party-cart to prevent interference
  }, []);

  // FIXED: Ultra-precise cart quantity lookup
  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const searchKey = `${id}_${variant || 'none'}`;
    const item = cartItems.find(item => {
      const itemKey = `${item.id}_${item.variant || 'none'}`;
      return itemKey === searchKey;
    });
    
    const qty = item?.quantity || 0;
    console.log(`🛒 GET QTY for ${searchKey}: ${qty}`);
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