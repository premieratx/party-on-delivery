import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, ArrowLeft, Plus, Minus, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useCustomSiteProducts } from "@/hooks/useCustomSiteProducts";
import { useNavigate } from "react-router-dom";
import { UnifiedCart } from "@/components/common/UnifiedCart";
import { parseProductTitle } from '@/utils/productUtils';

interface ProductVariant {
  id: string;
  title: string;
  price: number;
  size: string;
  sizeValue: number;
  image: string;
  handle: string;
  variants?: any[];
  images?: string[];
}

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  variants?: ProductVariant[];
  images?: string[];
}

export const ProductSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: ProductVariant }>({});
  const cartHook = useUnifiedCart();
  const { cartItems, addToCart, updateQuantity, getCartItemQuantity, getTotalItems, getTotalPrice } = cartHook;
  const { toast } = useToast();
  
  // Load favorites first, then other tabs progressively
  const [productsLoaded, setProductsLoaded] = useState<{ [key: string]: Product[] }>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set(['favorites']));
  
  const { 
    products: allProducts, 
    isLoading: loading, 
    isCustomSite, 
    customSiteData, 
    availableCategories,
    reload: reloadProducts
  } = useCustomSiteProducts();
  
  // Progressive loading: load favorites first, then other categories
  useEffect(() => {
    // Force reload of products to ensure we have latest from Shopify
    console.log('🔄 Reloading products to sync with Shopify...');
    reloadProducts();
  }, []);

  useEffect(() => {
    if (!loading && allProducts.length > 0) {
      console.log(`✅ Loaded ${allProducts.length} deduplicated products from Shopify`);
      
      // Load favorites immediately
      const favs = getFavoritesProducts(allProducts);
      setProductsLoaded(prev => ({ ...prev, favorites: favs }));
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete('favorites');
        return newSet;
      });
      
      // Load other categories progressively with delay
      const otherCategories = availableCategories.filter(cat => cat !== 'favorites');
      otherCategories.forEach((category, index) => {
        setTimeout(() => {
          const categoryProducts = allProducts.filter(product => 
            product.category && product.category.toLowerCase() === category.toLowerCase()
          );
          console.log(`📦 Loaded ${categoryProducts.length} products for category: ${category}`);
          setProductsLoaded(prev => ({ ...prev, [category]: categoryProducts }));
          setLoadingCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(category);
            return newSet;
          });
        }, (index + 1) * 100); // Faster loading
      });
    } else if (!loading && allProducts.length === 0) {
      console.warn('⚠️ No products loaded - attempting reload...');
      reloadProducts();
    }
  }, [loading, allProducts, availableCategories, reloadProducts]);
  
  // Get products for current category
  const products = useMemo(() => {
    if (selectedCategory === 'favorites') {
      return productsLoaded[selectedCategory] || [];
    } else if (selectedCategory === 'all') {
      return allProducts;
    } else {
      // Filter products by the selected category
      return allProducts.filter(product => product.category === selectedCategory);
    }
  }, [selectedCategory, allProducts, productsLoaded]);

  // Helper function to get emoji for category
  const getEmojiForCategory = (categoryId: string): string => {
    switch (categoryId) {
      case 'spirits': return '🥃';
      case 'beer': return '🍺';
      case 'seltzers': return '🥤';
      case 'cocktails': return '🍹';
      case 'wine': return '🍷';
      case 'mixers': return '🧊';
      case 'party-supplies': return '🎉';
      default: return '📦';
    }
  };

  // Generate categories matching main delivery app
  const categories = useMemo(() => {
    const baseCategories = [
      { id: "all", label: "🛒 All" },
      { id: "favorites", label: "⭐ Favorites" }
    ];

    // Fixed categories matching delivery app tabs
    const deliveryAppCategories = [
      { id: "spirits", label: "🥃 Spirits" },
      { id: "beer", label: "🍺 Beer" }, 
      { id: "seltzers", label: "🥤 Seltzers" },
      { id: "cocktails", label: "🍹 Cocktails" },
      { id: "mixers", label: "🧊 Mixers & N/A" },
      { id: "party-supplies", label: "🎉 Party Supplies" },
      { id: "other", label: "📦 Other" }
    ];

    console.log('🏷️ Search categories matching delivery app tabs');
    
    return [...baseCategories, ...deliveryAppCategories];
  }, []);

  // Products are now loaded via useCustomSiteProducts hook

  // Map collection handles to our category system - match delivery widget mapping
  const mapCollectionToCategory = (handle: string): string => {
    // Spirits (first in delivery widget)
    if (handle === 'spirits' || handle === 'gin-rum' || handle === 'tequila-mezcal' || handle === 'liqueurs-cordials-cocktail-ingredients') return 'spirits';
    // Beer (second in delivery widget)
    if (handle === 'tailgate-beer' || handle === 'texas-beer-collection' || handle.includes('beer')) return 'beer';
    // Seltzers (third in delivery widget)  
    if (handle === 'seltzer-collection' || handle.includes('seltzer')) return 'seltzers';
    // Cocktails (fourth in delivery widget)
    if (handle === 'cocktail-kits' || handle === 'ready-to-drink-cocktails' || handle.includes('cocktail')) return 'cocktails';
    // Mixers & N/A (fifth in delivery widget)
    if (handle === 'mixers-non-alcoholic' || handle.includes('mixer') || handle.includes('non-alcoholic')) return 'mixers';
    // Wine
    if (handle === 'champagne' || handle.includes('wine')) return 'wine';
    // Party Supplies
    if (handle === 'party-supplies' || handle === 'decorations' || handle === 'hats-sunglasses' || handle === 'costumes') return 'party-supplies';
    // Other category - includes newest-products and customizable-items collections
    if (handle === 'newest-products' || handle === 'customizable-items' || handle === 'annie-s-store') return 'other';
    // Everything else
    return 'other';
  };

  // Get favorites/best selling products
  const getFavoritesProducts = (allProducts: Product[]) => {
    // Create a Map to track unique products by ID to avoid duplicates
    const uniqueProducts = new Map<string, Product>();
    
    // Filter for popular products
    allProducts.forEach(product => {
      const title = product.title.toLowerCase();
      const isPopularItem = title.includes('deep eddy') || 
                           title.includes('tito') || 
                           title.includes('casamigos') || 
                           title.includes('bulleit') ||
                           title.includes('teremana') ||
                           title.includes('high noon') ||
                           title.includes('modelo') ||
                           title.includes('miller lite') ||
                           title.includes('coors light') ||
                           title.includes('coors original') ||
                           title.includes('lone star') ||
                           title.includes('cocktail kit') ||
                           product.category === 'spirits' ||
                           product.category === 'cocktail-kits' ||
                           product.category === 'tailgate-beer' ||
                           product.category === 'texas-beer-collection' ||
                           product.category === 'seltzer-collection';
      
      // Only add if it's a popular item and not already in the map
      if (isPopularItem && !uniqueProducts.has(product.id)) {
        uniqueProducts.set(product.id, product);
      }
    });

    // Convert back to array and sort by popularity score
    const favoritesProducts = Array.from(uniqueProducts.values())
      .sort((a, b) => {
        const aScore = getPopularityScore(a);
        const bScore = getPopularityScore(b);
        return bScore - aScore;
      })
      .slice(0, 50); // Limit to 50 favorite items

    return favoritesProducts;
  };

  // Helper function to calculate popularity score
  const getPopularityScore = (product: Product) => {
    const title = product.title.toLowerCase();
    let score = 0;
    
    // Premium spirit brands
    if (title.includes('tito')) score += 10;
    if (title.includes('deep eddy')) score += 9;
    if (title.includes('casamigos')) score += 8;
    if (title.includes('bulleit')) score += 7;
    if (title.includes('teremana')) score += 6;
    
    // Popular beer brands
    if (title.includes('modelo')) score += 8;
    if (title.includes('miller lite')) score += 7;
    if (title.includes('coors light')) score += 7;
    if (title.includes('coors original')) score += 6;
    if (title.includes('lone star')) score += 6;
    
    // Seltzer brands
    if (title.includes('high noon')) score += 8;
    
    // Product type popularity
    if (title.includes('vodka')) score += 5;
    if (title.includes('tequila')) score += 5;
    if (title.includes('bourbon')) score += 4;
    if (title.includes('cocktail')) score += 4;
    if (title.includes('beer')) score += 4;
    if (title.includes('seltzer')) score += 4;
    
    // Size preference (750ml is standard, 1.75L is value, beer cases/packs)
    if (title.includes('750ml')) score += 2;
    if (title.includes('1.75l')) score += 3;
    if (title.includes('12 pack') || title.includes('12-pack')) score += 3;
    if (title.includes('24 pack') || title.includes('24-pack')) score += 4;
    if (title.includes('case')) score += 3;
    
    return score;
  };

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort alphabetically by product title for better organization
    filtered = filtered.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      return titleA.localeCompare(titleB);
    });

    return filtered;
  }, [products, selectedCategory, searchTerm]);

  // Get the current selected variant for a product, or default to first/only variant
  const getCurrentVariant = (product: Product): ProductVariant => {
    if (!product.variants || product.variants.length === 0) {
      // Fallback for products without proper variant structure
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        size: 'Standard',
        sizeValue: 750,
        image: product.image,
        handle: product.handle,
        variants: [],
        images: product.images
      };
    }
    
    return selectedVariants[product.id] || product.variants[0];
  };

  const handleVariantChange = (product: Product, variant: ProductVariant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [product.id]: variant
    }));
  };

  const handleAddToCart = (product: Product) => {
    const currentVariant = getCurrentVariant(product);
    console.log('Adding product variant to cart:', currentVariant);
    try {
      addToCart({
        id: currentVariant.id,
        title: currentVariant.title,
        name: currentVariant.title,
        price: currentVariant.price,
        image: currentVariant.image,
        variant: currentVariant.variants?.[0]?.id || currentVariant.id,
        category: product.category
      });
      console.log('Product variant added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleQuantityChange = (product: Product, change: number) => {
    const currentVariant = getCurrentVariant(product);
    console.log('Changing quantity for product variant:', currentVariant.id, 'change:', change);
    try {
      const currentQty = getCartItemQuantity(currentVariant.id, currentVariant.variants?.[0]?.id || currentVariant.id);
      const newQty = Math.max(0, currentQty + change);
      updateQuantity(currentVariant.id, currentVariant.variants?.[0]?.id || currentVariant.id, newQty);
      console.log('Quantity updated:', newQty);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Mobile Header Layout */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 sm:gap-2 p-1 sm:p-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            {getTotalItems() > 0 && (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <span className="hidden sm:inline">{getTotalItems()} items • </span>
                  ${getTotalPrice().toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar - Mobile Optimized */}
          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-9 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 sm:h-auto sm:w-auto"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0 md:hidden h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Filters</span>
              {showFilters ? (
                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Desktop Categories Row */}
          <div className="hidden md:flex items-start gap-4 mb-4">
            <span className="text-sm font-medium text-foreground mt-2">Categories:</span>
            <RadioGroup 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              className="flex flex-wrap gap-4"
            >
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.id} id={category.id} className="w-4 h-4" />
                  <Label htmlFor={category.id} className="text-sm cursor-pointer whitespace-nowrap">
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Mobile Filter Panel */}
          {showFilters && (
            <Card className="mb-4 md:hidden">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Categories</h3>
                  <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={category.id} id={category.id} />
                          <Label htmlFor={category.id} className="text-sm">
                            {category.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {loadingCategories.has(selectedCategory) ? "Loading..." : `${filteredProducts.length} products found`}
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
            </span>
            {selectedCategory !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="text-xs"
              >
                Clear filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid - Mobile Optimized */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {loadingCategories.has(selectedCategory) ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/2] bg-muted rounded-lg mb-2" />
                <div className="h-3 sm:h-4 bg-muted rounded mb-1" />
                <div className="h-2 sm:h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {filteredProducts.map((product, index) => {
              const currentVariant = getCurrentVariant(product);
              const quantity = getCartItemQuantity(currentVariant.id, currentVariant.variants?.[0]?.id || currentVariant.id);
              const { cleanTitle } = parseProductTitle(currentVariant.title);
              
              return (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-shadow duration-200"
                >
                  <CardContent className="p-2 sm:p-4 h-full flex flex-col">
                    {/* Backend Only: Category Badge */}
                    {window.location.hostname === 'localhost' && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {product.category}
                      </Badge>
                    )}
                    
                    {/* Product Image */}
                    <div className="relative mb-2 sm:mb-3 flex-shrink-0">
                      <OptimizedImage
                        src={currentVariant.image}
                        alt={currentVariant.title}
                        className="w-full h-32 sm:h-40 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="mb-2">
                        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
                          {cleanTitle}
                        </h3>
                        
                        {/* Size variants as radio buttons for multi-variant products - Mobile Optimized */}
                        {product.variants && product.variants.length > 1 && (
                          <div className="mb-1 space-y-0.5">
                            <RadioGroup 
                              value={currentVariant.id}
                              onValueChange={(value) => {
                                const variant = product.variants!.find(v => v.id === value);
                                if (variant) handleVariantChange(product, variant);
                              }}
                              className="space-y-0.5"
                            >
                              {product.variants.map(variant => (
                                <div key={variant.id} className="flex items-center space-x-1 overflow-hidden">
                                  <RadioGroupItem 
                                    value={variant.id} 
                                    id={`${product.id}-${variant.id}`}
                                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 flex-shrink-0 border border-muted-foreground scale-50 sm:scale-75 mr-0.5"
                                  />
                                  <Label 
                                    htmlFor={`${product.id}-${variant.id}`}
                                    className="text-[9px] sm:text-[10px] cursor-pointer flex-1 leading-tight truncate max-w-full text-left"
                                  >
                                    <span className="block truncate">{variant.size}</span>
                                    <span className="text-green-600 font-medium">${variant.price.toFixed(2)}</span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                        
                        {/* Centered Price and Size Info */}
                        <div className="text-center">
                          <p className="text-lg sm:text-xl font-bold text-green-600">
                            ${currentVariant.price.toFixed(2)}
                          </p>
                          
                          {/* Show size for single variant products */}
                          {product.variants && product.variants.length === 1 && currentVariant.size !== 'Standard' && (
                            <p className="text-xs text-muted-foreground">
                              {currentVariant.size}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Add to Cart Button - Centered */}
                      <div className="mt-auto flex justify-center">
                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-lg p-1 sm:p-2 min-w-[80px] sm:min-w-[100px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(product, -1)}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-primary-foreground/20 rounded-full"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </Button>
                            <span className="text-xs sm:text-sm font-medium mx-2">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(product, 1)}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-primary-foreground/20 rounded-full"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center p-0"
                            size="sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Unified Cart */}
      <UnifiedCart isOpen={showCart} onClose={() => setShowCart(false)} />
      
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={cartItems.length > 0}
        onOpenCart={() => setShowCart(true)}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
};

