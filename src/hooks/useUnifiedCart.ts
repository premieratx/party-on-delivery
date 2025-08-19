import { useState, useCallback, useEffect } from 'react';

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
  // Use direct localStorage without the problematic useLocalStorage hook
  const getCartFromStorage = (): UnifiedCartItem[] => {
    try {
      const stored = localStorage.getItem('unified-cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const [cartItems, setCartItemsState] = useState<UnifiedCartItem[]>(getCartFromStorage);
  const [cartFlash, setCartFlash] = useState(false);

  const setCartItems = useCallback((updater: UnifiedCartItem[] | ((prev: UnifiedCartItem[]) => UnifiedCartItem[])) => {
    setCartItemsState(prevItems => {
      const newItems = typeof updater === 'function' ? updater(prevItems) : updater;
      try {
        localStorage.setItem('unified-cart', JSON.stringify(newItems));
        // Notify other hook instances in the same tab
        window.dispatchEvent(new CustomEvent('unified-cart:changed'));
      } catch (error) {
        console.warn('Failed to save cart to localStorage:', error);
      }
      return newItems;
    });
  }, []);

  // Cross-instance sync: update on storage or custom event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'unified-cart') {
        setCartItemsState(getCartFromStorage());
      }
    };
    const onCustom = () => {
      setCartItemsState(getCartFromStorage());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('unified-cart:changed', onCustom as unknown as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('unified-cart:changed', onCustom as unknown as EventListener);
    };
  }, []);

  // Simple key creation and matching helpers
  const getKey = (id: string, variant?: string) => `${id}::${variant || 'default'}`;
  const normalizeVariant = (v?: string) => (v && v.trim() !== '' ? String(v) : 'default');
  const normalizeId = (v: string | number | undefined | null) => String(v ?? '');
  
  const matchesItem = (item: UnifiedCartItem, id: string | number, variant?: string) => {
    const itemVariant = normalizeVariant(item.variant);
    const checkVariant = normalizeVariant(variant);
    const itemId = normalizeId(item.productId ?? item.id);
    const checkId = normalizeId(id);
    
    return itemId === checkId && itemVariant === checkVariant;
  };

  // Update quantity - FIXED AND RELIABLE
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number, productData?: Partial<UnifiedCartItem>) => {
    if (!id) {
      console.warn('🛒 updateQuantity: Missing product ID');
      return;
    }
    
    const qty = Math.max(0, Math.floor(Number(newQuantity) || 0));
    const normalizedVariant = normalizeVariant(variant);
    const nid = normalizeId(id);
    
    console.log('🛒 updateQuantity ATOMIC:', { 
      id: nid, 
      variant: normalizedVariant, 
      newQuantity: qty,
      operation: qty === 0 ? 'REMOVE' : qty > 0 ? 'SET' : 'INVALID'
    });
    
    setCartItems(currentItems => {
      // Find existing item using strict matching
      const existingIndex = currentItems.findIndex(item => {
        const itemId = normalizeId(item.productId ?? item.id);
        const itemVariant = normalizeVariant(item.variant);
        return itemId === nid && itemVariant === normalizedVariant;
      });
      
      if (qty <= 0) {
        // REMOVE operation
        if (existingIndex >= 0) {
          console.log('🛒 ATOMIC REMOVE:', id, normalizedVariant);
          return currentItems.filter((_, index) => index !== existingIndex);
        }
        return currentItems;
      }
      
      if (existingIndex >= 0) {
        // UPDATE operation
        console.log('🛒 ATOMIC UPDATE:', id, normalizedVariant, 'quantity:', qty);
        const newItems = [...currentItems];
        newItems[existingIndex] = { 
          ...newItems[existingIndex], 
          quantity: qty 
        };
        return newItems;
      } else if (productData) {
        // CREATE operation
        console.log('🛒 ATOMIC CREATE:', nid, normalizedVariant, 'quantity:', qty);
        const newItem: UnifiedCartItem = {
          id: nid,
          productId: nid,
          title: String(productData.title || `Product ${nid}`),
          name: String(productData.name || productData.title || `Product ${nid}`),
          price: Number(productData.price || 0),
          quantity: qty,
          image: String(productData.image || ''),
          variant: normalizedVariant,
          eventName: productData.eventName,
          category: productData.category
        };
        return [...currentItems, newItem];
      }
      
      return currentItems;
    });
  }, [setCartItems]);

  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    const item = cartItems.find(item => matchesItem(item, id, variant));
    return item?.quantity || 0;
  }, [cartItems]);

  // Add or increment item - FIXED
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    if (!item.id) {
      console.warn('🛒 addToCart: Missing item.id, skipping');
      return;
    }
    
    console.log('🛒 addToCart ATOMIC:', { 
      id: item.id, 
      variant: normalizeVariant(item.variant), 
      title: item.title 
    });
    
    // Get current quantity from current state
    const currentQty = cartItems.find(cartItem => matchesItem(cartItem, item.id, item.variant))?.quantity || 0;
    console.log('🛒 ATOMIC INCREMENT from', currentQty, 'to', currentQty + 1);
    
    // Use updateQuantity with product data (atomic operation)
    updateQuantity(item.id, item.variant, currentQty + 1, item);
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, [cartItems, updateQuantity]);

  const removeItem = useCallback((id: string, variant?: string) => {
    const baseItems = getCartFromStorage();
    setCartItems(baseItems.filter(item => !matchesItem(item, id, variant)));
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