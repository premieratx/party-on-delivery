import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
import { 
  HierarchicalSearchOptimizer, 
  MAJOR_CATEGORIES, 
  SUBCATEGORIES 
} from '@/utils/hierarchicalSearchOptimizer';
import { supabase } from '@/integrations/supabase/client';
import { groupProductsByBaseName } from '@/utils/productGrouper';
import { GroupedProductCard } from '@/components/delivery/GroupedProductCard';
import { parseProductTitle } from '@/utils/productUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Product {
  id: string;
  title: string;
  price: number | string;
  image: string;
  product_type?: string;
  category?: string;
  collection_handles?: string[] | string;
  variants?: any[];
  [key: string]: any;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSpirit, setSelectedSpirit] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    cartItems, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useUnifiedCart();

  // Get cart item quantity
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variantId || 'default';
      return String(itemId) === String(productId) && String(itemVariant) === String(checkVariant);
    });
    return cartItem?.quantity || 0;
  };

  // Load all products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use instant-product-cache for fastest loading
      const { data: response, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { 
          collection_handle: 'all',
          force_refresh: false
        }
      });

      if (error) throw error;

      const products = response?.products || [];
      console.log(`⚡ Loaded ${products.length} products for search app`);
      
      setAllProducts(products);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Available categories for filtering
  const categories = useMemo(() => [
    { id: 'all', label: '🛒 All Products' },
    ...MAJOR_CATEGORIES
  ], []);

  // Available spirit types (subcategories)
  const spiritTypes = useMemo(() => [
    { id: 'all', label: 'All Spirits' },
    ...SUBCATEGORIES.filter(sub => sub.parentCategory === 'spirits')
  ], []);

  // Apply search and filtering
  const filteredProducts = useMemo(() => {
    let products = allProducts;

    // Apply search if query exists
    if (searchQuery.trim()) {
      products = HierarchicalSearchOptimizer.searchProducts(searchQuery, products, 100);
    } else {
      // Apply category filtering when no search query
      if (selectedCategory !== 'all') {
        products = HierarchicalSearchOptimizer.filterByCategory(products, selectedCategory);
        
        // Apply spirit subcategory filtering
        if (selectedCategory === 'spirits' && selectedSpirit !== 'all') {
          products = HierarchicalSearchOptimizer.filterSpiritsBySubcategory(products, selectedSpirit);
        }
      }
    }

    // Group identical products by base name (for variants)
    const groupedProducts = groupProductsByBaseName(products);
    
    console.log(`📊 Search Results: ${products.length} products → ${groupedProducts.length} grouped cards`);
    return groupedProducts;
  }, [allProducts, searchQuery, selectedCategory, selectedSpirit]);

  // Handle add to cart
  const handleAddToCart = (product: any) => {
    const actualProduct = product.originalProduct || product;
    const firstVariantId = actualProduct.variants?.[0]?.id;
    
    const cartItem = {
      id: String(actualProduct.id),
      title: actualProduct.title,
      name: actualProduct.title,
      price: typeof actualProduct.price === 'string' ? parseFloat(actualProduct.price) : actualProduct.price,
      image: actualProduct.image,
      variant: firstVariantId ? String(firstVariantId) : 'default',
    };
    
    console.log('🛒 SearchPage: Adding product to cart:', cartItem);
    const currentQty = getCartItemQuantity(cartItem.id, cartItem.variant);
    updateQuantity(cartItem.id, cartItem.variant, currentQty + 1, cartItem);
  };

  // Handle quantity change
  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    updateQuantity(productId, variantId, newQty);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      </div>
    );
  }

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
              {!isMobile && "Back"}
            </Button>
            
            <h1 className="text-lg sm:text-xl font-bold flex-1">Product Search</h1>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {!isMobile && "Cart"}
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
              placeholder="Search for spirits, beer, wine, cocktails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="border-b bg-background/95 backdrop-blur-md sticky top-28 z-40">
        <div className="container mx-auto px-4 py-3">
          <RadioGroup
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              setSelectedSpirit('all'); // Reset spirit filter when changing category
            }}
            className="flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <RadioGroupItem value={category.id} id={`cat-${category.id}`} className="sr-only" />
                <Label
                  htmlFor={`cat-${category.id}`}
                  className={`px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-foreground border-input hover:bg-accent'
                  }`}
                >
                  {category.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Spirit Subcategory Filters */}
      {selectedCategory === 'spirits' && (
        <div className="border-b bg-background/95 backdrop-blur-md sticky top-40 z-40">
          <div className="container mx-auto px-4 py-3">
            <RadioGroup
              value={selectedSpirit}
              onValueChange={setSelectedSpirit}
              className="flex flex-wrap gap-2"
            >
              {spiritTypes.map((spirit) => (
                <div key={spirit.id} className="flex items-center">
                  <RadioGroupItem value={spirit.id} id={`spirit-${spirit.id}`} className="sr-only" />
                  <Label
                    htmlFor={`spirit-${spirit.id}`}
                    className={`px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors ${
                      selectedSpirit === spirit.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-foreground border-input hover:bg-accent'
                    }`}
                  >
                    {spirit.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? `${filteredProducts.length} results for "${searchQuery}"`
                : `${filteredProducts.length} products${selectedCategory !== 'all' ? ` in ${categories.find(c => c.id === selectedCategory)?.label?.replace(/^[🍺🥃🍷🥤🍹🧊🎉🛒]\s*/, '')}` : ''}`
              }
              {selectedCategory === 'spirits' && selectedSpirit !== 'all' && 
                ` - ${spiritTypes.find(s => s.id === selectedSpirit)?.label}`
              }
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredProducts.map((groupedProduct) => (
              <GroupedProductCard
                key={groupedProduct.id}
                groupedProduct={groupedProduct}
                getCartItemQuantity={getCartItemQuantity}
                onAddToCart={handleAddToCart}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No products found' : 'No products in this category'}
              </h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search terms or browse by category'
                  : 'Try selecting a different category or search for specific products'
                }
              </p>
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Cart Bar */}
      {isMobile && getTotalItems() > 0 && (
        <MobileBottomCartBar
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Sidebar */}
      <UnifiedCart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </div>
  );
}