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
import { useSearchProducts } from "@/hooks/useSearchProducts";
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
  subcategory?: string;
  variants?: ProductVariant[];
  images?: string[];
}

export const ProductSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSpiritType, setSelectedSpiritType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: ProductVariant }>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cartHook = useUnifiedCart();
  const { cartItems, addToCart, updateQuantity, getCartItemQuantity, getTotalItems, getTotalPrice } = cartHook;
  const { toast } = useToast();

  // Load products instantly using cache
  useEffect(() => {
    loadInstantProducts();
  }, []);

  const loadInstantProducts = async () => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      
      // ULTRA FAST: Try instant cache first for immediate loading (<100ms)
      const { data: instantData } = await supabase.functions.invoke('instant-product-cache');
      
      if (instantData?.success && instantData?.data) {
        console.log('⚡ Ultra-fast search page load from instant cache');
        const products = instantData.data.products || [];
        const collections = instantData.data.collections || [];
        
        // Quick transform with category inference
        const enrichedProducts = products.map((product: any) => ({
          ...product,
          category: inferProductCategory(product.title, product.handle || ''),
          subcategory: inferSubcategory(product.title)
        }));
        
        setAllProducts(enrichedProducts);
        setCollections(collections);
        
        const loadTime = performance.now() - startTime;
        console.log(`⚡ SEARCH PAGE ULTRA-FAST LOAD: ${Math.round(loadTime)}ms - ${enrichedProducts.length} products`);
        
        setLoading(false);
        return;
      }

      // Fallback: Try collections API (slower but more complete)
      console.log('📦 Fallback: Loading from collections API');
      const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) throw error;
      
      if (collectionsData?.collections) {
        setCollections(collectionsData.collections);
        
        // Extract and enrich products
        const allProducts = collectionsData.collections.reduce((acc: any[], collection: any) => {
          if (collection.products) {
            acc.push(...collection.products.map((p: any) => ({
              ...p,
              category: inferProductCategory(p.title, collection.handle),
              subcategory: inferSubcategory(p.title)
            })));
          }
          return acc;
        }, []);
        
        setAllProducts(allProducts);
        
        const loadTime = performance.now() - startTime;
        console.log(`📦 Search page fallback load: ${Math.round(loadTime)}ms - ${allProducts.length} products`);
      }
      
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load products. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const inferProductCategory = (title: string, handle: string): string => {
    const titleLower = title.toLowerCase();
    const handleLower = handle.toLowerCase();
    
    if (handleLower.includes('beer') || handleLower.includes('tailgate') || titleLower.includes('beer')) return 'beer';
    if (handleLower.includes('wine') || handleLower.includes('champagne') || titleLower.includes('wine')) return 'wine';
    if (handleLower.includes('spirit') || handleLower.includes('whiskey') || handleLower.includes('vodka') || 
        handleLower.includes('gin') || handleLower.includes('rum') || handleLower.includes('tequila') ||
        titleLower.includes('whiskey') || titleLower.includes('vodka') || titleLower.includes('gin')) return 'spirits';
    if (handleLower.includes('cocktail') || handleLower.includes('ready-to-drink') || titleLower.includes('cocktail')) return 'cocktails';
    if (handleLower.includes('seltzer') || titleLower.includes('seltzer')) return 'seltzers';
    if (handleLower.includes('mixer') || handleLower.includes('non-alcoholic') || titleLower.includes('mixer')) return 'mixers';
    if (handleLower.includes('party') || handleLower.includes('supplies') || handleLower.includes('decoration')) return 'party-supplies';
    return 'other';
  };

  const inferSubcategory = (title: string): string => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('whiskey') || titleLower.includes('bourbon')) return 'whiskey';
    if (titleLower.includes('vodka')) return 'vodka';
    if (titleLower.includes('gin')) return 'gin';
    if (titleLower.includes('rum')) return 'rum';
    if (titleLower.includes('tequila')) return 'tequila';
    if (titleLower.includes('mezcal')) return 'mezcal';
    if (titleLower.includes('brandy') || titleLower.includes('cognac')) return 'brandy';
    return '';
  };
  const getProductsByCategory = (categoryId: string): Product[] => {
    if (categoryId === 'all') return allProducts;
    if (categoryId === 'favorites') return allProducts.slice(0, 20); // Show top 20 as favorites
    return allProducts.filter(product => product.category === categoryId);
  };
  
  // Load products for current category
  const products = useMemo(() => {
    let filtered = getProductsByCategory(selectedCategory);

    // If spirits category is selected and a specific spirit type is chosen, filter further
    if (selectedCategory === 'spirits' && selectedSpiritType !== 'all') {
      filtered = filtered.filter(product => 
        product.subcategory === selectedSpiritType ||
        product.title.toLowerCase().includes(selectedSpiritType.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, selectedSpiritType, getProductsByCategory]);

  // Get emoji for category
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

    // Fixed categories matching delivery app tabs - WITH PROPER COLLECTIONS
    const deliveryAppCategories = [
      { id: "spirits", label: "🥃 Spirits" }, // spirits, gin-rum, tequila-mezcal, whiskey collections
      { id: "beer", label: "🍺 Beer" }, // tailgate-beer, texas-beer-collection 
      { id: "seltzers", label: "🥤 Seltzers" }, // seltzer-collection
      { id: "cocktails", label: "🍹 Cocktails" }, // cocktail-kits, ready-to-drink-cocktails
      { id: "mixers", label: "🧊 Mixers & N/A" }, // mixers-non-alcoholic
      { id: "wine", label: "🍷 Wine" }, // champagne, wine collections
      { id: "party-supplies", label: "🎉 Party Supplies" }, // party-supplies, decorations, etc
      { id: "other", label: "📦 Other" } // newest-products, customizable-items, annie-s-store
    ];

    console.log('🏷️ Search categories rebuilt with proper collection mapping');
    
    return [...baseCategories, ...deliveryAppCategories];
  }, []);

  // Spirit types for filtering within spirits category
  const spiritTypes = [
    { id: 'all', label: 'All Spirits' },
    { id: 'vodka', label: 'Vodka' },
    { id: 'tequila', label: 'Tequila' },
    { id: 'whiskey', label: 'Whiskey' },
    { id: 'gin', label: 'Gin' },
    { id: 'rum', label: 'Rum' },
    { id: 'brandy', label: 'Brandy' }
  ];

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
              onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedSpiritType("all"); // Reset spirit filter when category changes
              }}
              className="flex flex-wrap gap-4"
            >
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={category.id} 
                    id={category.id} 
                    className="w-2 h-2 sm:w-4 sm:h-4 md:w-6 md:h-6 flex-shrink-0 border border-muted-foreground scale-75 sm:scale-100 [&>span]:w-1/2 [&>span]:h-1/2 [&>span]:bg-green-600 [&>span]:rounded-full [&>span]:mx-auto [&>span]:my-auto [&>span]:flex [&>span]:items-center [&>span]:justify-center" 
                  />
                  <Label htmlFor={category.id} className="text-sm cursor-pointer whitespace-nowrap">
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Spirit Type Filter - Desktop */}
          {selectedCategory === 'spirits' && (
            <div className="hidden md:flex items-start gap-4 mb-4 pl-4 border-l-2 border-muted">
              <span className="text-sm font-medium text-foreground mt-2">Spirit Types:</span>
              <RadioGroup 
                value={selectedSpiritType} 
                onValueChange={setSelectedSpiritType}
                className="flex flex-wrap gap-4"
              >
                {[
                  { id: 'all', label: 'All Spirits' },
                  { id: 'whiskey', label: 'Whiskey' },
                  { id: 'vodka', label: 'Vodka' },
                  { id: 'rum', label: 'Rum' },
                  { id: 'gin', label: 'Gin' },
                  { id: 'tequila', label: 'Tequila' },
                  { id: 'mezcal', label: 'Mezcal' },
                  { id: 'liqueurs', label: 'Liqueurs' },
                  { id: 'brandy', label: 'Brandy/Cognac' }
                ].map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={type.id} 
                      id={`spirit-${type.id}`} 
                      className="w-4 h-4 flex-shrink-0 border border-muted-foreground [&>span]:w-1/2 [&>span]:h-1/2 [&>span]:bg-amber-600 [&>span]:rounded-full [&>span]:mx-auto [&>span]:my-auto [&>span]:flex [&>span]:items-center [&>span]:justify-center" 
                    />
                    <Label htmlFor={`spirit-${type.id}`} className="text-sm cursor-pointer whitespace-nowrap">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Mobile Filter Panel */}
          {showFilters && (
            <Card className="mb-4 md:hidden">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Categories</h3>
                  <RadioGroup value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedSpiritType("all");
                  }}>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-1.5 overflow-hidden">
                          <RadioGroupItem 
                            value={category.id} 
                            id={category.id}
                            className="w-1 h-1 flex-shrink-0 border border-muted-foreground scale-50 [&>span]:w-2/3 [&>span]:h-2/3 [&>span]:bg-green-600 [&>span]:rounded-full [&>span]:mx-auto [&>span]:my-auto"
                          />
                          <Label htmlFor={category.id} className="text-xs cursor-pointer truncate">
                            {category.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  
                  {/* Spirit Type Filter - Mobile */}
                  {selectedCategory === 'spirits' && (
                    <div className="space-y-2 border-t pt-4">
                      <h4 className="font-medium text-sm">Spirit Types</h4>
                      <RadioGroup value={selectedSpiritType} onValueChange={setSelectedSpiritType}>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'all', label: 'All' },
                            { id: 'whiskey', label: 'Whiskey' },
                            { id: 'vodka', label: 'Vodka' },
                            { id: 'rum', label: 'Rum' },
                            { id: 'gin', label: 'Gin' },
                            { id: 'tequila', label: 'Tequila' },
                            { id: 'mezcal', label: 'Mezcal' },
                            { id: 'liqueurs', label: 'Liqueurs' },
                            { id: 'brandy', label: 'Brandy' }
                          ].map((type) => (
                            <div key={type.id} className="flex items-center space-x-1.5 overflow-hidden">
                              <RadioGroupItem 
                                value={type.id} 
                                id={`mobile-spirit-${type.id}`}
                                className="w-1 h-1 flex-shrink-0 border border-muted-foreground scale-50 [&>span]:w-2/3 [&>span]:h-2/3 [&>span]:bg-amber-600 [&>span]:rounded-full [&>span]:mx-auto [&>span]:my-auto"
                              />
                              <Label htmlFor={`mobile-spirit-${type.id}`} className="text-xs cursor-pointer truncate">
                                {type.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {loading ? "Loading..." : `${filteredProducts.length} products found`}
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
              {selectedCategory === "spirits" && selectedSpiritType !== "all" && ` - ${selectedSpiritType}`}
            </span>
            <div className="flex gap-2">
              {selectedCategory === "spirits" && selectedSpiritType !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSpiritType("all")}
                  className="text-xs"
                >
                  Clear spirit filter
                </Button>
              )}
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSpiritType("all");
                  }}
                  className="text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - Mobile Optimized */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {loading ? (
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
                        {/* Centered Product Title */}
                        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 text-center">
                          {cleanTitle}
                        </h3>
                        
                        {/* Left-aligned Size variants as radio buttons for multi-variant products */}
                        {product.variants && product.variants.length > 1 && (
                          <div className="mb-2 mt-4 sm:mt-6 space-y-0.5 text-left">
                            <RadioGroup 
                              value={currentVariant.id}
                              onValueChange={(value) => {
                                const variant = product.variants!.find(v => v.id === value);
                                if (variant) handleVariantChange(product, variant);
                              }}
                              className="space-y-0.5"
                            >
                              {product.variants.map(variant => (
                                <div key={variant.id} className="flex items-center justify-start md:justify-center space-x-1.5 overflow-hidden">
                                  <RadioGroupItem 
                                    value={variant.id} 
                                    id={`${product.id}-${variant.id}`}
                                    className="w-2 h-2 sm:w-4 sm:h-4 md:w-6 md:h-6 flex-shrink-0 border border-muted-foreground scale-75 sm:scale-100 mr-0.5 [&>span]:w-1/2 [&>span]:h-1/2 [&>span]:bg-green-600 [&>span]:rounded-full [&>span]:mx-auto [&>span]:my-auto [&>span]:flex [&>span]:items-center [&>span]:justify-center"
                                  />
                                  <Label 
                                    htmlFor={`${product.id}-${variant.id}`}
                                    className="text-[13px] sm:text-[15px] cursor-pointer flex-1 leading-tight text-left md:text-center"
                                  >
                                    <span className="block truncate text-foreground">{variant.size}</span>
                                    <span className="block text-green-600 font-medium">${variant.price.toFixed(2)}</span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                        
                        {/* Centered Price and Size Info for single variants */}
                        <div className="text-center mt-6 sm:mt-8">
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
                      <div className="mt-2 sm:mt-3 flex justify-center">
                        {quantity > 0 ? (
                           <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-lg p-0.5 min-w-[55px] sm:min-w-[70px] md:min-w-[90px]">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleQuantityChange(product, -1)}
                               className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 hover:bg-primary-foreground/20 rounded-full"
                             >
                               <Minus className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                             </Button>
                             <span className="text-sm sm:text-xs md:text-sm font-medium mx-0.5">{quantity}</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleQuantityChange(product, 1)}
                               className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 hover:bg-primary-foreground/20 rounded-full"
                             >
                               <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                             </Button>
                           </div>
                        ) : (
                           <Button
                             onClick={() => handleAddToCart(product)}
                             className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center p-0"
                             size="sm"
                           >
                             <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
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
        onCheckout={() => navigate('/?step=checkout')}
      />
    </div>
  );
};

