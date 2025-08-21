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
import { ultraFastSearch } from '@/utils/ultraFastSearch';
import { supabase } from '@/integrations/supabase/client';
import { useSearchInterface } from '@/hooks/useSearchInterface';
export default function OptimizedProductSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpirit, setSelectedSpirit] = useState<string>('all');
  
  // Enhanced mobile search interface with dynamic UI hiding
  const {
    searchInputRef,
    handleSearchFocus,
    handleSearchBlur,
    isSearchFocused,
    headerCompressed,
    isScrolling
  } = useSearchInterface();
  
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
  
  // Search optimization with debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Dynamic categories from hierarchical categorization system
  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Products', productType: null as string | null }
  ]);
  
  // Dynamic subcategories (product types) based on selected category
  const [subcategories, setSubcategories] = useState<Array<{ id: string; label: string; count?: number }>>([
    { id: 'all', label: 'All' }
  ]);

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

  // Load hierarchical categories from Supabase and products
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Loading hierarchical categories and products...');
        
        // Load categories from hierarchical system
        const { data: hierarchicalData, error: hierarchicalError } = await supabase
          .from('product_hierarchical_categories')
          .select('categories, product_type, COUNT(*) as count')
          .neq('categories', ['other']);
        
        if (!hierarchicalError && hierarchicalData) {
          console.log('📊 Hierarchical data loaded:', hierarchicalData);
          
          // Extract unique main categories
          const categoryMap = new Map();
          categoryMap.set('all', { id: 'all', label: 'All Products', count: 0 });
          
          hierarchicalData.forEach((item: any) => {
            if (item.categories && item.categories.length > 0) {
              const mainCategory = item.categories[0];
              const friendlyName = mainCategory === 'beer' ? 'Beer' :
                                mainCategory === 'wine' ? 'Wine' :
                                mainCategory === 'spirits' ? 'Spirits' :
                                mainCategory === 'mixers' ? 'Mixers' :
                                mainCategory === 'snacks' ? 'Snacks' :
                                mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
              
              if (!categoryMap.has(mainCategory)) {
                categoryMap.set(mainCategory, { 
                  id: mainCategory, 
                  label: friendlyName, 
                  productType: mainCategory,
                  count: 0 
                });
              }
            }
          });
          
          const dynamicCategories = [
            { id: 'all', label: 'All Products', productType: null },
            ...Array.from(categoryMap.values()).filter(cat => cat.id !== 'all')
          ];
          
          console.log('🏷️ Dynamic categories:', dynamicCategories);
          setCategories(dynamicCategories);
        }
        
        // Warm up ultra-fast search cache for instant results
        await ultraFastSearch.warmUpCache();
        
        // Get all products instantly
        const products = await ultraFastSearch.getAllProducts();
        
        console.log(`✅ Loaded ${products.length} products instantly`);
        
        setAllProducts(products);
        setProducts(products);
        
        // Build collection mappings for filtering
        const collectionMap: Record<string, string[]> = {};
        products.forEach(product => {
          if (product.collection_handles) {
            product.collection_handles.forEach((handle: string) => {
              if (!collectionMap[handle]) {
                collectionMap[handle] = [];
              }
              collectionMap[handle].push(product.id);
            });
          }
        });
        productCollectionsRef.current = collectionMap;
        
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load products. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);
  
  // Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCategory === 'all') {
        setSubcategories([{ id: 'all', label: 'All' }]);
        return;
      }
      
      try {
        const { data: subcategoryData, error } = await supabase
          .from('product_hierarchical_categories')
          .select('product_type, COUNT(*) as count')
          .contains('categories', [selectedCategory])
          .not('product_type', 'is', null)
          .neq('product_type', '');
        
        if (!error && subcategoryData) {
          const subcategoryMap = new Map();
          subcategoryMap.set('all', { id: 'all', label: 'All', count: 0 });
          
          subcategoryData.forEach((item: any) => {
            if (item.product_type) {
              // Clean up product type names
              let cleanName = item.product_type;
              if (cleanName.toLowerCase().includes('liquor')) cleanName = 'Liquor & Spirits';
              if (cleanName.toLowerCase().includes('beer and seltzer')) cleanName = 'Beer & Seltzers';
              
              subcategoryMap.set(item.product_type, {
                id: item.product_type,
                label: cleanName,
                count: item.count || 0
              });
            }
          });
          
          const dynamicSubcategories = [
            { id: 'all', label: 'All' },
            ...Array.from(subcategoryMap.values())
              .filter(sub => sub.id !== 'all')
              .sort((a, b) => (b.count || 0) - (a.count || 0)) // Sort by count descending
          ];
          
          console.log(`🎯 Subcategories for ${selectedCategory}:`, dynamicSubcategories);
          setSubcategories(dynamicSubcategories);
        }
      } catch (error) {
        console.error('Failed to load subcategories:', error);
      }
    };
    
    loadSubcategories();
  }, [selectedCategory]);

  // Debounced search query for better performance
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150); // 150ms debounce for faster typing
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Ultra-fast search with optimized debouncing
  useEffect(() => {
    const performSearch = async () => {
      const q = debouncedQuery.trim().toLowerCase();
      if (q) {
        console.log(`🔍 ULTRA-FAST SEARCH: "${q}"`);
        const startTime = performance.now();
        
        try {
          const result = await ultraFastSearch.searchProducts(q, {
            limit: 200,
            useCache: true // Aggressive caching for repeat searches
          });
          
          const duration = performance.now() - startTime;
          console.log(`⚡ SEARCH COMPLETED: "${q}" - ${result.products.length} results in ${duration.toFixed(2)}ms (${result.fromCache ? 'cached' : 'fresh'})`);
          
          setProducts(result.products);
        } catch (error) {
          console.error('Ultra-fast search error:', error);
          // Optimized fallback search
          const filtered = allProducts.filter((p) => {
            const title = String(p.title || '').toLowerCase();
            const productType = String(p.product_type || '').toLowerCase();
            const category = String(p.category || '').toLowerCase();
            
            return title.includes(q) || 
                   category.includes(q) || 
                   productType.includes(q);
          });
          setProducts(filtered);
        }
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

        // Apply subcategory filter if selected
        if (selectedSpirit !== 'all') {
          base = allProducts.filter((p) => {
            const productType = (p.product_type || '').toLowerCase();
            const title = (p.title || '').toLowerCase();
            const selectedSubtype = selectedSpirit.toLowerCase();
            
            return productType.includes(selectedSubtype) || 
                   title.includes(selectedSubtype) ||
                   productType === selectedSubtype;
          });
        }

        setProducts(base);
      }
    };

    performSearch();
  }, [debouncedQuery, selectedCategory, selectedSpirit, allProducts]);

  // Enhanced search input handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Displayed products: when searching, ignore category filters (search trumps filters)
  const displayProducts = products;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Dynamically hide on mobile when scrolling */}
      <div className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b transition-transform duration-300 ${isMobile && isScrolling && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-3 max-w-full">
        <div className={`flex items-center gap-4 w-full transition-all duration-300 ${isMobile && headerCompressed ? 'h-12' : 'h-16'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <h1 className={`font-bold flex-1 truncate transition-all duration-300 ${isMobile && headerCompressed ? 'text-base' : 'text-lg sm:text-xl'}`}>
            Product Search
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="relative gap-2 flex-shrink-0"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {getTotalItems() > 0 && (
              <Badge variant="destructive" className="ml-1">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      </div>

      {/* Search Bar - Enhanced mobile behavior */}
      <div className={`border-b bg-background/95 backdrop-blur-md sticky z-40 transition-all duration-300 ${isMobile && isScrolling && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'} ${isMobile && headerCompressed ? 'top-12' : 'top-16'}`}>
        <div className="container mx-auto px-3 py-4 max-w-full">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for spirits, beer, cocktails..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="pl-10 pr-4 h-12 text-base sm:text-lg w-full"
            />
          </div>
        </div>
      </div>

      {/* Categories - Hide during mobile scroll but show when search focused */}
      <div className={`border-b bg-background/95 backdrop-blur-md sticky z-40 transition-all duration-300 overflow-hidden ${
        isMobile && isScrolling && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
      } ${isMobile && headerCompressed ? 'top-[6rem]' : 'top-[7rem]'}`}>
        <div className="container mx-auto px-3 py-3 max-w-full">
          <div className="overflow-x-hidden">
            <RadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="flex flex-wrap gap-2 justify-start"
            >
              {categories.map((category) => (
                <div key={category.id} className="flex items-center flex-shrink-0">
                  <RadioGroupItem value={category.id} id={`cat-${category.id}`} className="sr-only" />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className={`px-3 py-2 rounded-md border cursor-pointer text-sm whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-accent'}`}
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Subcategories - Hide during mobile scroll but show when search focused */}
      {selectedCategory !== 'all' && subcategories.length > 1 && (
        <div className={`border-b bg-background/95 backdrop-blur-md sticky z-40 transition-all duration-300 ${
          isMobile && isScrolling && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
        } ${isMobile && headerCompressed ? 'top-[8.75rem]' : 'top-[9.75rem]'}`}>
          <div className="container mx-auto px-4 py-2">
            <RadioGroup
              value={selectedSpirit}
              onValueChange={setSelectedSpirit}
              className="flex flex-wrap gap-2"
            >
              {subcategories.map((subcat) => (
                <div key={subcat.id} className="flex items-center">
                  <RadioGroupItem value={subcat.id} id={`sub-${subcat.id}`} className="sr-only" />
                    <Label
                      htmlFor={`sub-${subcat.id}`}
                      className={`px-3 py-2 rounded-md border cursor-pointer text-sm ${selectedSpirit === subcat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-accent'}`}
                    >
                      {subcat.label} {subcat.count ? `(${subcat.count})` : ''}
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
            {debouncedQuery && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {displayProducts.length} results for "{debouncedQuery}"
                  {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
                </p>
              </div>
            )}

            {/* Products Grid */}
            {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-full">
              {displayProducts.map((product) => {
                const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in w-full">
                    <div className="aspect-square relative overflow-hidden">
                      <OptimizedImage
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover hover-scale"
                      />
                    </div>
                    
                    <CardContent className="p-3 space-y-3">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 break-words">
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
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <span className="font-medium px-2 text-center min-w-[2rem]">{quantity}</span>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in flex-shrink-0"
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

        {/* Mobile Bottom Cart - Show when items exist */}
        {getTotalItems() > 0 && (
          <MobileBottomCartBar
            cartItemCount={getTotalItems()}
            totalAmount={getTotalPrice()}
            onOpenCart={() => setIsCartOpen(true)}
            className="md:hidden"
          />
        )}
    </div>
  );
}