import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Loader2, Search, Share2 } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { useOptimizedProducts } from '@/hooks/useOptimizedProducts';
import { useGroupOrder } from '@/hooks/useGroupOrder';
import { MobileOptimizer, mobileStyles } from '@/utils/mobileOptimizations';
import { CheckoutProgress, useCheckoutProgress } from '@/components/common/CheckoutProgress';
import { PerformanceMonitor } from '@/components/common/PerformanceMonitor';
import { parseProductTitle } from '@/utils/productUtils';
import { toast } from 'sonner';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface OptimizedProductCategoriesProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
}

export const OptimizedProductCategories: React.FC<OptimizedProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState('spirits');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupParticipants, setShowGroupParticipants] = useState(false);
  const [checkoutDisabled, setCheckoutDisabled] = useState(false);
  
  const gridConfig = MobileOptimizer.getGridConfig();
  
  const {
    collections,
    loading,
    loadingMore,
    error,
    hasMore,
    cacheHit,
    loadMore,
    refreshProducts,
    getProductsByCategory,
    searchProducts
  } = useOptimizedProducts({
    initialLimit: gridConfig.initialProducts,
    loadMoreLimit: gridConfig.initialProducts
  });

  const {
    groupToken,
    participants,
    isHost,
    joinGroupOrder,
    clearGroupToken,
    shareLink
  } = useGroupOrder();

  const { steps, updateStep, resetSteps } = useCheckoutProgress();

  // Categories with product counts
  const categories = useMemo(() => [
    { id: 'spirits', name: 'Spirits', handle: 'spirits' },
    { id: 'beer', name: 'Beer', handle: 'tailgate-beer' },
    { id: 'wine', name: 'Wine', handle: 'wine' },
    { id: 'mixers', name: 'Mixers', handle: 'mixers-non-alcoholic' },
    { id: 'snacks', name: 'Snacks', handle: 'snacks' },
    { id: 'other', name: 'Other', handle: 'other' }
  ].map(category => ({
    ...category,
    count: getProductsByCategory(category.handle).length
  })), [collections, getProductsByCategory]);

  // Get products to display
  const displayProducts = useMemo(() => {
    if (searchQuery.trim()) {
      return searchProducts(searchQuery);
    }
    return getProductsByCategory(selectedCategory);
  }, [searchQuery, selectedCategory, searchProducts, getProductsByCategory]);

  // Debounced search
  const debouncedSearch = useCallback(
    MobileOptimizer.debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Get cart item quantity
  const getCartItemQuantity = useCallback((productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  }, [cartItems]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: ShopifyProduct, variant?: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant ? variant.id : product.variants[0]?.id
    };
    
    onAddToCart(cartItem);
  }, [onAddToCart]);

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    onUpdateQuantity(productId, variantId, newQty);
  }, [getCartItemQuantity, onUpdateQuantity]);

  // Share group order
  const shareGroupOrder = useCallback(async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Group order link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  }, [shareLink]);

  // Enhanced checkout with progress
  const handleCheckout = useCallback(async () => {
    if (checkoutDisabled) return;
    
    setCheckoutDisabled(true);
    resetSteps();
    
    try {
      updateStep('validate', 'active');
      
      // Validate cart
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // If in group order, aggregate all items
      if (groupToken && participants.length > 0) {
        const allItems = [
          ...cartItems,
          ...participants.flatMap(p => p.items || [])
        ];
        console.log('Group order checkout with aggregated items:', allItems);
      }
      
      updateStep('validate', 'completed');
      updateStep('payment', 'active');
      
      // Clear group token after successful order
      if (groupToken) {
        clearGroupToken();
      }
      
      onProceedToCheckout();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
      resetSteps();
    } finally {
      setCheckoutDisabled(false);
    }
  }, [cartItems, groupToken, participants, clearGroupToken, onProceedToCheckout, checkoutDisabled, updateStep, resetSteps]);

  // Remember selected category
  useEffect(() => {
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory && categories.find(c => c.id === savedCategory)) {
      setSelectedCategory(savedCategory);
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('selectedCategory', selectedCategory);
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
          {cacheHit && <p className="text-xs text-green-600">Using cached data</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshProducts} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <PerformanceMonitor />
      
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Select Products</h1>
          <div className="flex items-center gap-2">
            {groupToken && (
              <Button variant="outline" size="sm" onClick={shareGroupOrder}>
                <Share2 className="w-4 h-4 mr-1" />
                Share Group Order
              </Button>
            )}
            <Button 
              onClick={onOpenCart}
              className="relative"
              variant={cartItemCount > 0 ? "default" : "outline"}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart ({cartItemCount})
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              onChange={handleSearchInput}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="text-sm"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>

        {/* Group Order Info */}
        {groupToken && participants.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Group Order Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{participant.name}</span>
                    <span>{participant.items?.length || 0} items</span>
                  </div>
                ))}
              </div>
              {!isHost && (
                <p className="text-xs text-muted-foreground mt-2">
                  Only the host can proceed to checkout
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        <div className={`grid ${mobileStyles.grid.mobile} md:${mobileStyles.grid.tablet} lg:${mobileStyles.grid.desktop} mb-6`}>
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={getCartItemQuantity(product.id, product.variants[0]?.id)}
              onAddToCart={() => handleAddToCart(product)}
              onUpdateQuantity={(delta) => handleQuantityChange(product.id, product.variants[0]?.id, delta)}
            />
          ))}
        </div>

        {/* Load More */}
        {hasMore && !searchQuery && (
          <div className="text-center mb-6">
            <Button 
              onClick={loadMore} 
              disabled={loadingMore}
              variant="outline"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Products'
              )}
            </Button>
          </div>
        )}

        {/* Checkout Progress */}
        {checkoutDisabled && (
          <CheckoutProgress steps={steps} className="mb-6" />
        )}

        {/* Checkout Button */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto">
            <Button
              onClick={handleCheckout}
              disabled={checkoutDisabled || (groupToken && !isHost)}
              className="w-full"
              size="lg"
            >
              {checkoutDisabled ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Proceed to Checkout (${cartItemCount} items)`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Optimized Product Card Component
interface ProductCardProps {
  product: ShopifyProduct;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onAddToCart,
  onUpdateQuantity
}) => {
  const isMobile = window.innerWidth <= 768;
  const { cleanTitle, packageSize } = parseProductTitle(product.title);
  
  // Optimize image URL
  const optimizedImage = useMemo(() => {
    if (!product.image) return '';
    const separator = product.image.includes('?') ? '&' : '?';
    return `${product.image}${separator}width=300&height=300`;
  }, [product.image]);

  return (
    <Card className={`h-full flex flex-col ${mobileStyles.card.base} ${isMobile ? mobileStyles.card.mobile : mobileStyles.card.desktop}`}>
      <CardContent className={`flex flex-col h-full ${isMobile ? 'p-2' : 'p-4'}`}>
        {/* Product Image */}
        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
          <img
            src={optimizedImage}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className={`font-medium line-clamp-2 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {cleanTitle}
          </h3>
          {packageSize && (
            <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {packageSize}
            </p>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-xl'}`}>
                ${product.price.toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              )}
            </div>

            {/* Quantity Controls */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className={`p-0 flex-shrink-0 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}
                >
                  <Minus className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <span className={`font-medium min-w-[20px] text-center ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className={`p-0 flex-shrink-0 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}
                >
                  <Plus className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAddToCart}
                className={`w-full ${isMobile ? 'h-8 text-xs' : 'h-9 text-sm'}`}
                size={isMobile ? "sm" : "default"}
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};