import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

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

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useLocalStorage<UnifiedCartItem[]>('unified-cart', []);
  const [cartFlash, setCartFlash] = useState(false);

  // DEAD SIMPLE: Create unique key for each product+variant combo
  const createItemKey = (id: string, variant?: string) => {
    return `${id}||${variant || 'no-variant'}`;
  };

  // DEAD SIMPLE: Add item or increment if exists
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    console.log('🛒 SIMPLE ADD:', item.id);
    
    if (!item.id) {
      console.warn('🛒 No ID, skipping');
      return;
    }

    const itemKey = createItemKey(item.id, item.variant);
    
    setCartItems(prev => {
      const newCart = [...prev];
      const existingIndex = newCart.findIndex(cartItem => 
        createItemKey(cartItem.id, cartItem.variant) === itemKey
      );

      if (existingIndex >= 0) {
        // Increment existing
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1
        };
        console.log('🛒 INCREMENTED to:', newCart[existingIndex].quantity);
      } else {
        // Add new
        const newItem: UnifiedCartItem = {
          id: item.id,
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
        newCart.push(newItem);
        console.log('🛒 ADDED NEW');
      }

      return newCart;
    });
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, []);

  // DEAD SIMPLE: Update specific item quantity
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(Number(newQuantity) || 0));
    const itemKey = createItemKey(id, variant);
    
    console.log(`🛒 SIMPLE UPDATE ${itemKey} to ${safeQuantity}`);
    
    setCartItems(prev => {
      const newCart = [...prev];
      const targetIndex = newCart.findIndex(item => 
        createItemKey(item.id, item.variant) === itemKey
      );
      
      if (targetIndex >= 0) {
        if (safeQuantity <= 0) {
          newCart.splice(targetIndex, 1);
          console.log('🛒 REMOVED');
        } else {
          newCart[targetIndex] = {
            ...newCart[targetIndex],
            quantity: safeQuantity
          };
          console.log('🛒 UPDATED');
        }
      }
      
      return newCart;
    });
  }, []);

  // DEAD SIMPLE: Remove item completely
  const removeItem = useCallback((id: string, variant?: string) => {
    const itemKey = createItemKey(id, variant);
    console.log('🛒 SIMPLE REMOVE:', itemKey);
    
    setCartItems(prev => prev.filter(item => 
      createItemKey(item.id, item.variant) !== itemKey
    ));
  }, []);

  // DEAD SIMPLE: Empty everything
  const emptyCart = useCallback(() => {
    console.log('🛒 SIMPLE EMPTY');
    setCartItems([]);
  }, []);

  // DEAD SIMPLE: Get quantity for specific item
  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const itemKey = createItemKey(id, variant);
    const item = cartItems.find(item => 
      createItemKey(item.id, item.variant) === itemKey
    );
    
    const qty = item?.quantity || 0;
    console.log(`🛒 SIMPLE GET QTY ${itemKey}: ${qty}`);
    return qty;
  }, [cartItems]);

  // DEAD SIMPLE: Calculate totals
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (Number(item.price) * Number(item.quantity));
    }, 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + Number(item.quantity);
    }, 0);
  }, [cartItems]);

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
    trackAbandonedCart: () => {} // Disabled for now
  };
};