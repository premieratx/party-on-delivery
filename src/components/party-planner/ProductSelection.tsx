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
}

interface ProductSelectionProps {
  category: string;
  subcategories: string[];
  recommendedQuantity: number;
  unitType: string; // 'cans', 'bottles', 'kits'
  budget: number;
  onAddToCart: (items: CartItem[]) => void;
  onComplete: () => void;
}

export const ProductSelection = ({ 
  category, 
  subcategories, 
  recommendedQuantity, 
  unitType, 
  budget, 
  onAddToCart,
  onComplete 
}: ProductSelectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  // Reset state when category changes
  useEffect(() => {
    setSelections({});
    setIsCompleted(false);
    fetchProducts();
  }, [category, subcategories]);

  const generateSampleProducts = (): Product[] => {
    const baseProducts = [
      // Beer products with container sizes
      { category: 'beer', subcategory: 'Light', title: 'Miller Lite 12-Pack', price: 15.99, containerSize: 12 },
      { category: 'beer', subcategory: 'Light', title: 'Bud Light 24-Pack', price: 22.99, containerSize: 24 },
      { category: 'beer', subcategory: 'Light', title: 'Corona Light 12-Pack', price: 17.99, containerSize: 12 },
      { category: 'beer', subcategory: 'IPA', title: 'Sierra Nevada IPA 6-Pack', price: 12.99, containerSize: 6 },
      { category: 'beer', subcategory: 'Lager', title: 'Stella Artois 12-Pack', price: 19.99, containerSize: 12 },
      
      // Wine products (bottles)
      { category: 'wine', subcategory: 'Chardonnay', title: 'Kendall-Jackson Chardonnay', price: 18.99, containerSize: 1 },
      { category: 'wine', subcategory: 'Cabernet', title: 'Caymus Cabernet Sauvignon', price: 89.99, containerSize: 1 },
      { category: 'wine', subcategory: 'Pinot Noir', title: 'La Crema Pinot Noir', price: 24.99, containerSize: 1 },
      { category: 'wine', subcategory: 'Sauvignon Blanc', title: 'Whitehaven Sauvignon Blanc', price: 16.99, containerSize: 1 },
      
      // Spirits/Liquor products (bottles)
      { category: 'liquor', subcategory: 'Whiskey', title: 'Jack Daniels Old No. 7 (750ml)', price: 26.99, containerSize: 1 },
      { category: 'liquor', subcategory: 'Whiskey', title: 'Jameson Irish Whiskey (750ml)', price: 29.99, containerSize: 1 },
      { category: 'liquor', subcategory: 'Whiskey', title: 'Buffalo Trace Bourbon (750ml)', price: 24.99, containerSize: 1 },
      { category: 'liquor', subcategory: 'Vodka', title: 'Titos Handmade Vodka (750ml)', price: 21.99, containerSize: 1 },
      { category: 'liquor', subcategory: 'Rum', title: 'Bacardi Superior Rum (750ml)', price: 17.99, containerSize: 1 },
      { category: 'liquor', subcategory: 'Gin', title: 'Hendricks Gin (750ml)', price: 34.99, containerSize: 1 },
      
      // Cocktail products (kits)
      { category: 'cocktails', subcategory: 'Margarita', title: 'Margarita Party Kit (serves 12)', price: 45.99, containerSize: 12 },
      { category: 'cocktails', subcategory: 'Cosmopolitan', title: 'Cosmo Cocktail Kit', price: 39.99, containerSize: 8 },
      { category: 'cocktails', subcategory: 'Mojito', title: 'Mojito Mix & Rum Bundle', price: 42.99, containerSize: 10 },
    ];

    return baseProducts
      .filter(product => 
        product.category === category && 
        (subcategories.length === 0 || subcategories.includes(product.subcategory))
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
          image: product.imageUrl
        };
      });
  };

  const handleConfirmSelection = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item",
        variant: "destructive",
      });
      return;
    }

    onAddToCart(selectedItems);
    setIsCompleted(true);
    toast({
      title: "Added to cart!",
      description: `Added ${selectedItems.length} items to your cart`,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">Choose Your {category.charAt(0).toUpperCase() + category.slice(1)}</span>
          {isCompleted && <Check className="w-5 h-5 text-green-500" />}
        </CardTitle>
        <div className="text-lg font-semibold mb-2">
          Select {getContainersNeeded()} containers ({recommendedQuantity} {unitType} needed)
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Category Budget: ${budget.toFixed(2)}</span>
          <span>Remaining: ${remainingBudget.toFixed(2)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (getTotalServings() / recommendedQuantity) * 100)}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Selected: {getTotalServings()} / {recommendedQuantity} {unitType} ({getTotalQuantity()} containers)
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No products found for this category. Please try different selections.
          </div>
        ) : (
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {products.map((product) => {
              const quantity = selections[product.id] || 0;
              const productTotal = (product.price || 0) * quantity;
              
              return (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                     <div className="flex-1 min-w-0">
                       <h4 className="font-medium truncate">{product.title}</h4>
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium">${product.price?.toFixed(2) || '0.00'}</span>
                         <span className="text-xs text-muted-foreground">({product.containerSize} {unitType})</span>
                         {product.subcategory && (
                           <Badge variant="outline" className="text-xs">
                             {product.subcategory}
                           </Badge>
                         )}
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {productTotal > 0 && (
                      <span className="text-sm font-medium ml-2 min-w-16 text-right">
                        ${productTotal.toFixed(2)}
                      </span>
                    )}
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
              <span>Total Containers:</span>
              <span>{getTotalQuantity()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total {unitType}:</span>
              <span>{getTotalServings()}/{recommendedQuantity}</span>
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
          <Button 
            onClick={handleConfirmSelection}
            disabled={getTotalQuantity() === 0}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Confirm & Add to Cart
          </Button>
          <Button onClick={onComplete} variant="outline">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};