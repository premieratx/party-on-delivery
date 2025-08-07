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

  // ULTRA SIMPLE: Create unique key for each product+variant combo
  const createItemKey = (id: string, variant?: string) => {
    return `${id}||${variant || 'no-variant'}`;
  };

  // ULTRA SIMPLE: Add item or increment if exists - ISOLATED
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    console.log('🛒 ULTRA SIMPLE ADD:', item.id, 'variant:', item.variant);
    console.trace('🛒 ADD TO CART STACK TRACE');
    
    if (!item.id) {
      console.warn('🛒 No ID, skipping');
      return;
    }

    const itemKey = createItemKey(item.id, item.variant);
    
    setCartItems(currentItems => {
      console.log('🛒 BEFORE ADD - Current cart:', currentItems.length, currentItems.map(i => `${i.id}:${i.quantity}`));
      // COMPLETELY ISOLATED: Copy array and find target
      const cartCopy = [...currentItems];
      const targetIndex = cartCopy.findIndex(cartItem => 
        createItemKey(cartItem.id, cartItem.variant) === itemKey
      );

      if (targetIndex >= 0) {
        // ISOLATED INCREMENT: Only modify this specific item
        cartCopy[targetIndex] = {
          ...cartCopy[targetIndex],
          quantity: cartCopy[targetIndex].quantity + 1
        };
        console.log('🛒 ISOLATED INCREMENT to:', cartCopy[targetIndex].quantity);
      } else {
        // ISOLATED ADD: Push new item without affecting others
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
        cartCopy.push(newItem);
        console.log('🛒 ISOLATED ADD');
      }
      
      console.log('🛒 AFTER ADD - New cart:', cartCopy.length, cartCopy.map(i => `${i.id}:${i.quantity}`));
      return cartCopy;
    });
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, []);

  // ULTRA SIMPLE: Update specific item quantity - COMPLETELY ISOLATED
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(Number(newQuantity) || 0));
    const itemKey = createItemKey(id, variant);
    
    console.log(`🛒 UPDATE QUANTITY CALLED - ID: ${id}, variant: ${variant}, newQuantity: ${newQuantity}, itemKey: ${itemKey}`);
    
    setCartItems(currentItems => {
      console.log('🛒 BEFORE UPDATE - Current cart:', currentItems.length, currentItems.map(i => `${i.id}:${i.quantity}`));
      console.log('🛒 BEFORE UPDATE - Target:', itemKey, 'New qty:', safeQuantity);
      // COMPLETELY ISOLATED: Find and update ONLY the target item
      const cartCopy = [...currentItems];
      const targetIndex = cartCopy.findIndex(item => 
        createItemKey(item.id, item.variant) === itemKey
      );
      
      if (targetIndex >= 0) {
        if (safeQuantity <= 0) {
          // ISOLATED REMOVE: Remove only this item
          cartCopy.splice(targetIndex, 1);
          console.log('🛒 ISOLATED REMOVED');
        } else {
          // ISOLATED UPDATE: Update only this item's quantity
          cartCopy[targetIndex] = {
            ...cartCopy[targetIndex],
            quantity: safeQuantity
          };
          console.log('🛒 ISOLATED UPDATED');
        }
      } else {
        console.log('🛒 ITEM NOT FOUND FOR UPDATE');
      }
      
      console.log('🛒 AFTER UPDATE - New cart:', cartCopy.length, cartCopy.map(i => `${i.id}:${i.quantity}`));
      return cartCopy;
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
    console.log(`🛒 GET QTY - Looking for: ${itemKey}`);
    console.log('🛒 CART ITEMS KEYS:', cartItems.map(i => createItemKey(i.id, i.variant)));
    
    const item = cartItems.find(item => 
      createItemKey(item.id, item.variant) === itemKey
    );
    
    const qty = item?.quantity || 0;
    console.log(`🛒 GET QTY - Found qty: ${qty}`);
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