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
  
  const matchesItem = (item: UnifiedCartItem, id: string, variant?: string) => {
    const itemVariant = normalizeVariant(item.variant);
    const checkVariant = normalizeVariant(variant);
    const itemId = item.productId || item.id;
    
    return itemId === id && itemVariant === checkVariant;
  };

  // Update quantity - COMPLETELY REWRITTEN for reliability
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number, productData?: Partial<UnifiedCartItem>) => {
    const qty = Math.max(0, Math.floor(Number(newQuantity) || 0));
    
    console.log('🛒 updateQuantity:', { id, variant: normalizeVariant(variant), newQuantity: qty });
    
    setCartItems(prev => {
      // Find existing item with proper matching
      const existingIndex = prev.findIndex(item => matchesItem(item, id, variant));
      
      if (qty <= 0) {
        // Remove item if quantity is 0
        if (existingIndex >= 0) {
          console.log('🛒 Removing item from cart');
          return prev.filter((_, index) => index !== existingIndex);
        }
        return prev;
      }
      
      if (existingIndex >= 0) {
        // Update existing item
        console.log('🛒 Updating existing item quantity to:', qty);
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: qty };
        return updated;
      } else if (qty > 0 && productData) {
        // Create new item only if productData is provided
        console.log('🛒 Creating new item with quantity:', qty);
        const newItem: UnifiedCartItem = {
          id: id,
          productId: id,
          title: productData.title || `Product ${id}`,
          name: productData.name || productData.title || `Product ${id}`,
          price: productData.price || 0,
          quantity: qty,
          image: productData.image || '',
          variant: normalizeVariant(variant),
          eventName: productData.eventName,
          category: productData.category
        };
        return [...prev, newItem];
      }
      
      return prev;
    });
  }, []);

  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const item = cartItems.find(item => matchesItem(item, id, variant));
    return item?.quantity || 0;
  }, [cartItems]);

  // Add or increment item - FIXED to prevent conflicts
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    if (!item.id) {
      console.warn('🛒 addToCart: Missing item.id, skipping');
      return;
    }
    
    console.log('🛒 addToCart called with:', { id: item.id, variant: item.variant, title: item.title });
    
    const currentQty = getCartItemQuantity(item.id, item.variant);
    console.log('🛒 Current quantity:', currentQty, 'Adding 1 more');
    
    // Use updateQuantity with product data
    updateQuantity(item.id, item.variant, currentQty + 1, item);
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, [getCartItemQuantity, updateQuantity]);



  const removeItem = useCallback((id: string, variant?: string) => {
    setCartItems(prev => prev.filter(item => !matchesItem(item, id, variant)));
  }, []);

  // Empty cart
  const emptyCart = useCallback(() => {
    setCartItems([]);
  }, []);


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