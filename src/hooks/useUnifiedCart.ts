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

  // Simple key creation and matching helpers
  const getKey = (id: string, variant?: string) => `${id}::${variant || 'default'}`;
  const normalizeVariant = (v?: string) => (v && v.trim() !== '' ? v : 'default');
  const matchesItem = (i: UnifiedCartItem, id: string, variant?: string) =>
    (i.id === id || i.productId === id) && normalizeVariant(i.variant) === normalizeVariant(variant);

  // Add or increment item
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    if (!item.id) return;
    
    const key = getKey(item.id, item.variant);
    
    setCartItems(prev => {
      const idForKey = item.productId || item.id;
      const existing = prev.find(i => matchesItem(i, idForKey, item.variant));
      
      if (existing) {
        return prev.map(i => 
          matchesItem(i, idForKey, item.variant)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      
      return [...prev, {
        id: idForKey,
        productId: item.productId || item.id,
        title: item.title || item.name || '',
        name: item.name || item.title || '',
        price: Number(item.price) || 0,
        quantity: 1,
        image: item.image || '',
        variant: item.variant,
        eventName: item.eventName,
        category: item.category
      }];
    });
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number) => {
    const qty = Math.max(0, Math.floor(Number(newQuantity) || 0));
    
    setCartItems(prev => {
      if (qty <= 0) {
        return prev.filter(i => !matchesItem(i, id, variant));
      }
      
      return prev.map(i => 
        matchesItem(i, id, variant)
          ? { ...i, quantity: qty }
          : i
      );
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    setCartItems(prev => prev.filter(i => !matchesItem(i, id, variant)));
  }, []);

  // Empty cart
  const emptyCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const item = cartItems.find(i => matchesItem(i, id, variant));
    return item?.quantity || 0;
  }, [cartItems]);

  // Get totals
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
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
    trackAbandonedCart: () => {}
  };
};