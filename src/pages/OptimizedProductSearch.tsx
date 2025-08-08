import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Filter,
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedShopify } from '@/utils/optimizedShopifyClient';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { getInstantProducts } from '@/utils/instantCacheClient';
import { useIsMobile } from '@/hooks/use-mobile';

export default function OptimizedProductSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useUnifiedCart();

  const { 
    getCollectionProducts, 
    searchProducts 
  } = useOptimizedShopify();
  
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productCollectionsRef = useRef<Record<string, string[]>>({});
  const isMobile = useIsMobile();
  const [hideFilters, setHideFilters] = useState(false);
  const lastYRef = useRef(0);

  // Categories for filtering (map to collection handles for consistency)
  const categories = [
    { id: 'all', label: 'All Products', handle: null as string | null },
    { id: 'spirits', label: 'Spirits', handle: 'spirits' },
    { id: 'beer', label: 'Beer', handle: 'tailgate-beer' },
    { id: 'cocktails', label: 'Cocktails', handle: 'cocktail-kits' },
    { id: 'mixers', label: 'Mixers & N/A', handle: 'mixers-non-alcoholic' },
    { id: 'seltzers', label: 'Seltzers', handle: 'seltzer-collection' }
  ];

  // Get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variantId || 'default';
      return itemId === productId && itemVariant === checkVariant;
    });
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined
    };
    
    console.log('🛒 OptimizedProductSearch: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = cartItem.variant || 'default';
      return itemId === cartItem.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
    updateQuantity(cartItem.id, cartItem.variant, currentQty + 1, cartItem);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
      // Remove from cart entirely if quantity becomes 0
      updateQuantity(productId, variantId, 0);
    } else {
      updateQuantity(productId, variantId, newQty);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const searchResults = await searchProducts(query);
      setProducts(searchResults);
    } catch (err) {
      setError('Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load full catalog instantly for initial view and category filtering
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const instant = await getInstantProducts();
        const collections = instant.collections || [];
        const map: Record<string, any> = {};
        const pcMap: Record<string, string[]> = {};
        collections.forEach((col: any) => {
          (col.products || []).forEach((p: any) => {
            map[p.id] = map[p.id] || p;
            pcMap[p.id] = pcMap[p.id] || [];
            if (!pcMap[p.id].includes(col.handle)) pcMap[p.id].push(col.handle);
          });
        });
        const list = Object.values(map);
        if (!mounted) return;
        productCollectionsRef.current = pcMap;
        setAllProducts(list as any[]);
        if (!searchQuery.trim()) {
          setProducts(list as any[]);
        }
      } catch (e) {
        console.error('Instant catalog load failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch(searchQuery);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // No query: show category view from full catalog
      const current = categories.find(c => c.id === selectedCategory);
      if (current && current.handle) {
        const handle = current.handle;
        const filtered = allProducts.filter(p => (productCollectionsRef.current[p.id] || []).includes(handle));
        setProducts(filtered);
      } else {
        setProducts(allProducts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, allProducts]);

  // Mobile: hide filters on scroll to maximize products shown
  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      if (y > last + 10) {
        setHideFilters(true);
      } else if (y < last - 10 || y < 40) {
        setHideFilters(false);
      }
      lastYRef.current = y;
    };
    window.addEventListener('scroll', onScroll as any, { passive: true } as any);
    return () => window.removeEventListener('scroll', onScroll as any);
  }, [isMobile]);

  // Displayed products: when searching, ignore category filters (search trumps filters)
  const displayProducts = products;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <h1 className="text-xl font-bold flex-1">Product Search</h1>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              {getTotalItems() > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for spirits, beer, cocktails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className={`sticky top-28 z-20 bg-background/95 backdrop-blur-md border-b transition-transform duration-300 ${isMobile && hideFilters ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-muted-foreground">Searching products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            {searchQuery && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {displayProducts.length} results for "{searchQuery}"
                  {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
                </p>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                  
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative">
                        <OptimizedImage
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-primary">
                            ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                          </span>
                        </div>

                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                              className="h-6 w-6 md:h-8 md:w-8 p-0"
                            >
                              <Minus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            
                            <span className="font-medium px-3">{quantity}</span>
                            
                            <Button
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                              className="h-6 w-6 md:h-8 md:w-8 p-0"
                            >
                              <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try different keywords or browse our categories
                </p>
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                <p className="text-muted-foreground">
                  Enter keywords to find the perfect products for your party
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Checkout Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4">
          <Button
            onClick={() => navigate('/checkout')}
            className="w-full h-12 text-lg font-semibold shadow-lg"
          >
            Checkout ({getTotalItems()} items) • ${getTotalPrice().toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}