import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedCartItem {
  id: string;
  title: string;
  name: string; // For Shopify compatibility - required to match legacy CartItem interface
  price: number;
  quantity: number;
  image: string; // Required for compatibility
  variant?: string;
  eventName?: string;
  category?: string;
  // Support both delivery and party planner item formats
  productId?: string; // For party planner compatibility
}

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useLocalStorage<UnifiedCartItem[]>('unified-cart', []);
  const [cartFlash, setCartFlash] = useState(false);

  // Sync with party-cart for backward compatibility
  useEffect(() => {
    const partyCart = localStorage.getItem('party-cart');
    if (partyCart && cartItems.length === 0) {
      try {
        const partyItems = JSON.parse(partyCart);
        if (Array.isArray(partyItems) && partyItems.length > 0) {
          // Convert party cart format to unified format
          const unifiedItems: UnifiedCartItem[] = partyItems.map(item => ({
            id: item.productId || item.id,
            productId: item.productId || item.id,
            title: item.title,
            name: item.title || item.name || '',
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            eventName: item.eventName,
            category: item.category
          }));
          setCartItems(unifiedItems);
          localStorage.removeItem('party-cart'); // Remove old format
        }
      } catch (error) {
        console.error('Error migrating party cart:', error);
      }
    }
  }, []);

  // Keep party-cart in sync for checkout page compatibility
  useEffect(() => {
    localStorage.setItem('party-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<UnifiedCartItem, 'quantity'> | UnifiedCartItem[]) => {
    console.log('useUnifiedCart: addToCart called with:', item);
    
    if (Array.isArray(item)) {
      // Handle multiple items (from party planner)
      console.log('Adding multiple items to cart:', item.length);
      setCartItems(prev => {
        let newCart = [...prev];
        
        item.forEach(newItem => {
          console.log('Processing item:', newItem);
          const existingIndex = newCart.findIndex(cartItem => 
            (cartItem.id === newItem.id || cartItem.productId === newItem.productId) && 
            cartItem.variant === newItem.variant
          );
          
          if (existingIndex >= 0) {
            if (newItem.quantity === 0) {
              newCart.splice(existingIndex, 1);
              console.log('Removed item from cart');
            } else {
              newCart[existingIndex] = { ...newItem };
              console.log('Updated existing item in cart');
            }
          } else if (newItem.quantity > 0) {
            newCart.push({ 
              ...newItem,
              id: newItem.id || newItem.productId || '',
              productId: newItem.productId || newItem.id,
              name: newItem.name || newItem.title || ''
            });
            console.log('Added new item to cart');
          }
        });
        
        console.log('New cart state:', newCart);
        return newCart;
      });
    } else {
      // Handle single item (from delivery widget)
      console.log('Adding single item to cart:', item);
      const itemToAdd: UnifiedCartItem = {
        ...item,
        quantity: 1,
        productId: item.productId || item.id,
        name: item.name || item.title || ''
      };
      
      setCartItems(prev => {
        const existingIndex = prev.findIndex(cartItem => 
          (cartItem.id === itemToAdd.id || cartItem.productId === itemToAdd.productId) && 
          cartItem.variant === itemToAdd.variant
        );
        
        if (existingIndex >= 0) {
          const newCart = [...prev];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + 1
          };
          console.log('Updated existing item quantity');
          return newCart;
        } else {
          console.log('Added new single item to cart');
          return [...prev, itemToAdd];
        }
      });
    }
    
    // Trigger flash animation
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);

    // Track abandoned cart after cart updates (delayed to avoid spam)
    setTimeout(() => trackAbandonedCart(), 30000);
  };

  const updateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    console.log('useUnifiedCart: updateQuantity called', { id, variant, quantity });
    setCartItems(prev => {
      if (quantity <= 0) {
        console.log('Removing item from cart');
        return prev.filter(item => 
          !((item.id === id || item.productId === id) && item.variant === variant)
        );
      }
      
      const existingIndex = prev.findIndex(item => 
        (item.id === id || item.productId === id) && item.variant === variant
      );
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity };
        console.log('Updated item quantity in cart');
        return newCart;
      }
      
      console.log('Item not found for quantity update');
      return prev;
    });
  };

  const removeItem = (id: string, variant?: string) => {
    setCartItems(prev => 
      prev.filter(item => 
        !((item.id === id || item.productId === id) && item.variant === variant)
      )
    );
  };

  const emptyCart = () => {
    setCartItems([]);
    localStorage.removeItem('party-cart');
  };

  const getCartItemQuantity = (id: string, variant?: string) => {
    const item = cartItems.find(item => 
      (item.id === id || item.productId === id) && item.variant === variant
    );
    return item?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const trackAbandonedCart = async () => {
    if (cartItems.length === 0) return;

    try {
      const sessionId = localStorage.getItem('sessionId') || Math.random().toString(36).substring(7);
      localStorage.setItem('sessionId', sessionId);

      const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
      const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
      
      await supabase.functions.invoke('track-abandoned-cart', {
        body: {
          session_id: sessionId,
          cart_items: cartItems,
          customer_email: customerInfo.email,
          customer_name: customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : null,
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
  };

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
    trackAbandonedCart
  };
};
