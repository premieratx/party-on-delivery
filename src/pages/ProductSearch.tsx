import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
}

const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "beer", label: "Beer" },
    { id: "seltzers", label: "Seltzers" },
    { id: "cocktails", label: "Cocktails" },
    { id: "mixers", label: "Mixers & N/A" },
    { id: "spirits", label: "Spirits" },
    { id: "wine", label: "Wine" }
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

  // Map collection handles to our category system
  const mapCollectionToCategory = (handle: string): string => {
    if (handle.includes('beer') || handle.includes('texas-beer') || handle.includes('tailgate-beer')) return 'beer';
    if (handle.includes('seltzer')) return 'seltzers';
    if (handle.includes('cocktail') || handle.includes('ready-to-drink')) return 'cocktails';
    if (handle.includes('mixer') || handle.includes('non-alcoholic')) return 'mixers';
    if (handle.includes('spirits') || handle.includes('gin-rum') || handle.includes('tequila') || handle.includes('liqueur')) return 'spirits';
    if (handle.includes('champagne') || handle.includes('wine')) return 'wine';
    return 'other';
  };

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
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

  const getQuantityInCart = (productId: string) => {
    const item = cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const updateCartQuantity = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.productId === product.id);
      
      if (quantity === 0) {
        // Remove item if quantity is 0
        return prevCart.filter(item => item.productId !== product.id);
      }
      
      const cartItem: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        image: product.image,
        category: product.category
      };

      if (existingItemIndex >= 0) {
        // Update existing item
        const newCart = [...prevCart];
        newCart[existingItemIndex] = cartItem;
        return newCart;
      } else {
        // Add new item
        return [...prevCart, cartItem];
      }
    });

    toast({
      title: quantity === 0 ? "Removed from cart" : "Added to cart",
      description: `${product.title} ${quantity === 0 ? 'removed' : 'updated'}`,
      duration: 2000,
    });
  };

  const addToCart = (product: Product) => {
    const currentQuantity = getQuantityInCart(product.id);
    updateCartQuantity(product, currentQuantity + 1);
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalCartValue = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back
            </Button>
            
            {cart.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {getTotalCartItems()} items • ${getTotalCartValue().toFixed(2)}
                </div>
                <Button size="sm">
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
              className="shrink-0"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Categories</h3>
                  <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
              const quantity = getQuantityInCart(product.id);
              
              return (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                              onClick={() => addToCart(product)}
                              size="sm"
                              className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                            >
                              +
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between gap-1">
                              <Button
                                onClick={() => updateCartQuantity(product, quantity - 1)}
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0 rounded-full"
                              >
                                -
                              </Button>
                              <span className="text-sm font-medium px-2">
                                {quantity}
                              </span>
                              <Button
                                onClick={() => updateCartQuantity(product, quantity + 1)}
                                size="sm"
                                className="w-8 h-8 p-0 rounded-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                +
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
    </div>
  );
};

export default ProductSearch;