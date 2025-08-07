import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
  }>;
}

interface CartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

interface UltraFastProductGridProps {
  category?: string;
  onAddToCart: (item: any) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  searchQuery?: string;
  collections?: string[];
}

export const UltraFastProductGrid: React.FC<UltraFastProductGridProps> = ({
  category,
  onAddToCart,
  cartItems,
  onUpdateQuantity,
  searchQuery,
  collections
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Ultra-fast product loading
  useEffect(() => {
    const loadProducts = async () => {
      const startTime = performance.now();
      
      try {
        console.log('🚀 UltraFast: Loading products...');
        
        // Always try instant cache first
        const { data, error } = await supabase.functions.invoke('instant-product-cache');
        
        if (error) {
          console.error('UltraFast: Instant cache error:', error);
          setProducts([]);
          return;
        }

        if (data?.success && data?.data?.products) {
          const loadTime = performance.now() - startTime;
          console.log(`⚡ UltraFast: Loaded ${data.data.products.length} products in ${loadTime}ms`);
          setProducts(data.data.products || []);
        } else {
          console.warn('UltraFast: No products in instant cache');
          setProducts([]);
        }
      } catch (err) {
        console.error('UltraFast: Exception loading products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on category, search, and collections
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product => {
        const productCategory = product.category?.toLowerCase() || '';
        const targetCategory = category.toLowerCase();
        
        // Map category names
        if (targetCategory === 'beer' && (productCategory.includes('beer') || productCategory.includes('tailgate'))) return true;
        if (targetCategory === 'wine' && (productCategory.includes('wine') || productCategory.includes('champagne'))) return true;
        if (targetCategory === 'spirits' && (productCategory.includes('spirit') || productCategory.includes('whiskey') || productCategory.includes('vodka') || productCategory.includes('gin') || productCategory.includes('rum') || productCategory.includes('tequila'))) return true;
        if (targetCategory === 'cocktails' && (productCategory.includes('cocktail') || productCategory.includes('ready-to-drink'))) return true;
        if (targetCategory === 'seltzers' && productCategory.includes('seltzer')) return true;
        if (targetCategory === 'mixers' && (productCategory.includes('mixer') || productCategory.includes('non-alcoholic'))) return true;
        if (targetCategory === 'party-supplies' && (productCategory.includes('party') || productCategory.includes('supplies') || productCategory.includes('decoration'))) return true;
        
        return productCategory.includes(targetCategory);
      });
    }

    // Filter by collections if specified
    if (collections && collections.length > 0) {
      // This would need collection mapping logic
      // For now, keep all products if collections are specified
    }

    return filtered.slice(0, 100); // Limit for performance
  }, [products, category, searchQuery, collections]);

  // Get cart item quantity
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  };

  // FIXED: Use addToCart with product data for proper cart management
  const handleAddToCart = (product: Product) => {
    const variant = product.variants?.[0];
    const variantId = variant?.id;
    
    console.log('🛒 UltraFast: Adding to cart:', { id: product.id, variant: variantId });
    
    // Use onAddToCart to provide complete product data
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant?.price || parseFloat(product.price),
      image: product.image,
      variant: variantId
    };
    
    console.log('🛒 UltraFastProductGrid: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = getCartItemQuantity(product.id, variantId);
    
    onUpdateQuantity(product.id, variantId, currentQty + 1);
  };

  const handleIncrement = (productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 INCREMENT - before:', {productId, variantId, currentQty});
    
    onUpdateQuantity(productId, variantId, currentQty + 1);
  };

  const handleDecrement = (productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 DECREMENT - before:', {productId, variantId, currentQty});
    
    if (currentQty > 0) {
      onUpdateQuantity(productId, variantId, currentQty - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {filteredProducts.map((product) => {
        const variant = product.variants?.[0];
        const variantId = variant?.id;
        const quantity = getCartItemQuantity(product.id, variantId);
        
        return (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="relative mb-3">
                <OptimizedImage
                  src={product.image}
                  alt={product.title}
                  className="w-full h-32 object-cover rounded"
                />
                {product.category && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-xs"
                  >
                    {product.category}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {product.title}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-primary">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
              </div>
              
              {quantity > 0 ? (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecrement(product.id, variantId)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold min-w-[2ch] text-center">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleIncrement(product.id, variantId)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => handleAddToCart(product)}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
