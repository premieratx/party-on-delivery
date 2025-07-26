import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, Check, Loader2, X, ArrowRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
}

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName: string;
  category: string;
}

interface ProductSelectionProps {
  category: string;
  subcategories: string[];
  recommendedQuantity: number;
  unitType: string; // 'beers', 'bottles', 'kits'
  budget: number;
  totalPartyBudget: number;
  runningTotal: number;
  currentSelections?: CartItem[];
  onAddToCart: (items: CartItem[]) => void;
  onComplete: () => void;
  onPrevious?: () => void;
}

// Category to Shopify collection mapping - Fixed beer collection
const categoryCollectionMap: Record<string, string> = {
  'beer': 'all-beer',
  'wine': 'spirits', // Using spirits collection for wine since wine collection doesn't exist
  'liquor': 'spirits',
  'cocktails': 'cocktail-kits'
};

export const ProductSelection = ({ 
  category, 
  subcategories, 
  recommendedQuantity, 
  unitType, 
  budget, 
  totalPartyBudget,
  runningTotal,
  currentSelections = [],
  onAddToCart,
  onComplete,
  onPrevious 
}: ProductSelectionProps) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [addedToCartItems, setAddedToCartItems] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Reset state when category changes, but restore if we have current selections
  useEffect(() => {
    console.log('ProductSelection: category changed to', category, 'with current selections:', currentSelections);
    setIsCompleted(false);
    setIsAddedToCart(currentSelections && currentSelections.length > 0);
    fetchProducts();
    
    // Restore current selections if available
    if (currentSelections && currentSelections.length > 0) {
      const restoredSelections: Record<string, number> = {};
      const addedItems: Record<string, number> = {};
      currentSelections.forEach(item => {
        restoredSelections[item.productId] = item.quantity;
        addedItems[item.productId] = item.quantity;
        console.log('Restoring selection:', item.title, 'quantity:', item.quantity);
      });
      setSelections(restoredSelections);
      setAddedToCartItems(addedItems);
      console.log('Restored selections:', restoredSelections);
      console.log('Restored cart items:', addedItems);
    } else {
      setSelections({});
      setAddedToCartItems({});
      console.log('No previous selections to restore');
    }
  }, [category, subcategories, currentSelections]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get collection handle from category
      const collectionHandle = categoryCollectionMap[category];
      if (!collectionHandle) {
        console.error('No collection mapping found for category:', category);
        setProducts([]);
        setLoading(false);
        return;
      }

      // Try to get cached data first for faster loading
      const cachedCollections = cacheManager.getShopifyCollections();
      let collections: ShopifyCollection[] = [];

      if (cachedCollections && cachedCollections.length > 0) {
        console.log('Using cached collections');
        collections = cachedCollections;
      } else {
        console.log('Fetching fresh collections from Supabase function');
        // Fetch fresh data with better error handling
        try {
          const { data, error } = await supabase.functions.invoke('get-all-collections');
          
          if (error) {
            console.error('Supabase function error:', error);
            throw new Error(`Supabase function error: ${error.message}`);
          }
          
          if (data?.error) {
            console.error('Function response error:', data.error);
            throw new Error(`Function response error: ${data.error}`);
          }
          
          collections = data?.collections || [];
          
          if (collections.length === 0) {
            console.warn('No collections returned from function');
          } else {
            console.log(`Fetched ${collections.length} collections`);
            cacheManager.setShopifyCollections(collections);
          }
        } catch (functionError) {
          console.error('Failed to fetch from Supabase function:', functionError);
          // Fallback to cached data if available
          if (cachedCollections && cachedCollections.length > 0) {
            console.log('Falling back to cached data');
            collections = cachedCollections;
          } else {
            throw functionError;
          }
        }
      }

      // Find the collection for this category
      const targetCollection = collections.find(c => c.handle === collectionHandle);
      
      if (targetCollection && targetCollection.products && targetCollection.products.length > 0) {
        console.log(`Found ${targetCollection.products.length} products for ${collectionHandle}`);
        setProducts(targetCollection.products);
      } else {
        console.warn(`No products found for collection: ${collectionHandle}`);
        console.log('Available collections:', collections.map(c => c.handle));
        setProducts([]);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      ErrorHandler.logError(error, 'fetchProducts');
      setProducts([]);
      toast({
        title: "Error Loading Products",
        description: "Using cached data. Some products may not be available.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, change: number) => {
    setSelections(prev => {
      const newQuantity = Math.max(0, (prev[productId] || 0) + change);
      return {
        ...prev,
        [productId]: newQuantity
      };
    });
  };

  // Parse product title to extract name and pack info
  const parseProductTitle = (title: string) => {
    // Look for patterns like "12pk", "24 pack", "6-pack", etc.
    const packPattern = /(\d+)\s*(-|pk|pack)\s*(x\s*\d+\s*(oz|ml|cl)?)?/gi;
    const match = title.match(packPattern);
    
    if (match) {
      const packInfo = match[0];
      const cleanTitle = title.replace(packPattern, '').trim();
      return {
        name: cleanTitle,
        packInfo: packInfo
      };
    }
    
    return {
      name: title,
      packInfo: ''
    };
  };

  const getSelectionTotal = () => {
    return Object.entries(selections).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getTotalServings = () => {
    return Object.entries(selections).reduce((total, [productId, quantity]) => {
      const containerSize = category === 'beer' ? 12 : 
                           category === 'wine' ? 1 : // 1 bottle = 1 bottle
                           category === 'liquor' ? 1 : // 1 bottle = 1 bottle
                           category === 'cocktails' ? 1 : 1; // 1 kit = 1 kit
      return total + (quantity * containerSize);
    }, 0);
  };

  const handleSaveAndContinue = () => {
    const selectedItems: CartItem[] = Object.entries(selections)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          title: product?.title || '',
          price: product?.price || 0,
          quantity,
          image: product?.image,
          eventName: '',
          category
        };
      });

    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to continue.",
        variant: "destructive",
      });
      return;
    }

    onComplete();
  };

  const handleAddToCart = () => {
    const selectedItems: CartItem[] = Object.entries(selections)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          title: product?.title || '',
          price: product?.price || 0,
          quantity,
          image: product?.image,
          eventName: '',
          category
        };
      });

    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to add to cart.",
        variant: "destructive",
      });
      return;
    }

    console.log('ProductSelection: Adding items to cart:', selectedItems);
    onAddToCart(selectedItems);
    setIsAddedToCart(true);
    setAddedToCartItems({...selections});
    
    // Don't show success toast - cart will show bubble flash
  };

  const handleProductClick = (product: ShopifyProduct) => {
    if (category === 'cocktails') {
      setSelectedProduct(product);
      setIsDialogOpen(true);
    }
  };

  const handleDialogAddToCart = (product: ShopifyProduct, quantity: number) => {
    if (quantity > 0) {
      const cartItem: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        image: product.image,
        eventName: '',
        category
      };
      
      onAddToCart([cartItem]);
      setIsAddedToCart(true);
      setAddedToCartItems(prev => ({
        ...prev,
        [product.id]: quantity
      }));
      
      // Don't show toast - cart will show bubble flash
    }
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {category} products...</p>
        </div>
      </div>
    );
  }

  const selectionTotal = getSelectionTotal();
  const totalServings = getTotalServings();
  const remainingBudget = budget - selectionTotal;
  
  // Get appropriate unit names
  const getUnitName = (isPlural = true) => {
    if (category === 'beer') return isPlural ? 'cases' : 'case';
    if (category === 'wine') return isPlural ? 'bottles' : 'bottle';
    if (category === 'liquor') return isPlural ? 'bottles' : 'bottle';
    if (category === 'cocktails') return isPlural ? 'cocktails' : 'cocktail';
    return isPlural ? 'items' : 'item';
  };

  const getServingName = () => {
    if (category === 'wine') return 'bottles';
    if (category === 'liquor') return 'bottles';
    if (category === 'cocktails') return 'cocktails';
    if (category === 'beer') return 'cases';
    return 'items';
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-base font-bold mb-1 capitalize">
          Choose Your {category === 'cocktails' ? 'Cocktail Kits' : category}
        </h3>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span>Recommended: {recommendedQuantity} {unitType}</span>
          <span>Budget: ${budget.toFixed(2)}</span>
          <span>Selected: {totalServings} {getServingName()}</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products available for {category}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {products.map((product) => {
            const quantity = selections[product.id] || 0;
            const isSelected = quantity > 0;
            const wasAddedToCart = addedToCartItems[product.id] > 0;
            const { name, packInfo } = parseProductTitle(product.title);

            console.log('Rendering product:', product.title, 'quantity:', quantity, 'wasAddedToCart:', wasAddedToCart);

            return (
              <Card 
                key={product.id} 
                className={`transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                } ${wasAddedToCart ? 'bg-green-50 border-green-200' : ''}`}
              >
                <CardContent className="p-2">
                  <div className="flex flex-col items-center text-center h-full gap-1">
                    {/* Optimized Image */}
                    <div className="w-full aspect-[3/2] rounded overflow-hidden flex-shrink-0">
                      <OptimizedImage 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-full"
                        onClick={category === 'cocktails' ? () => handleProductClick(product) : undefined}
                      />
                    </div>
                    
                    {/* Product Name */}
                    <h4 className="font-medium text-xs leading-tight text-center" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{name}</h4>
                    
                    {/* Pack Info */}
                    {packInfo && (
                      <div className="text-xs text-muted-foreground">
                        {packInfo}
                      </div>
                    )}
                    
                    {/* Price */}
                    <div className="text-sm font-bold">
                      ${product.price}
                    </div>
                    
                    {/* Cart indicator */}
                    {wasAddedToCart && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    
                    {/* Quantity Controls or Add to Cart - Like Liquor Tab */}
                    {quantity > 0 ? (
                      // Show +/- controls when item has quantity
                      <div className="flex items-center gap-1 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Decreasing quantity for:', product.title);
                            handleQuantityChange(product.id, -1);
                            // Update cart with new quantity
                            const newQuantity = (selections[product.id] || 0) - 1;
                            if (newQuantity > 0) {
                              const cartItem: CartItem = {
                                productId: product.id,
                                title: product.title,
                                price: product.price,
                                quantity: newQuantity,
                                image: product.image,
                                eventName: '',
                                category
                              };
                              onAddToCart([cartItem]);
                            } else {
                              // Remove from cart if quantity becomes 0
                              onAddToCart([]);
                            }
                          }}
                          className="h-5 w-5 md:h-6 md:w-6 p-0 rounded-full"
                          type="button"
                        >
                          <Minus className="w-2 h-2 md:w-3 md:h-3" />
                        </Button>
                        <span className="w-4 md:w-6 text-center font-medium text-xs">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Increasing quantity for:', product.title);
                            handleQuantityChange(product.id, 1);
                            // Update cart with new quantity
                            const newQuantity = (selections[product.id] || 0) + 1;
                            const cartItem: CartItem = {
                              productId: product.id,
                              title: product.title,
                              price: product.price,
                              quantity: newQuantity,
                              image: product.image,
                              eventName: '',
                              category
                            };
                            onAddToCart([cartItem]);
                          }}
                          className="h-5 w-5 md:h-6 md:w-6 p-0 rounded-full"
                          type="button"
                        >
                          <Plus className="w-2 h-2 md:w-3 md:h-3" />
                        </Button>
                      </div>
                    ) : (
                      // Show smaller green + circle for initial add to cart
                      <Button
                        onClick={() => {
                          console.log('Adding product to cart:', product.title);
                          
                          // Create cart item
                          const cartItem: CartItem = {
                            productId: product.id,
                            title: product.title,
                            price: product.price,
                            quantity: 1,
                            image: product.image,
                            eventName: '',
                            category
                          };
                          
                          // Update local selections first to trigger +/- controls
                          handleQuantityChange(product.id, 1);
                          
                          // Add to cart immediately
                          onAddToCart([cartItem]);
                          
                          // Update local tracking so it shows as added
                          setAddedToCartItems(prev => ({
                            ...prev,
                            [product.id]: 1
                          }));
                          
                          console.log('Product added to cart, switching to +/- controls:', cartItem);
                        }}
                        className="w-6 h-6 md:w-8 md:h-8 p-0 rounded-full bg-green-600 hover:bg-green-700 text-white mt-auto"
                        type="button"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cocktail Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedProduct?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Large Image */}
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {selectedProduct.description || 'Premium cocktail kit perfect for your party.'}
                </p>
              </div>
              
              {/* Price */}
              <div className="text-2xl font-bold">${selectedProduct.price}</div>
              
              {/* Add to Cart Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const currentQty = selections[selectedProduct.id] || 0;
                      if (currentQty > 0) {
                        handleQuantityChange(selectedProduct.id, -1);
                      }
                    }}
                    disabled={(selections[selectedProduct.id] || 0) <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">
                    {selections[selectedProduct.id] || 0}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handleQuantityChange(selectedProduct.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDialogAddToCart(selectedProduct, selections[selectedProduct.id] || 1)}
                    className="flex-1"
                    disabled={(selections[selectedProduct.id] || 0) <= 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Keep Shopping
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Summary Section - Condensed */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold">Selection Summary</p>
            <p className="text-xs text-muted-foreground">
              {Object.values(selections).reduce((sum, qty) => sum + qty, 0)} {getUnitName(Object.values(selections).reduce((sum, qty) => sum + qty, 0) !== 1)} selected
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${selectionTotal.toFixed(2)}</p>
            <p className={`text-xs ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remainingBudget.toFixed(2)} {remainingBudget >= 0 ? 'remaining' : 'over budget'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              selectionTotal <= budget ? 'bg-green-400' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((selectionTotal / budget) * 100, 100)}%` }}
          />
        </div>

        <div className="flex gap-2 justify-end">
          {Object.values(selections).some(qty => qty > 0) && (
            <Button
              onClick={handleAddToCart}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Add to Cart
            </Button>
          )}
          <Button
            onClick={handleSaveAndContinue}
            size="sm"
            className="text-xs"
          >
            Continue
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};