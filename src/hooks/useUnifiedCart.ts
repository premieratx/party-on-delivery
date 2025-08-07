import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Global cart instance tracker to prevent multiple instances
let globalCartInstance: string | null = null;

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
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const [cartItems, setCartItems] = useLocalStorage<UnifiedCartItem[]>('unified-cart', []);
  const [cartFlash, setCartFlash] = useState(false);

  // Ensure only one cart instance is active
  useEffect(() => {
    if (!globalCartInstance) {
      globalCartInstance = instanceId;
      console.log('🛒 CART MASTER INSTANCE:', instanceId);
    } else if (globalCartInstance !== instanceId) {
      console.warn('🛒 DUPLICATE CART INSTANCE BLOCKED:', instanceId);
      return;
    }

    return () => {
      if (globalCartInstance === instanceId) {
        globalCartInstance = null;
        console.log('🛒 CART MASTER INSTANCE RELEASED:', instanceId);
      }
    };
  }, [instanceId]);

  // Block all operations if this isn't the master instance
  const isMasterInstance = globalCartInstance === instanceId;

  // Simple key creation and matching helpers
  const getKey = (id: string, variant?: string) => `${id}::${variant || 'default'}`;
  const normalizeVariant = (v?: string) => (v && v.trim() !== '' ? v : 'default');
  
  const matchesItem = (item: UnifiedCartItem, id: string, variant?: string) => {
    const itemVariant = normalizeVariant(item.variant);
    const checkVariant = normalizeVariant(variant);
    const itemId = item.productId || item.id;
    
    return itemId === id && itemVariant === checkVariant;
  };

  // Update quantity - MASTER INSTANCE ONLY
  const updateQuantity = useCallback((id: string, variant: string | undefined, newQuantity: number, productData?: Partial<UnifiedCartItem>) => {
    if (!isMasterInstance) {
      console.warn('🛒 BLOCKED: updateQuantity from non-master instance');
      return;
    }
    if (!id) {
      console.warn('🛒 updateQuantity: Missing product ID');
      return;
    }
    
    const qty = Math.max(0, Math.floor(Number(newQuantity) || 0));
    const normalizedVariant = normalizeVariant(variant);
    
    console.log('🛒 updateQuantity ATOMIC:', { 
      id, 
      variant: normalizedVariant, 
      newQuantity: qty,
      operation: qty === 0 ? 'REMOVE' : qty > 0 ? 'SET' : 'INVALID'
    });
    
    setCartItems(prev => {
      // Create a completely new array to prevent mutations
      const currentItems = [...prev];
      
      // Find existing item using strict matching
      const existingIndex = currentItems.findIndex(item => {
        const itemId = item.productId || item.id;
        const itemVariant = normalizeVariant(item.variant);
        return itemId === id && itemVariant === normalizedVariant;
      });
      
      if (qty <= 0) {
        // REMOVE operation
        if (existingIndex >= 0) {
          console.log('🛒 ATOMIC REMOVE:', id, normalizedVariant);
          return currentItems.filter((_, index) => index !== existingIndex);
        }
        // Item doesn't exist, nothing to remove
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
        console.log('🛒 ATOMIC CREATE:', id, normalizedVariant, 'quantity:', qty);
        const newItem: UnifiedCartItem = {
          id: id,
          productId: id,
          title: productData.title || `Product ${id}`,
          name: productData.name || productData.title || `Product ${id}`,
          price: productData.price || 0,
          quantity: qty,
          image: productData.image || '',
          variant: normalizedVariant,
          eventName: productData.eventName,
          category: productData.category
        };
        return [...currentItems, newItem];
      }
      
      // No changes needed
      return currentItems;
    });
  }, [isMasterInstance]);

  const getCartItemQuantity = useCallback((id: string, variant?: string) => {
    if (!isMasterInstance) return 0;
    const item = cartItems.find(item => matchesItem(item, id, variant));
    return item?.quantity || 0;
  }, [cartItems, isMasterInstance]);

  // Add or increment item - MASTER INSTANCE ONLY
  const addToCart = useCallback((item: Omit<UnifiedCartItem, 'quantity'>) => {
    if (!isMasterInstance) {
      console.warn('🛒 BLOCKED: addToCart from non-master instance');
      return;
    }
    if (!item.id) {
      console.warn('🛒 addToCart: Missing item.id, skipping');
      return;
    }
    
    console.log('🛒 addToCart ATOMIC:', { 
      id: item.id, 
      variant: normalizeVariant(item.variant), 
      title: item.title 
    });
    
    // Get current quantity atomically
    const currentQty = cartItems.find(cartItem => matchesItem(cartItem, item.id, item.variant))?.quantity || 0;
    console.log('🛒 ATOMIC INCREMENT from', currentQty, 'to', currentQty + 1);
    
    // Use updateQuantity with product data (atomic operation)
    updateQuantity(item.id, item.variant, currentQty + 1, item);
    
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  }, [cartItems, updateQuantity, isMasterInstance]);

  const removeItem = useCallback((id: string, variant?: string) => {
    if (!isMasterInstance) return;
    setCartItems(prev => prev.filter(item => !matchesItem(item, id, variant)));
  }, [isMasterInstance]);

  // Empty cart - MASTER INSTANCE ONLY
  const emptyCart = useCallback(() => {
    if (!isMasterInstance) return;
    setCartItems([]);
  }, [isMasterInstance]);

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
    trackAbandonedCart: () => {},
    isMasterInstance // For debugging
  };
};