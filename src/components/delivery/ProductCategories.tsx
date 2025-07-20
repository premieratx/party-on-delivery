import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft, CheckCircle } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { ProductLightbox } from './ProductLightbox';
import { supabase } from '@/integrations/supabase/client';
import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

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
      // On the last tab, go directly to checkout
      onProceedToCheckout();
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
      {/* Hero Section with Austin Background */}
      <div className="relative h-64 lg:h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroPartyAustin})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center items-center text-center px-4">
          <img 
            src={partyOnDeliveryLogo}
            alt="Party on Delivery" 
            className="h-24 lg:h-80 object-contain mb-4 drop-shadow-lg"
          />
          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Build Your Party Package
          </h1>
          <p className="text-white/90 text-lg drop-shadow-lg mb-4">
            Select from our curated collection of drinks and party supplies
          </p>
        </div>
      </div>

      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        {/* Category Tabs with 5th checkout tab */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-5 gap-1 h-16 sm:h-18">
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
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-foreground'}`} />
                      <div className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepTitle}</div>
                    </div>
                    
                    {/* Desktop layout: side by side */}
                    <div className="hidden sm:flex items-center justify-between w-full px-3">
                      <div className={`font-bold text-2xl ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepNumber}</div>
                      <div className={`font-bold text-lg text-right ${isActive ? 'text-primary' : 'text-foreground'}`}>{stepTitle}</div>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* 5th tab - Cart/Checkout split for mobile and desktop */}
            <div className="sm:hidden flex flex-col h-full">
              <button
                onClick={onOpenCart}
                className="bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40 rounded-t-lg transition-all duration-300 flex justify-center items-center flex-1 p-1"
              >
                <ShoppingCart className="w-4 h-4 text-foreground" />
                {cartItemCount > 0 && (
                  <Badge variant="default" className="text-xs ml-1 bg-primary text-primary-foreground">
                    {cartItemCount}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={onProceedToCheckout}
                disabled={cartItemCount === 0}
                className={`rounded-b-lg transition-all duration-300 flex justify-center items-center flex-1 p-1 ${
                  cartItemCount > 0 
                    ? 'bg-primary/10 border-2 border-primary hover:bg-primary/20' 
                    : 'bg-muted/50 border border-muted-foreground/10 opacity-50 cursor-not-allowed'
                } ${selectedCategory === 3 && cartItemCount > 0 ? 'animate-pulse border-primary/70' : ''}`}
              >
                <div className={`text-xs font-bold ${cartItemCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>Checkout</div>
              </button>
            </div>

            {/* Desktop version remains as grid */}
            <div className="hidden sm:grid grid-cols-2 gap-1 h-full">
              <button
                onClick={onOpenCart}
                className="bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40 rounded-lg transition-all duration-300 flex flex-col justify-center items-center p-1"
              >
                <ShoppingCart className="w-4 h-4 text-foreground mb-1" />
                <div className="text-xs font-bold text-foreground">Cart</div>
                {cartItemCount > 0 && (
                  <Badge variant="default" className="text-xs mt-1 bg-primary text-primary-foreground">
                    {cartItemCount}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={onProceedToCheckout}
                disabled={cartItemCount === 0}
                className={`rounded-lg transition-all duration-300 flex flex-col justify-center items-center p-1 ${
                  cartItemCount > 0 
                    ? 'bg-primary/10 border-2 border-primary hover:bg-primary/20' 
                    : 'bg-muted/50 border border-muted-foreground/10 opacity-50 cursor-not-allowed'
                } ${selectedCategory === 3 && cartItemCount > 0 ? 'animate-pulse border-primary/70' : ''}`}
              >
                <CheckCircle className={`w-4 h-4 mb-1 ${cartItemCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className={`text-xs font-bold ${cartItemCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>Checkout</div>
              </button>
            </div>
          </div>
        </div>

        {/* Section Heading with functional arrows */}
        {selectedCollection && (
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="flex items-center justify-center gap-4">
              {selectedCategory !== 0 && (
                <button
                  onClick={() => selectedCategory > 0 && setSelectedCategory(selectedCategory - 1)}
                  disabled={selectedCategory === 0}
                  className="p-2 rounded-full transition-colors text-primary hover:bg-primary/10 cursor-pointer animate-[pulse_1s_ease-in-out_2]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {selectedCategory === 0 && <div className="w-10"></div>}
              <h2 className="text-foreground text-xl sm:text-2xl font-bold text-center">
                {stepMapping.find(step => step.handle === selectedCollection.handle)?.pageTitle || selectedCollection.title}
              </h2>
              <button
                onClick={() => selectedCategory < stepMapping.length - 1 && setSelectedCategory(selectedCategory + 1)}
                disabled={selectedCategory === stepMapping.length - 1}
                className={`p-2 rounded-full transition-colors ${
                  selectedCategory === stepMapping.length - 1 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'text-primary hover:bg-primary/10 cursor-pointer animate-[pulse_1s_ease-in-out_2]'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Product Grid - smaller tiles for beer section, consistent for others */}
        <div className={`grid gap-1.5 lg:gap-3 ${selectedCategory === 0 ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-3 lg:grid-cols-6'}`}>
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
                {/* Product image - smaller for beer section */}
                <div className={`bg-muted rounded overflow-hidden w-full aspect-square ${selectedCategory === 0 ? 'mb-2' : 'mb-3'}`}>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Product info with smaller height for beer */}
                <div className={`flex flex-col flex-1 justify-between ${selectedCategory === 0 ? 'min-h-[6rem]' : 'min-h-[8rem]'}`}>
                  <div className="flex-1 flex flex-col justify-start">
                    <h4 className={`font-bold leading-tight text-center line-clamp-2 ${selectedCategory === 0 ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
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
                    ) : null}

                      {/* Pack size info for variant products */}
                    {(() => {
                      const packMatch = product.title.match(/(\d+)\s*(?:pk|pack)/i);
                      const sizeMatch = product.title.match(/(\d+)\s*oz/i);
                      if (packMatch && sizeMatch) {
                        return (
                          <p className={`text-foreground text-center mb-1 ${selectedCategory === 0 ? 'text-[10px] leading-3' : 'text-xs'} whitespace-nowrap overflow-hidden text-ellipsis`}>
                            {packMatch[1]}pk × {sizeMatch[1]}oz
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  {/* Price and cart controls container - always at bottom */}
                  <div className="mt-auto pt-1 flex flex-col items-center gap-1">
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
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(product.id, selectedVariant?.id, Math.max(0, cartQty - 1));
                            }}
                          >
                            <Minus size={10} />
                          </Button>
                          <span className="text-xs font-medium px-1.5 min-w-[1.5rem] text-center">
                            {cartQty}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(product.id, selectedVariant?.id, cartQty + 1);
                            }}
                          >
                            <Plus size={10} />
                          </Button>
                        </div>
                       ) : (
                        <button
                          className={`bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors ${selectedCategory === 0 ? 'w-6 h-6' : 'w-8 h-8'}`}
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
                          <Plus size={selectedCategory === 0 ? 12 : 16} />
                        </button>
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