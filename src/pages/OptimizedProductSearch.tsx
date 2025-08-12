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
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { getInstantProducts } from '@/utils/instantCacheClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
export default function OptimizedProductSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpirit, setSelectedSpirit] = useState<string>('all');
  
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useUnifiedCart();

  
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

  // Spirit types visible when Spirits is selected
  const spiritTypes = [
    { id: 'all', label: 'All Spirits' },
    { id: 'whiskey', label: 'Whiskey' },
    { id: 'vodka', label: 'Vodka' },
    { id: 'gin', label: 'Gin' },
    { id: 'rum', label: 'Rum' },
    { id: 'tequila', label: 'Tequila' },
    { id: 'mezcal', label: 'Mezcal' },
    { id: 'liqueurs', label: 'Liqueurs' },
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
    const firstVariantId = product.variants?.[0]?.id;
    const cartItem = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      // Always use the first variant id when present, even for Default Title
      variant: firstVariantId ? String(firstVariantId) : 'default',
    };
    
    console.log('🛒 OptimizedProductSearch: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = cartItem.variant || 'default';
      return String(itemId) === String(cartItem.id) && String(itemVariant) === String(checkVariant);
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

// Local in-memory search is handled in the debounced useEffect for instant results
  // Load full catalog instantly for initial view and category filtering
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Give instant cache a bit more time on first load; then force refresh if empty
        const instant = await getInstantProducts({ timeoutMs: 1500 });
        const collections = instant.collections || [];
        const map: Record<string, any> = {};
        const pcMap: Record<string, string[]> = {};
        if (collections.length > 0) {
          collections.forEach((col: any) => {
            (col.products || []).forEach((p: any) => {
              map[p.id] = map[p.id] || p;
              pcMap[p.id] = pcMap[p.id] || [];
              if (!pcMap[p.id].includes(col.handle)) pcMap[p.id].push(col.handle);
            });
          });
        }
        // Fallback: some responses only include products without collections
        let list: any[] = Object.values(map);
        if (list.length === 0 && Array.isArray(instant.products) && instant.products.length > 0) {
          console.warn('Instant cache missing collections; falling back to products array');
          list = instant.products as any[];
        }

        // If still empty, try a force refresh
        if (list.length === 0) {
          const retry = await getInstantProducts({ forceRefresh: true, timeoutMs: 3000 });
          const retryCollections = retry.collections || [];
          const map2: Record<string, any> = {};
          const pcMap2: Record<string, string[]> = {};
          if (retryCollections.length > 0) {
            retryCollections.forEach((col: any) => {
              (col.products || []).forEach((p: any) => {
                map2[p.id] = map2[p.id] || p;
                pcMap2[p.id] = pcMap2[p.id] || [];
                if (!pcMap2[p.id].includes(col.handle)) pcMap2[p.id].push(col.handle);
              });
            });
          }
          list = Object.values(map2);
          if (list.length === 0 && Array.isArray(retry.products) && retry.products.length > 0) {
            list = retry.products as any[];
          }
          if (Object.keys(pcMap2).length > 0) {
            productCollectionsRef.current = pcMap2;
          }
        } else {
          productCollectionsRef.current = pcMap;
        }

        if (!mounted) return;
        setAllProducts(list as any[]);
        if (!searchQuery.trim()) {
          setProducts(list as any[]);
        }
      } catch (e) {
        console.error('Instant catalog load failed', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced local search (fast, uses full catalog)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const timer = setTimeout(() => {
        const filtered = allProducts.filter((p) =>
          String(p.title).toLowerCase().includes(q) ||
          String(p.description || '').toLowerCase().includes(q) ||
          String(p.handle || '').toLowerCase().includes(q)
        );
        setProducts(filtered);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // No query: show category view from full catalog
      const current = categories.find(c => c.id === selectedCategory);
      let base = allProducts;
      if (current && current.handle && selectedCategory !== 'spirits') {
        const handle = current.handle;
        base = allProducts.filter(p => (productCollectionsRef.current[p.id] || []).includes(handle));
      }

      // Spirits category: broaden matching to maximize results (product_type, tags, collection handles, title, handle)
      if (selectedCategory === 'spirits') {
        const norm = (s: any) => String(s || '').trim().toLowerCase();
        const spiritKeywordSets: Record<string, string[]> = {
          all: ['whiskey','whisky','bourbon','rye','scotch','vodka','gin','rum','tequila','mezcal','brandy','cognac','liqueur','liqueurs','amaro','aperitif','digestif','cordial'],
          whiskey: ['whiskey','whisky','bourbon','rye','scotch'],
          vodka: ['vodka'],
          gin: ['gin'],
          rum: ['rum'],
          tequila: ['tequila'],
          mezcal: ['mezcal'],
          liqueurs: ['liqueur','liqueurs','amaro','aperitif','digestif','cordial'],
        };
        const keys = spiritKeywordSets[selectedSpirit as keyof typeof spiritKeywordSets] || spiritKeywordSets.all;

        base = allProducts.filter((p) => {
          const type = norm(p.product_type || p.productType);
          const tagsArr = Array.isArray(p.tags)
            ? p.tags.map((t: any) => norm(t))
            : norm(p.tags).split(',').map((t: any) => norm(t)).filter(Boolean);
          const handles = (productCollectionsRef.current[p.id] || []).map(h => norm(h));
          const haystack = [type, ...tagsArr, ...handles, norm(p.title), norm(p.handle)].filter(Boolean);
          return keys.some(k => haystack.some(h => h.includes(k)));
        });
      }

      setProducts(base);
    }
  }, [searchQuery, selectedCategory, selectedSpirit, allProducts]);

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
      // Hide mobile keyboard on scroll by blurring focused input
      const ae = document.activeElement as HTMLElement | null;
      if (ae && ae.tagName === 'INPUT') {
        (ae as HTMLInputElement).blur();
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
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
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
      <div className="border-b bg-background/95 backdrop-blur-md sticky top-16 z-40">
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

      <div className={`border-b bg-background/95 backdrop-blur-md sticky top-[7rem] z-40 ${hideFilters ? 'translate-y-[-100%]' : ''} transition-transform`}>
        <div className="container mx-auto px-4 py-3">
          <RadioGroup
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <RadioGroupItem value={category.id} id={`cat-${category.id}`} className="sr-only" />
                <Label
                  htmlFor={`cat-${category.id}`}
                  className={`px-3 py-2 rounded-md border cursor-pointer text-sm ${selectedCategory === category.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-accent'}`}
                >
                  {category.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {selectedCategory === 'spirits' && (
        <div className="border-b bg-background/95 backdrop-blur-md sticky top-[9.75rem] z-40">
          <div className="container mx-auto px-4 py-2">
            <RadioGroup
              value={selectedSpirit}
              onValueChange={setSelectedSpirit}
              className="flex flex-wrap gap-2"
            >
              {spiritTypes.map((t) => (
                <div key={t.id} className="flex items-center">
                  <RadioGroupItem value={t.id} id={`sp-${t.id}`} className="sr-only" />
                  <Label
                    htmlFor={`sp-${t.id}`}
                    className={`px-3 py-2 rounded-md border cursor-pointer text-sm ${selectedSpirit === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-accent'}`}
                  >
                    {t.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

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
            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
                {displayProducts.map((product) => {
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
                        
                        <div className="flex items-center justify-center mb-3">
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
                              className="h-10 w-10 md:h-10 md:w-10 p-0"
                            >
                              <Minus className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                            
                            <span className="font-medium px-3">{quantity}</span>
                            
                            <Button
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                              className="h-10 w-10 md:h-10 md:w-10 p-0"
                            >
                              <Plus className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleAddToCart(product)}
                              aria-label="Add to cart"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center"
                            >
                              <Plus className="h-5 w-5 md:h-6 md:w-6" strokeWidth={4} />
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

      {/* Bottom Cart Bar - persistent */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
}