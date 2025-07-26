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
  'wine': 'spirits', // Using spirits collection for now since wine-champagne may not exist
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

      // Check cache first
      const cachedCollections = cacheManager.getShopifyCollections();
      let collections: ShopifyCollection[] = [];

      if (cachedCollections && cachedCollections.length > 0) {
        collections = cachedCollections;
      } else {
        // Fetch fresh data
        const { data, error } = await supabase.functions.invoke('get-all-collections');
        
        if (error || data?.error) {
          throw new Error(`Failed to fetch collections: ${error?.message || data?.error}`);
        }
        
        collections = data.collections || [];
        cacheManager.setShopifyCollections(collections);
      }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {products.map((product) => {
            const quantity = selections[product.id] || 0;
            const isSelected = quantity > 0;
            const wasAddedToCart = addedToCartItems[product.id] > 0;

            return (
              <Card 
                key={product.id} 
                className={`transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                } ${wasAddedToCart ? 'bg-green-50 border-green-200' : ''}`}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-3" style={{ aspectRatio: '4/1' }}>
                    {/* Image - 1 unit tall, taking about 1/4 of width */}
                    <div className="w-1/4 aspect-square rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className={`w-full h-full object-cover ${category === 'cocktails' ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={() => handleProductClick(product)}
                      />
                    </div>
                    
                    {/* Product Info - Takes remaining width */}
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      {/* Title - flex-1 to take remaining space */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.title}</h4>
                        {wasAddedToCart && (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            In Cart
                          </Badge>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="text-sm font-bold whitespace-nowrap">
                        ${product.price}
                      </div>
                      
                      {/* Quantity Controls + Button */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={quantity <= 0}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-medium text-xs">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Line Total - Below the main row if quantity > 0 */}
                  {quantity > 0 && (
                    <div className="text-center mt-1">
                      <span className="text-xs font-semibold">
                        Total: ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  )}
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

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products available for {category}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {products.map((product) => {
            const quantity = selections[product.id] || 0;
            const isSelected = quantity > 0;
            const wasAddedToCart = addedToCartItems[product.id] > 0;

            return (
              <Card 
                key={product.id} 
                className={`transition-all duration-200 h-[100px] ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                } ${wasAddedToCart ? 'bg-green-50 border-green-200' : ''}`}
              >
                <CardContent className="p-2 h-full flex items-center gap-2">
                  {/* Image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className={`w-full h-full object-cover ${category === 'cocktails' ? 'cursor-pointer hover:opacity-80' : ''}`}
                      onClick={() => handleProductClick(product)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                    {/* Title and Price */}
                    <div>
                      <h4 className="font-semibold text-xs line-clamp-2 mb-1">{product.title}</h4>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">${product.price}</span>
                        {wasAddedToCart && (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-[10px] px-1 py-0">
                            <Check className="w-2 h-2 mr-1" />
                            In Cart
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, -1)}
                        disabled={quantity <= 0}
                        className="h-5 w-5 p-0"
                      >
                        <Minus className="w-2 h-2" />
                      </Button>
                      <span className="w-6 text-center font-medium text-xs">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary and Actions */}
      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold">Selection Summary</p>
            <p className="text-sm text-muted-foreground">
              {Object.values(selections).reduce((sum, qty) => sum + qty, 0)} {getUnitName(Object.values(selections).reduce((sum, qty) => sum + qty, 0) !== 1)} • {totalServings} {getServingName()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${selectionTotal.toFixed(2)}</p>
            <p className={`text-sm ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Budget: ${remainingBudget.toFixed(2)} {remainingBudget >= 0 ? 'remaining' : 'over'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleAddToCart}
            disabled={Object.values(selections).every(qty => qty === 0)}
            className={`flex items-center gap-2 ${isAddedToCart && Object.values(selections).every(qty => addedToCartItems[products.find(p => selections[p.id] > 0)?.id || ''] >= qty) ? 'opacity-50' : ''}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isAddedToCart ? 'Update Cart' : 'Add to Cart'}
          </Button>
          
          <Button
            onClick={handleSaveAndContinue}
            disabled={Object.values(selections).every(qty => qty === 0)}
            className="flex items-center gap-2"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};