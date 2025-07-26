import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, Check, Loader2, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';

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

// Category to Shopify collection mapping (using same collections as main app)
const categoryCollectionMap: Record<string, string> = {
  'beer': 'tailgate-beer',
  'wine': 'wine-champagne',
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
      });
      setSelections(restoredSelections);
      setAddedToCartItems(addedItems);
    } else {
      setSelections({});
      setAddedToCartItems({});
    }
  }, [category, subcategories]);

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

      // Always fetch fresh data - ignore cache as requested
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error || data?.error) {
        throw new Error(`Failed to fetch collections: ${error?.message || data?.error}`);
      }
      
      const collections = data.collections || [];
      cacheManager.setShopifyCollections(collections);

      // Find the collection for this category
      const targetCollection = collections.find(c => c.handle === collectionHandle);
      
      if (targetCollection && targetCollection.products) {
        setProducts(targetCollection.products);
      } else {
        console.warn(`No products found for collection: ${collectionHandle}`);
        setProducts([]);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      ErrorHandler.logError(error, 'fetchProducts');
      setProducts([]);
      toast({
        title: "Error Loading Products",
        description: "Failed to load products for this category. Please try again.",
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

    // Check for new items that weren't in the cart before
    const newItems = selectedItems.filter(item => 
      !addedToCartItems[item.productId] || 
      selections[item.productId] > addedToCartItems[item.productId]
    );

    if (newItems.length === 0 && isAddedToCart) {
      toast({
        title: "No New Items",
        description: "All selected items are already in your cart.",
      });
      return;
    }

    onAddToCart(selectedItems);
    setIsAddedToCart(true);
    setAddedToCartItems({...selections});
    
    toast({
      title: "Added to Cart",
      description: `${selectedItems.length} item(s) added to your cart!`,
    });
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
      
      toast({
        title: "Added to Cart",
        description: `${product.title} added to your cart!`,
      });
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
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2 capitalize">
          Choose Your {category === 'cocktails' ? 'Cocktail Kits' : category}
        </h3>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {products.map((product) => {
            const quantity = selections[product.id] || 0;
            const isSelected = quantity > 0;
            const wasAddedToCart = addedToCartItems[product.id] > 0;
            const { name, packInfo } = parseProductTitle(product.title);

            return (
              <Card 
                key={product.id} 
                className={`transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                } ${wasAddedToCart ? 'bg-green-50 border-green-200' : ''}`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center h-full gap-2">
                    {/* Image */}
                    <div className="w-full aspect-[3/2] rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className={`w-full h-full object-cover ${category === 'cocktails' ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={() => handleProductClick(product)}
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
                    
                    {/* Green Add to Cart Button */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const cartItem: CartItem = {
                          productId: product.id,
                          title: product.title,
                          price: product.price,
                          quantity: 1,
                          image: product.image,
                          eventName: '',
                          category
                        };
                        onAddToCart([cartItem]);
                        setAddedToCartItems(prev => ({
                          ...prev,
                          [product.id]: (prev[product.id] || 0) + 1
                        }));
                        toast({
                          title: "Added to Cart",
                          description: `${product.title} added to your cart!`,
                        });
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
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


      {/* Summary and Actions - simplified without Add to Cart button */}
      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold">Cart Summary</p>
            <p className="text-sm text-muted-foreground">
              {Object.values(addedToCartItems).reduce((sum, qty) => sum + qty, 0)} {getUnitName(Object.values(addedToCartItems).reduce((sum, qty) => sum + qty, 0) !== 1)} in cart
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              return total + (product ? product.price * quantity : 0);
            }, 0).toFixed(2)}</p>
            <p className={`text-sm ${(budget - Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              return total + (product ? product.price * quantity : 0);
            }, 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Budget: ${(budget - Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return total + (product ? product.price * quantity : 0);
              }, 0)).toFixed(2)} {(budget - Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return total + (product ? product.price * quantity : 0);
              }, 0)) >= 0 ? 'remaining' : 'over'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return total + (product ? product.price * quantity : 0);
              }, 0) <= budget ? 'bg-green-400' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((Object.entries(addedToCartItems).reduce((total, [productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              return total + (product ? product.price * quantity : 0);
            }, 0) / budget) * 100, 100)}%` }}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={handleSaveAndContinue}
            className="flex items-center gap-2"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};