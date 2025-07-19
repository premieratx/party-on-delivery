import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { supabase } from '@/integrations/supabase/client';

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

interface ProductCategoriesProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: CartItem[]; // Add this to track individual cart items
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCountAnimation, setCartCountAnimation] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Step-based order flow mapping to collection handles
  const stepMapping = [
    { step: 1, title: 'Beer', handle: 'tailgate-beer', icon: Beer, color: 'bg-amber-500' },
    { step: 2, title: 'Seltzers', handle: 'seltzer-collection', icon: Martini, color: 'bg-blue-500' },
    { step: 3, title: 'Cocktails', handle: 'cocktail-kits', icon: Martini, color: 'bg-pink-500' },
    { step: 4, title: 'Party Supplies', handle: 'party-supplies', icon: Package, color: 'bg-green-500' }
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      console.log('Fetching Shopify collections via edge function...');
      
      // Use our step mapping to define the collections we want
      const targetCollections = stepMapping.map(step => step.handle);
      
      // Call our edge function to fetch collections
      const { data, error } = await supabase.functions.invoke('fetch-shopify-products', {
        body: { handles: targetCollections }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        setError('Failed to fetch collections');
        return;
      }

      if (data?.collections) {
        console.log('Collections loaded via edge function:', data.collections);
        setCollections(data.collections);
      } else {
        console.error('No collections data received');
        setError('No collections found');
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollection = collections[selectedCategory];

  // Helper to get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  };

  // Trigger cart count animation
  useEffect(() => {
    if (cartItemCount > 0) {
      setCartCountAnimation(true);
      const timer = setTimeout(() => setCartCountAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartItemCount]);

  const handleAddToCart = (product: ShopifyProduct, variant?: any) => {
    onAddToCart({
      id: product.id,
      title: product.title,
      name: product.title, // Add name field for Shopify compatibility
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant ? variant.id : product.variants[0]?.id // Use variant ID, not title
    });
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    onUpdateQuantity(productId, variantId, newQty);
  };

  const handleNextTab = () => {
    if (selectedCategory < collections.length - 1) {
      setSelectedCategory(selectedCategory + 1);
    } else {
      // On the last tab, show checkout confirmation
      setShowCheckoutDialog(true);
    }
  };

  const confirmCheckout = () => {
    setShowCheckoutDialog(false);
    onProceedToCheckout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading collections from Shopify...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Configuration Required</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              To connect to Shopify, you need to:
              <br />1. Go to your Shopify Admin
              <br />2. Navigate to Apps → Develop apps → Create private app
              <br />3. Enable Storefront API access
              <br />4. Copy the Storefront access token
              <br />5. Replace "YOUR_STOREFRONT_ACCESS_TOKEN_HERE" in the code
            </p>
            <Button onClick={fetchCollections} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Build Your Party Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Build Your Party
            </h1>
            
            <Button 
              variant="default" 
              size="lg"
              onClick={onOpenCart}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartItemCount > 0 && (
                <Badge 
                  className={`absolute -top-2 -right-2 bg-accent text-accent-foreground min-w-[24px] h-6 rounded-full text-xs font-bold transition-all duration-300 ${
                    cartCountAnimation ? 'animate-pulse scale-125' : ''
                  }`}
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Step-based Navigation */}
        <div className="border-t bg-background/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {collections.map((collection, index) => {
                const stepInfo = stepMapping.find(step => step.handle === collection.handle);
                const Icon = stepInfo?.icon || Package;
                const color = stepInfo?.color || 'bg-gray-500';
                const stepTitle = stepInfo?.title || collection.title;
                const stepNumber = stepInfo?.step || index + 1;
                const isActive = selectedCategory === index;
                
                return (
                  <Button
                    key={collection.handle}
                    variant={isActive ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedCategory(index)}
                    className="h-24 flex-col gap-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {stepNumber}
                      </div>
                      <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <span className="text-3xl font-bold leading-none">{stepTitle}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pt-8">
        {/* Collection Info */}
        {selectedCollection && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedCollection.title}
              </CardTitle>
              <CardDescription>{selectedCollection.description}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Compact Order Form Layout - 5 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCollection?.products.map((product) => (
            <div key={product.id} className="bg-card border rounded-lg px-3 py-1.5 hover:shadow-md transition-all duration-200">
              {/* Product variants handling */}
              {product.variants.length > 1 ? (
                <div className="space-y-2">
                  {product.variants.slice(0, 3).map((variant) => {
                    const cartQty = getCartItemQuantity(product.id, variant.id);
                    
                    return (
                      <div key={variant.id} className="flex items-center gap-2 min-h-[60px]">
                        {/* Small product image */}
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base">{product.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz').replace(/Can/gi, '').replace(/Hard Seltzer/gi, '').replace(/\s+/g, ' ').trim()}</h4>
                          <p className="text-xs text-muted-foreground">{variant.title}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            ${variant.price.toFixed(2)}
                          </Badge>
                        </div>
                        
                        {/* Cart controls */}
                        <div className="flex-shrink-0">
                          {cartQty > 0 ? (
                            <div className="flex items-center gap-1 bg-muted rounded">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(product.id, variant.id, -1)}
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-2 text-xs font-medium">{cartQty}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(product.id, variant.id, 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(product, variant)}
                              size="sm"
                              disabled={!variant.available}
                              className="h-7 px-2 text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Single product row
                <div className="flex items-center gap-2 min-h-[60px]">
                  {/* Small product image */}
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-base">{product.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz').replace(/Can/gi, '').replace(/Hard Seltzer/gi, '').replace(/\s+/g, ' ').trim()}</h4>
                    <Badge variant="secondary" className="text-xs mt-1">
                      ${product.price.toFixed(2)}
                    </Badge>
                  </div>
                  
                  {/* Cart controls */}
                  <div className="flex-shrink-0">
                    {(() => {
                      const cartQty = getCartItemQuantity(product.id, product.variants[0]?.id);
                      
                      return cartQty > 0 ? (
                        <div className="flex items-center gap-1 bg-muted rounded">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantityChange(product.id, product.variants[0]?.id, -1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-xs font-medium">{cartQty}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantityChange(product.id, product.variants[0]?.id, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedCollection?.products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products found in this collection.</p>
          </div>
        )}

        {collections.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Unable to load Shopify collections.</p>
            <Button onClick={fetchCollections} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Next Button */}
        {selectedCollection && (
          <div className="flex justify-center mt-8 pb-8">
            <Button 
              variant="default" 
              size="xl" 
              onClick={handleNextTab}
              className="px-8 py-3"
            >
              {selectedCategory < collections.length - 1 ? (
                <>
                  Next <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proceed to Checkout?</DialogTitle>
            <DialogDescription>
              You're about to proceed to checkout with {cartItemCount} items in your cart.
              You can always come back to add more items later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Continue Shopping
            </Button>
            <Button onClick={confirmCheckout}>
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};