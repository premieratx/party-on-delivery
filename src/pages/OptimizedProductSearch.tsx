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
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
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

  // Categories for filtering (based on Shopify product types)
  const categories = [
    { id: 'all', label: 'All Products', productType: null as string | null },
    { id: 'spirits', label: 'Spirits', productType: 'spirits' },
    { id: 'beer', label: 'Beer', productType: 'beer' },
    { id: 'wine', label: 'Wine', productType: 'wine' },
    { id: 'seltzer', label: 'Seltzer', productType: 'seltzer' },
    { id: 'mixers', label: 'Mixers & N/A', productType: 'mixers' }
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
        // Get all products using get-unified-products
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: response, error } = await supabase.functions.invoke('get-unified-products', {
          body: { 
            use_type: 'search',
            lightweight: false, // Get all products
            force_refresh: false
          }
        });

        if (error) {
          console.error('Failed to load products:', error);
          setError('Failed to load products');
          return;
        }

        const products = response?.products || [];
        console.log(`✅ Loaded ${products.length} products for search app`);
        
        if (!mounted) return;
        setAllProducts(products);
        if (!searchQuery.trim()) {
          setProducts(products);
        }
      } catch (e) {
        console.error('Product load failed:', e);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // IMPROVED Real-time search with EXACT matching - only 4 criteria  
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const timer = setTimeout(() => {
        // EXACT MATCHING search - only these 4 criteria, no description
        const filtered = allProducts.filter((p) => {
          const title = String(p.title || '').toLowerCase();
          const productType = String(p.product_type || '').toLowerCase();
          const category = String(p.category || '').toLowerCase();
          
          // Check collection handles
          const collections = (productCollectionsRef.current[p.id] || []).join(' ').toLowerCase();
          
          // ONLY match these 4 criteria: product name, product type, category, collection
          return title.includes(q) || 
                 productType.includes(q) || 
                 category.includes(q) || 
                 collections.includes(q);
        });
        console.log(`🔍 SEARCH APP: Found ${filtered.length} products matching "${searchQuery}"`);
        setProducts(filtered);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // No query: show category view from full catalog
      const current = categories.find(c => c.id === selectedCategory);
      let base = allProducts;
      
      if (current && current.productType && selectedCategory !== 'all') {
        // Filter by Shopify product type
        const productType = current.productType.toLowerCase();
        base = allProducts.filter(p => {
          const pType = (p.product_type || '').toLowerCase();
          return pType === productType || pType.includes(productType);
        });
      }

      // Spirits category: subcategories based on product type and keywords
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
          const title = norm(p.title);
          const tagsArr = Array.isArray(p.tags)
            ? p.tags.map((t: any) => norm(t))
            : norm(p.tags || '').split(',').map((t: any) => norm(t)).filter(Boolean);
          
          // Check if product type contains 'spirit' or title/tags match spirit keywords
          const isSpirit = type.includes('spirit') || keys.some(k => 
            type.includes(k) || title.includes(k) || tagsArr.some(tag => tag.includes(k))
          );
          
          if (selectedSpirit === 'all') return isSpirit;
          return isSpirit && keys.some(k => type.includes(k) || title.includes(k) || tagsArr.some(tag => tag.includes(k)));
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {displayProducts.map((product) => {
                  const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                  
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in">
                      <div className="aspect-square relative overflow-hidden">
                        <OptimizedImage
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover hover-scale"
                        />
                      </div>
                      
                      <CardContent className="p-3 space-y-3">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        
                        {/* Price and Add to Cart - Centered */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="font-bold text-primary text-lg">
                            ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                          </span>

                          {quantity > 0 ? (
                            <div className="flex items-center justify-between bg-muted rounded-md p-1 w-full max-w-[120px]">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <span className="font-medium px-2">{quantity}</span>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-6xl">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No results for "${searchQuery}"${selectedCategory !== 'all' ? ` in ${categories.find(c => c.id === selectedCategory)?.label}` : ''}`
                    : 'No products available in this category'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Sidebar */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Bottom Cart Bar for Mobile */}
        <MobileBottomCartBar
          cartItemCount={getTotalItems()}
          totalAmount={getTotalPrice()}
          onOpenCart={() => setIsCartOpen(true)}
        />
    </div>
  );
}