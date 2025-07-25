import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
  subcategory?: string;
  containerSize?: number; // Number of servings/units per container
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [addedToCartItems, setAddedToCartItems] = useState<Record<string, number>>({});
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

  const generateSampleProducts = (): Product[] => {
    const baseProducts = [
      // Beer products with container sizes (12-packs)
      { category: 'beer', subcategory: 'Light', title: 'Miller Lite 12-Pack', price: 15.99, containerSize: 12 },
      { category: 'beer', subcategory: 'Light', title: 'Bud Light 12-Pack', price: 16.99, containerSize: 12 },
      { category: 'beer', subcategory: 'Light', title: 'Corona Light 12-Pack', price: 17.99, containerSize: 12 },
      { category: 'beer', subcategory: 'IPA', title: 'Sierra Nevada IPA 12-Pack', price: 18.99, containerSize: 12 },
      { category: 'beer', subcategory: 'Lager', title: 'Stella Artois 12-Pack', price: 19.99, containerSize: 12 },
      
      // Wine products (bottles - 5 drinks per bottle)
      { category: 'wine', subcategory: 'Red', title: 'Kendall-Jackson Vintner\'s Reserve Cabernet', price: 18.99, containerSize: 5 },
      { category: 'wine', subcategory: 'Red', title: 'Caymus Cabernet Sauvignon', price: 89.99, containerSize: 5 },
      { category: 'wine', subcategory: 'Red', title: 'La Crema Pinot Noir', price: 24.99, containerSize: 5 },
      { category: 'wine', subcategory: 'White', title: 'Kendall-Jackson Chardonnay', price: 16.99, containerSize: 5 },
      { category: 'wine', subcategory: 'White', title: 'Whitehaven Sauvignon Blanc', price: 16.99, containerSize: 5 },
      
      // Spirits/Liquor products (bottles - 25 drinks per 750ml bottle)
      { category: 'liquor', subcategory: 'Whiskey', title: 'Jack Daniels Old No. 7 (750ml)', price: 26.99, containerSize: 25 },
      { category: 'liquor', subcategory: 'Whiskey', title: 'Jameson Irish Whiskey (750ml)', price: 29.99, containerSize: 25 },
      { category: 'liquor', subcategory: 'Whiskey', title: 'Buffalo Trace Bourbon (750ml)', price: 24.99, containerSize: 25 },
      { category: 'liquor', subcategory: 'Vodka', title: 'Titos Handmade Vodka (750ml)', price: 21.99, containerSize: 25 },
      { category: 'liquor', subcategory: 'Rum', title: 'Bacardi Superior Rum (750ml)', price: 17.99, containerSize: 25 },
      { category: 'liquor', subcategory: 'Gin', title: 'Hendricks Gin (750ml)', price: 34.99, containerSize: 25 },
      
      // Cocktail products (kits)
      { category: 'cocktails', subcategory: 'Margarita', title: 'Margarita Party Kit (serves 12)', price: 45.99, containerSize: 12 },
      { category: 'cocktails', subcategory: 'Cosmopolitan', title: 'Cosmo Cocktail Kit', price: 39.99, containerSize: 8 },
      { category: 'cocktails', subcategory: 'Mojito', title: 'Mojito Mix & Rum Bundle', price: 42.99, containerSize: 10 },
    ];

    return baseProducts
      .filter(product => 
        product.category === category && 
        (subcategories.includes('all') || subcategories.length === 0 || subcategories.includes(product.subcategory))
      )
      .map((product, index) => ({
        id: `sample-${category}-${index}`,
        title: product.title,
        price: product.price,
        imageUrl: '/placeholder.svg',
        category: product.category,
        subcategory: product.subcategory,
        containerSize: product.containerSize || 1
      }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Create sample products based on category and subcategories for demo
      const sampleProducts = generateSampleProducts();
      setProducts(sampleProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setSelections(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalServings = () => {
    return Object.entries(selections).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.containerSize || 1) * quantity;
    }, 0);
  };

  const getContainersNeeded = () => {
    return Math.ceil(recommendedQuantity / (products.length > 0 ? Math.max(...products.map(p => p.containerSize || 1)) : 1));
  };

  const getTotalCost = () => {
    return Object.entries(selections).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.price || 0) * quantity;
    }, 0);
  };

  const getSelectedItems = (): CartItem[] => {
    return Object.entries(selections)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId)!;
        return {
          productId,
          title: product.title,
          price: product.price || 0,
          quantity,
          image: product.imageUrl,
          eventName: '',
          category: ''
        };
      });
  };

  const hasNewSelections = () => {
    return Object.entries(selections).some(([productId, quantity]) => 
      quantity > (addedToCartItems[productId] || 0)
    );
  };

  const getNewItems = (): CartItem[] => {
    return Object.entries(selections)
      .filter(([productId, quantity]) => quantity > (addedToCartItems[productId] || 0))
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId)!;
        const newQuantity = quantity - (addedToCartItems[productId] || 0);
        return {
          productId,
          title: product.title,
          price: product.price || 0,
          quantity: newQuantity,
          image: product.imageUrl,
          eventName: '',
          category: ''
        };
      });
  };

  const handleConfirmSelection = () => {
    const selectedItems = getSelectedItems();
    const newItems = getNewItems();
    
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item",
        variant: "destructive",
      });
      return;
    }

    if (isAddedToCart && newItems.length === 0) {
      toast({
        title: "No new items",
        description: "No new items to add to cart",
        variant: "destructive",
      });
      return;
    }

    const itemsToAdd = isAddedToCart ? newItems : selectedItems;
    onAddToCart(itemsToAdd);
    
    // Update added to cart items
    const newAddedItems = { ...addedToCartItems };
    Object.entries(selections).forEach(([productId, quantity]) => {
      newAddedItems[productId] = quantity;
    });
    setAddedToCartItems(newAddedItems);
    
    setIsCompleted(true);
    setIsAddedToCart(true);
    toast({
      title: "Added to cart!",
      description: `Added ${itemsToAdd.length} items to your cart`,
    });
  };

  const remainingBudget = budget - getTotalCost();
  const totalSelected = getTotalQuantity();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading products...</div>
        </CardContent>
      </Card>
    );
  }

  const totalPartySpent = runningTotal + getTotalCost();
  const remainingPartyBudget = totalPartyBudget - totalPartySpent;

  return (
    <div className="space-y-6">
      {/* Party Budget Overview - Top Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Party Budget Tracker</h3>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">${totalPartySpent.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Running Total</div>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-4 mb-3">
            <div 
              className="bg-primary h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalPartySpent / totalPartyBudget) * 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-green-600">${remainingPartyBudget.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Remaining Budget</div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Total Budget: ${totalPartyBudget.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">Choose Your {category.charAt(0).toUpperCase() + category.slice(1)}</span>
            {isCompleted && <Check className="w-5 h-5 text-green-500" />}
          </CardTitle>
          <div className="text-3xl font-bold mb-2 text-center">
            Choose {recommendedQuantity} {
              unitType === '12-packs' ? '12-Packs' :
              unitType === 'bottles' ? 'Bottles' :
              unitType === 'drinks' ? 'Cocktail Kits' : 
              unitType
            }
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Category Budget: ${budget.toFixed(2)}</span>
            <span>Remaining: ${remainingBudget.toFixed(2)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (getTotalServings() / recommendedQuantity) * 100)}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Selected: {getTotalServings()} / {
              unitType === 'drinks' ? recommendedQuantity + ' drinks' :
              unitType === '12-packs' ? (recommendedQuantity * 12) + ' beers' :
              unitType === 'bottles' && category === 'wine' ? (recommendedQuantity * 5) + ' drinks' :
              unitType === 'bottles' && category === 'liquor' ? (recommendedQuantity * 25) + ' drinks' :
              recommendedQuantity + ' ' + unitType
            } ({getTotalQuantity()} containers)
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for this category. Please try different selections.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {products.map((product) => {
                const quantity = selections[product.id] || 0;
                const productTotal = (product.price || 0) * quantity;
                
                return (
                  <div key={product.id} className="flex flex-col p-3 border rounded-lg space-y-3">
                    <div className="flex flex-col">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                       <div className="flex-1">
                         <h4 className="font-medium text-sm mb-1">{product.title}</h4>
                         <div className="flex flex-col gap-1">
                           <span className="text-lg font-bold">${product.price?.toFixed(2) || '0.00'}</span>
                            <span className="text-xs text-muted-foreground">({product.containerSize} {
                              category === 'beer' ? 'beers' : 
                              category === 'cocktails' ? 'drinks' :
                              'drinks'
                            })</span>
                           {product.subcategory && (
                             <Badge variant="outline" className="text-xs w-fit">
                               {product.subcategory}
                             </Badge>
                           )}
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={quantity === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {getTotalQuantity() > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Total {
                  unitType === '12-packs' ? '12-Packs' :
                  unitType === 'bottles' ? 'Bottles' :
                  unitType === 'drinks' ? 'Kits' : 
                  'Containers'
                }:</span>
                <span>{getTotalQuantity()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total {
                  category === 'cocktails' ? 'Drinks' :
                  category === 'beer' ? 'Beers' :
                  'Drinks'
                }:</span>
                <span>{getTotalServings()}/{
                  category === 'cocktails' ? recommendedQuantity :
                  category === 'beer' ? recommendedQuantity * 12 :
                  category === 'wine' ? recommendedQuantity * 5 :
                  category === 'liquor' ? recommendedQuantity * 25 :
                  recommendedQuantity
                }</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span className="font-medium">${getTotalCost().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Budget Remaining:</span>
                <span className={remainingBudget < 0 ? 'text-red-500' : 'text-green-600'}>
                  ${remainingBudget.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {onPrevious && (
              <Button variant="outline" onClick={onPrevious}>
                Previous
              </Button>
            )}
            <Button 
              onClick={handleConfirmSelection}
              disabled={getTotalQuantity() === 0 || (isAddedToCart && !hasNewSelections())}
              className={`flex-1 ${isAddedToCart && !hasNewSelections() ? 'opacity-50' : ''}`}
              variant={isAddedToCart && !hasNewSelections() ? "secondary" : "default"}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isAddedToCart && !hasNewSelections() ? 'Added to Cart' : 
               isAddedToCart && hasNewSelections() ? 'Add New Items' :
               'Add to Cart'}
            </Button>
            <Button 
              onClick={onComplete} 
              variant={isAddedToCart ? "default" : "outline"}
              className={isAddedToCart ? "animate-pulse bg-primary" : ""}
            >
              {isAddedToCart ? 'Confirm & Continue' : (getTotalQuantity() > 0 ? 'Save & Continue' : 'Skip Category')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};