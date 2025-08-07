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

  // One-time migration from party-cart format
  useEffect(() => {
    if (migrationDoneRef.current) return;
    
    const migratePartyCart = () => {
      try {
        const partyCart = localStorage.getItem('party-cart');
        if (partyCart && cartItems.length === 0) {
          const partyItems = JSON.parse(partyCart);
          if (Array.isArray(partyItems) && partyItems.length > 0) {
            const unifiedItems: UnifiedCartItem[] = partyItems.map(item => ({
              id: item.productId || item.id,
              productId: item.productId || item.id,
              title: item.title,
              name: item.title || item.name || '',
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1,
              image: item.image || '',
              eventName: item.eventName,
              category: item.category,
              variant: item.variant
            }));
            setCartItems(unifiedItems);
            console.log(`Migrated ${unifiedItems.length} items from party-cart`);
          }
        }
      } catch (error) {
        console.error('Error migrating party cart:', error);
      } finally {
        migrationDoneRef.current = true;
      }
    };

    migratePartyCart();
  }, []);

  // REMOVED PROBLEMATIC SYNC - CAUSES ISSUES
  // The party-cart sync was causing session corruption
  
  // DO NOT sync party-cart automatically anymore
  // Only sync on checkout when needed

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
        console.error('Error tracking abandoned cart:', error);
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

  // SIMPLE UPDATE QUANTITY - NEVER CORRUPTS CART
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    console.log('🛒 updateQuantity:', { id, variant, newQuantity });
    
    const safeQuantity = Math.max(0, Math.floor(Number(newQuantity) || 0));
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.id === id && item.variant === variant
      );
      
      if (existingIndex === -1) {
        console.log('🛒 Item not found for update');
        return prev;
      }
      
      if (safeQuantity <= 0) {
        console.log('🛒 Removing item - qty became 0');
        return prev.filter((_, index) => index !== existingIndex);
      }
      
      console.log('🛒 Setting quantity to:', safeQuantity);
      const newCart = [...prev];
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: safeQuantity };
      return newCart;
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    console.log('🛒 REMOVING ALL of item:', { id, variant });
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && item.variant === variant)
    ));
  }, []);

  const emptyCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem('party-cart');
    } catch (error) {
      console.warn('Failed to remove party-cart:', error);
    }
  }, []);

  // Memoized calculations
  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const item = cartItems.find(item => 
      (item.id === id || item.productId === id) && item.variant === variant
    );
    return item?.quantity || 0;
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