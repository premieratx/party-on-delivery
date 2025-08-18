/**
 * Emergency fallback system for when edge functions fail
 */

import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  image: string;
  category?: string;
  app_category?: string;
  collection_handles?: string[];
  variants?: any[];
}

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'fallback-1',
    title: 'Premium Whiskey Selection',
    handle: 'premium-whiskey',
    price: 45.99,
    image: '/placeholder-whiskey.jpg',
    category: 'spirits',
    app_category: 'spirits',
    collection_handles: ['whiskey', 'spirits'],
    variants: [{ price: '45.99', title: 'Default', inventory_quantity: 10 }]
  },
  {
    id: 'fallback-2', 
    title: 'Craft Beer Pack',
    handle: 'craft-beer-pack',
    price: 24.99,
    image: '/placeholder-beer.jpg',
    category: 'beer',
    app_category: 'beer',
    collection_handles: ['beer', 'craft-beer'],
    variants: [{ price: '24.99', title: 'Default', inventory_quantity: 15 }]
  },
  {
    id: 'fallback-3',
    title: 'Wine Collection',
    handle: 'wine-collection',
    price: 32.99,
    image: '/placeholder-wine.jpg',
    category: 'wine',
    app_category: 'wine', 
    collection_handles: ['wine', 'red-wine'],
    variants: [{ price: '32.99', title: 'Default', inventory_quantity: 8 }]
  }
];

export async function getProductsWithFallback(category?: string, limit = 30): Promise<Product[]> {
  try {
    // Try cache first
    const { data: cachedProducts } = await supabase
      .from('shopify_products_cache')
      .select('*')
      .limit(limit);

    if (cachedProducts && cachedProducts.length > 0) {
      return cachedProducts.map(p => {
        // Safely parse variants and price from JSON data
        let variants: any[] = [];
        let price = 0;
        
        try {
          const data = typeof p.data === 'object' && p.data ? p.data as any : {};
          variants = Array.isArray(data.variants) ? data.variants : [];
          price = parseFloat(variants[0]?.price || p.price?.toString() || '0');
        } catch {
          price = parseFloat(p.price?.toString() || '0');
        }

        return {
          id: p.id,
          title: p.title || 'Unknown Product',
          handle: p.handle || p.id,
          price,
          image: p.image || '/placeholder.jpg',
          category: p.category,
          app_category: p.category,
          collection_handles: p.collection_handles || [],
          variants
        };
      });
    }

    // Fallback to static products
    console.warn('Using fallback products due to API failures');
    return category 
      ? FALLBACK_PRODUCTS.filter(p => p.app_category === category)
      : FALLBACK_PRODUCTS;

  } catch (error) {
    console.error('Error in emergency fallback:', error);
    return FALLBACK_PRODUCTS;
  }
}

export function createCircuitBreaker(
  func: Function, 
  threshold = 5, 
  timeout = 30000
) {
  let failures = 0;
  let lastFailTime = 0;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return async (...args: any[]) => {
    const now = Date.now();

    if (state === 'OPEN') {
      if (now - lastFailTime > timeout) {
        state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await func(...args);
      if (state === 'HALF_OPEN') {
        state = 'CLOSED';
        failures = 0;
      }
      return result;
    } catch (error) {
      failures++;
      lastFailTime = now;
      
      if (failures >= threshold) {
        state = 'OPEN';
      }
      
      throw error;
    }
  };
}