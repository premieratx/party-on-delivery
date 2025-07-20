import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { ProductLightbox } from './ProductLightbox';
import { supabase } from '@/integrations/supabase/client';
import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[]; // Add support for multiple images
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
  onBack?: () => void;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCountAnimation, setCartCountAnimation] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{[productId: string]: string}>({});
  const [lightboxProduct, setLightboxProduct] = useState<ShopifyProduct | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Step-based order flow mapping to collection handles
  const stepMapping = [
    { step: 1, title: 'Beer', handle: 'tailgate-beer', backgroundImage: beerCategoryBg, pageTitle: 'Choose Your Beer' },
    { step: 2, title: 'Seltzers', handle: 'seltzer-collection', backgroundImage: seltzerCategoryBg, pageTitle: 'Choose Your Seltzers' },
    { step: 3, title: 'Cocktails', handle: 'cocktail-kits', backgroundImage: cocktailCategoryBg, pageTitle: 'Choose Your Cocktails' },
    { step: 4, title: 'Party Supplies', handle: 'party-supplies', backgroundImage: partySuppliesCategoryBg, pageTitle: 'Choose Your Party Supplies' }
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
      // Scroll to top when changing tabs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // On the last tab, show checkout confirmation
      setShowCheckoutDialog(true);
    }
  };

  const confirmCheckout = () => {
    setShowCheckoutDialog(false);
    onProceedToCheckout();
  };

  // Handle product click for cocktails (step 3)
  const handleProductClick = (product: ShopifyProduct) => {
    // Only enable lightbox for cocktails (step 3)
    if (selectedCategory === 2) { // Cocktails is index 2
      setLightboxProduct(product);
      setIsLightboxOpen(true);
    }
  };

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxProduct(null);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Sticky Cart & Checkout Buttons - Desktop Only */}
      <div className="hidden lg:block bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-background/80 hover:bg-background"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart ({cartItemCount})
              {cartItemCount > 0 && (
                <Badge variant="default" className="ml-1 bg-primary text-primary-foreground">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            
            {cartItemCount > 0 && (
              <Button
                variant="default"
                size="lg"
                onClick={onProceedToCheckout}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
              >
                Checkout Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs - increased height on desktop, no background images */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-30 lg:top-[72px]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-4 gap-2 h-20 sm:h-24">
            {stepMapping.map((step, index) => {
              const isActive = selectedCategory === index;
              const IconComponent = step.step === 1 ? Beer : step.step === 2 ? Martini : step.step === 3 ? Martini : Package;
              const stepNumber = step.step;
              const stepTitle = step.title;
              
              return (
                <button
                  key={step.handle}
                  onClick={() => {
                    setSelectedCategory(index);
                    const targetCollection = collections.find(c => c.handle === step.handle);
                    if (targetCollection) {
                      // No need to fetch, collection already loaded
                    }
                  }}
                  className={`relative overflow-hidden rounded-lg transition-all duration-300 group ${
                    isActive 
                      ? 'bg-primary/10 border-2 border-primary shadow-lg' 
                      : 'bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-2">
                    {/* Mobile layout: stacked */}
                    <div className="sm:hidden flex flex-col items-center gap-1">
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-foreground'}`} />
                      <div className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepTitle}</div>
                    </div>
                    
                    {/* Desktop layout: side by side without background image */}
                    <div className="hidden sm:flex items-center justify-between w-full px-4">
                      <div className={`font-bold text-3xl ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepNumber}</div>
                      <div className={`font-bold text-xl text-right ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepTitle}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collection Header with reduced height on desktop and navigation arrows */}
      {selectedCollection && (
        <div className="relative h-32 sm:h-24 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${stepMapping.find(step => step.handle === selectedCollection.handle)?.backgroundImage})`,
            }}
          >
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          <div className="relative z-10 h-full flex items-center justify-center px-4">
            {/* Center title with navigation arrows below */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-white text-2xl sm:text-3xl font-bold text-center mb-2">
                {stepMapping.find(step => step.handle === selectedCollection.handle)?.pageTitle || selectedCollection.title}
              </h2>
              
              {/* Navigation arrows - big white ovals with blue arrows */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    const prevIndex = selectedCategory > 0 ? selectedCategory - 1 : collections.length - 1;
                    setSelectedCategory(prevIndex);
                  }}
                  className="bg-white/95 hover:bg-white text-brand-blue hover:text-brand-blue rounded-full h-12 w-12 p-0 shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <span className="text-white/80 text-sm font-medium">
                  {selectedCategory + 1} of {collections.length}
                </span>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    const nextIndex = selectedCategory < collections.length - 1 ? selectedCategory + 1 : 0;
                    setSelectedCategory(nextIndex);
                  }}
                  className="bg-white/95 hover:bg-white text-brand-blue hover:text-brand-blue rounded-full h-12 w-12 p-0 shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 pt-8">
        {/* Product Grid - All categories use consistent 3 columns mobile, 6 desktop */}
        <div className="grid gap-2 lg:gap-4 grid-cols-3 lg:grid-cols-6">
          {selectedCollection?.products.map((product) => {
            // Handle variant selection for products with multiple variants
            const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
            const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
            const cartQty = getCartItemQuantity(product.id, selectedVariant?.id);
            
            return (
              <div 
                key={product.id} 
                className={`bg-card border rounded-lg p-3 hover:shadow-md transition-all duration-200 flex flex-col h-full ${
                  selectedCategory === 2 ? 'cursor-pointer hover:border-primary/50' : ''
                }`}
                onClick={() => handleProductClick(product)}
              >
                {/* Product image - consistent height */}
                <div className="bg-muted rounded overflow-hidden w-full aspect-square mb-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Product info with consistent height */}
                <div className="flex flex-col flex-1 justify-between min-h-[8rem]">
                  <div className="flex-1 flex flex-col justify-start">
                    <h4 className="font-medium leading-tight text-center text-sm line-clamp-2 mb-2">
                      {(() => {
                        // Clean title and remove pack info if it will be shown separately
                        const hasPackInfo = product.title.match(/(\d+)\s*(?:pk|pack)/i) && product.title.match(/(\d+)\s*oz/i);
                        
                        let cleanedTitle;
                        if (hasPackInfo) {
                          cleanedTitle = product.title
                            .replace(/(\d+)\s*(?:pk|pack)\s*[×x*]\s*(\d+)\s*oz/gi, '')
                            .replace(/(\d+)\s*(?:pk|pack)/gi, '')
                            .replace(/(\d+)\s*oz/gi, '')
                            .replace(/Can/gi, '')
                            .replace(/Hard Seltzer/gi, '')
                            .replace(/\s+/g, ' ')
                            .replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*$/g, '')
                            .trim();
                        } else {
                          cleanedTitle = product.title
                            .replace(/(\d+)\s*Pack/gi, '$1pk')
                            .replace(/(\d+)\s*oz/gi, '$1oz')
                            .replace(/Can/gi, '')
                            .replace(/Hard Seltzer/gi, '')
                            .replace(/\s+/g, ' ')
                            .replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*$/g, '')
                            .trim();
                        }
                        
                        return cleanedTitle;
                      })()}
                    </h4>

                    {/* Variant selector for products with multiple variants */}
                    {product.variants.length > 1 ? (
                      <div className="mb-2">
                        <Select
                          value={selectedVariantId}
                          onValueChange={(variantId) => setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: variantId
                          }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {product.variants.map((variant) => (
                              <SelectItem key={variant.id} value={variant.id} className="text-xs">
                                {variant.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs line-clamp-1 mb-2">
                        {selectedVariant?.title}
                      </p>
                    )}

                    {/* Pack size info for variant products */}
                    {(() => {
                      const packMatch = product.title.match(/(\d+)\s*(?:pk|pack)/i);
                      const sizeMatch = product.title.match(/(\d+)\s*oz/i);
                      if (packMatch && sizeMatch) {
                        return (
                          <p className="text-foreground font-bold text-xs text-center mb-2">
                            {packMatch[1]}pk × {sizeMatch[1]}oz
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  {/* Price and cart controls container - always at bottom */}
                  <div className="mt-auto pt-2 flex flex-col items-center gap-2">
                    <Badge variant="secondary" className="w-fit font-semibold text-center text-xs">
                      ${selectedVariant?.price.toFixed(2)}
                    </Badge>
                      
                    {/* Cart controls */}
                    <div className="flex justify-center">
                      {cartQty > 0 ? (
                        <div className="flex items-center gap-0.5 bg-muted rounded" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(product.id, selectedVariant?.id, Math.max(0, cartQty - 1));
                            }}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="text-sm font-medium px-2 min-w-[2rem] text-center">
                            {cartQty}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(product.id, selectedVariant?.id, cartQty + 1);
                            }}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                             if (selectedVariant) {
                               onAddToCart({
                                 id: product.id,
                                 title: product.title,
                                 name: product.title,
                                 price: selectedVariant.price,
                                 image: product.image,
                                 variant: selectedVariant.id
                               });
                              setCartCountAnimation(true);
                              setTimeout(() => setCartCountAnimation(false), 300);
                            }
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
      
      {/* Navigation Footer */}
      {onBack && (
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step 3 of 4
            </div>
          </div>
        </div>
      )}

      {/* Product Lightbox for cocktails */}
      <ProductLightbox
        product={lightboxProduct}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={onUpdateQuantity}
        cartQuantity={lightboxProduct ? getCartItemQuantity(lightboxProduct.id, selectedVariants[lightboxProduct.id] || lightboxProduct.variants[0]?.id) : 0}
        selectedVariant={lightboxProduct ? lightboxProduct.variants.find(v => v.id === (selectedVariants[lightboxProduct.id] || lightboxProduct.variants[0]?.id)) || lightboxProduct.variants[0] : undefined}
      />
    </div>
  );
};