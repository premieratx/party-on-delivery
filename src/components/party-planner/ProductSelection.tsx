import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";

interface Product {
  id: string;
  shopify_product_id: string;
  title: string;
  handle: string;
  description?: string;
  image_url?: string;
  price?: number;
  data: any;
  assigned_category: string;
  subcategory?: string;
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

  useEffect(() => {
    fetchProducts();
  }, [category, subcategories]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First, categorize products if not done yet
      await supabase.functions.invoke('categorize-products');
      
      // Get categorized products for this category
      let categorizedQuery = supabase
        .from('product_categories')
        .select('*')
        .eq('assigned_category', category);

      // Filter by subcategories if specified
      if (subcategories.length > 0) {
        categorizedQuery = categorizedQuery.in('subcategory', subcategories);
      }

      const { data: categorizedProducts, error: categorizedError } = await categorizedQuery;

      if (categorizedError) {
        throw categorizedError;
      }

      if (!categorizedProducts || categorizedProducts.length === 0) {
        setProducts([]);
        return;
      }

      // Get product details from cache
      const productIds = categorizedProducts.map(p => p.shopify_product_id);
      const { data: productCache, error: cacheError } = await supabase
        .from('shopify_products_cache')
        .select('*')
        .in('shopify_product_id', productIds);

      if (cacheError) {
        throw cacheError;
      }

      if (!productCache || productCache.length === 0) {
        setProducts([]);
        return;
      }

      // Transform the data by combining categorization info with product cache
      const transformedProducts = categorizedProducts.map(categorized => {
        const cached = productCache.find(p => p.shopify_product_id === categorized.shopify_product_id);
        if (!cached) return null;
        
        return {
          id: categorized.id,
          shopify_product_id: categorized.shopify_product_id,
          title: categorized.product_title,
          handle: categorized.product_handle,
          assigned_category: categorized.assigned_category,
          subcategory: categorized.subcategory,
          description: cached.description,
          image_url: cached.image_url,
          price: cached.price || 0,
          data: cached.data || {}
        };
      }).filter(Boolean) as Product[];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error:', error);
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
          image: product.image_url
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
          <span>Choose {recommendedQuantity} {unitType} - {category.charAt(0).toUpperCase() + category.slice(1)}</span>
          {isCompleted && <Check className="w-5 h-5 text-green-500" />}
        </CardTitle>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Budget: ${budget}</span>
          <span>Remaining: ${remainingBudget.toFixed(2)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (totalSelected / recommendedQuantity) * 100)}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Selected: {totalSelected} / {recommendedQuantity} {unitType}
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
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">${product.price?.toFixed(2) || '0.00'}</span>
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
              <span>Total Items:</span>
              <span>{getTotalQuantity()} {unitType}</span>
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
            disabled={getTotalQuantity() === 0 || isCompleted}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isCompleted ? 'Added to Cart' : 'Confirm & Add to Cart'}
          </Button>
          {isCompleted && (
            <Button onClick={onComplete} variant="outline">
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};