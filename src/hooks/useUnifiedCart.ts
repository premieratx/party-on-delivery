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

  // Debounced function to sync with party-cart for checkout compatibility
  const syncPartyCart = useCallback(
    debounce((items: UnifiedCartItem[]) => {
      try {
        localStorage.setItem('party-cart', JSON.stringify(items));
      } catch (error) {
        console.warn('Failed to sync party-cart:', error);
      }
    }, 500),
    []
  );

  // Sync party-cart when cartItems change (debounced)
  useEffect(() => {
    if (migrationDoneRef.current) {
      syncPartyCart(cartItems);
    }
  }, [cartItems, syncPartyCart]);

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

  // FIXED: Reliable add to cart function that prevents phantom items
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'> | UnifiedCartItem[]) => {
    console.log('useUnifiedCart: addToCart called with:', item);
    
    setCartItems(prev => {
      // CRITICAL: Always start fresh to prevent phantom items
      const cleanCart = prev.filter(cartItem => 
        cartItem && cartItem.id && cartItem.quantity > 0 && cartItem.price > 0
      );
      
      if (Array.isArray(item)) {
        // Handle multiple items (from party planner) - REPLACE entire cart
        const validItems = item.filter(newItem => 
          newItem && newItem.id && Number(newItem.quantity) > 0 && Number(newItem.price) > 0
        );
        
        return validItems.map(newItem => ({
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
        // Handle single item (from delivery widget) - ADD to existing
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
        
        // Validate item before adding
        if (!normalizedItem.id || normalizedItem.price <= 0) {
          console.warn('Invalid item, not adding to cart:', normalizedItem);
          return cleanCart;
        }
        
        const existingIndex = cleanCart.findIndex(cartItem => 
          cartItem.id === normalizedItem.id && 
          cartItem.variant === normalizedItem.variant
        );
        
        if (existingIndex >= 0) {
          cleanCart[existingIndex] = {
            ...cleanCart[existingIndex],
            quantity: cleanCart[existingIndex].quantity + 1
          };
          return cleanCart;
        } else {
          return [...cleanCart, normalizedItem];
        }
      }
    });
    
    // Trigger flash animation
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);

    // Track abandoned cart (debounced)
    trackAbandonedCart();
  }, [trackAbandonedCart]);

  // FIXED: Reliable quantity update that prevents cart corruption
  const updateQuantity = useCallback((id: string, variant: string | undefined, quantity: number) => {
    console.log('useUnifiedCart: updateQuantity called', { id, variant, quantity });
    
    setCartItems(prev => {
      // Start with clean, validated cart
      const cleanCart = prev.filter(item => 
        item && item.id && item.quantity > 0 && item.price > 0
      );
      
      const existingIndex = cleanCart.findIndex(item => 
        item.id === id && item.variant === variant
      );
      
      if (existingIndex >= 0) {
        const newQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
        
        if (newQuantity <= 0) {
          // Remove item completely
          return cleanCart.filter((_, index) => index !== existingIndex);
        } else {
          // Update quantity
          const updatedCart = [...cleanCart];
          updatedCart[existingIndex] = { 
            ...updatedCart[existingIndex], 
            quantity: newQuantity
          };
          return updatedCart;
        }
      }
      
      // Item not found, return cart unchanged
      return cleanCart;
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    setCartItems(prev => 
      prev.filter(item => 
        !((item.id === id || item.productId === id) && item.variant === variant)
      )
    );
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