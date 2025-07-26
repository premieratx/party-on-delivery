import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, ArrowLeft, Plus, Minus, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useNavigate } from "react-router-dom";
import { UnifiedCart } from "@/components/common/UnifiedCart";

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  variants?: any[];
  images?: string[];
}

export const ProductSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("favorites");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { cartItems, addToCart, updateQuantity, getCartItemQuantity, getTotalItems, getTotalPrice } = useUnifiedCart();
  const { toast } = useToast();

  const categories = [
    { id: "favorites", label: "⭐ Favorites" },
    { id: "all", label: "All Categories" },
    { id: "spirits", label: "Spirits" },
    { id: "beer", label: "Beer" },
    { id: "seltzers", label: "Seltzers" },
    { id: "cocktails", label: "Cocktails" },
    { id: "mixers", label: "Mixers & N/A" },
    { id: "wine", label: "Wine" },
    { id: "party-supplies", label: "Party Supplies" },
    { id: "other", label: "Other" }
  ];

  // Load products from Shopify
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Use the existing get-all-collections function to fetch products
        const { data, error } = await supabase.functions.invoke('get-all-collections');
        
        if (error) {
          console.error('Error fetching collections:', error);
          toast({
            title: "Error loading products",
            description: "Failed to load product catalog",
            variant: "destructive",
          });
          return;
        }

        // Transform collections data into a flat products array
        const allProducts: Product[] = [];
        
        if (data?.collections) {
          data.collections.forEach((collection: any) => {
            if (collection.products) {
              collection.products.forEach((product: any) => {
                allProducts.push({
                  id: product.id,
                  title: product.title,
                  price: product.price || 0,
                  image: product.image || '/placeholder.svg',
                  description: product.description || '',
                  handle: product.handle || '',
                  category: mapCollectionToCategory(collection.handle),
                  variants: product.variants || [],
                  images: product.images || []
                });
              });
            }
          });
        }

        // Sort alphabetically by title
        allProducts.sort((a, b) => a.title.localeCompare(b.title));
        setProducts(allProducts);
        
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Error loading products",
          description: "Failed to load product catalog",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [toast]);

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

    // Handle favorites category specially
    if (selectedCategory === "favorites") {
      filtered = getFavoritesProducts(products);
    } else if (selectedCategory !== "all") {
      // Filter by category
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchTerm]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.id,
      category: product.category
    });
  };

  const handleQuantityChange = (product: Product, change: number) => {
    const currentQty = getCartItemQuantity(product.id, product.variants?.[0]?.id);
    const newQty = Math.max(0, currentQty + change);
    updateQuantity(product.id, product.variants?.[0]?.id, newQty);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {getTotalItems() > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
                </div>
                <Button 
                  size="sm"
                  onClick={() => setShowCart(true)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View Cart
                </Button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0 md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
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
              {loading ? "Loading..." : `${filteredProducts.length} products found`}
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

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/2] bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
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
          <div className="grid grid-cols-3 md:grid-cols-8 gap-4">
            {filteredProducts.map((product, index) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
              
              return (
                <Card 
                  key={`${product.id}-${index}`} 
                  className={`group transition-all duration-200 ${quantity > 0 ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg'}`}
                >
                  <CardContent className="p-2">
                    <div className="flex flex-col items-center text-center h-full gap-1">
                      {/* Product Image with priority for first few products */}
                      <div className="w-full aspect-[3/2] rounded overflow-hidden flex-shrink-0">
                        <OptimizedImage 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full"
                          priority={index < 24}
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between min-h-0 w-full">
                        <div>
                          <h4 className="font-medium text-xs leading-tight line-clamp-2 mb-1">
                            {product.title}
                          </h4>
                          <p className="text-lg font-bold text-primary mb-2">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Category Badge */}
                        <Badge variant="secondary" className="text-xs mb-2 capitalize">
                          {product.category}
                        </Badge>
                        
                        {/* Add to Cart Controls */}
                        <div className="w-full">
                          {quantity === 0 ? (
                            <Button
                              onClick={() => handleAddToCart(product)}
                              size="sm"
                              className="w-8 h-8 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 justify-center">
                              <Button
                                onClick={() => handleQuantityChange(product, -1)}
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 rounded-full"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">
                                {quantity}
                              </span>
                              <Button
                                onClick={() => handleQuantityChange(product, 1)}
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 rounded-full"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
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
    </div>
  );
};

