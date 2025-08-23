import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DirectDeliveryAppProps {
  appConfig: any;
}

export const DirectDeliveryApp: React.FC<DirectDeliveryAppProps> = ({ appConfig }) => {
  const navigate = useNavigate();
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tabs directly from delivery app config - NO PROCESSING
  const tabs = appConfig?.collections_config?.tabs || [];

  console.log('🚀 DirectDeliveryApp: Using tabs directly from config:', tabs);

  // Load products for current tab's Shopify collection
  useEffect(() => {
    const loadProducts = async () => {
      if (tabs.length === 0) {
        console.log('❌ No tabs configured');
        setLoading(false);
        return;
      }

      const currentTab = tabs[selectedTab];
      if (!currentTab?.collection_handle) {
        console.log('❌ No collection handle for current tab');
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🛍️ Loading Shopify collection: ${currentTab.collection_handle}`);

        // Direct Shopify collection query - NO RE-CATEGORIZATION
        const { data: response, error: functionError } = await supabase.functions.invoke('optimized-product-loader', {
          body: { 
            collection_handle: currentTab.collection_handle,
            use_type: 'delivery'
          }
        });

        if (functionError) throw functionError;

        const productData = response?.products || [];
        console.log(`✅ Loaded ${productData.length} products from ${currentTab.collection_handle}`);
        
        setProducts(productData);
      } catch (err: any) {
        console.error('❌ Error loading products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedTab, tabs]);

  const handleAddToCart = (product: any) => {
    const variant = product.variants?.[0];
    const cartItem = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: variant?.price || product.price || 0,
      image: product.image || product.featured_image || '',
      variant: variant?.id ? String(variant.id) : 'default'
    };
    
    console.log('🛒 Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  const handleQuantityChange = (product: any, delta: number) => {
    const variant = product.variants?.[0];
    const productId = String(product.id);
    const variantId = variant?.id ? String(variant.id) : 'default';
    
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    
    const cartItem = {
      id: productId,
      title: product.title,
      name: product.title,
      price: variant?.price || product.price || 0,
      image: product.image || product.featured_image || '',
      variant: variantId
    };
    
    updateQuantity(productId, variantId, newQty, cartItem);
  };

  const getProductQuantity = (product: any) => {
    const variant = product.variants?.[0];
    const productId = String(product.id);
    const variantId = variant?.id ? String(variant.id) : 'default';
    return getCartItemQuantity(productId, variantId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIMPLE Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          {appConfig.logo_url && (
            <img 
              src={appConfig.logo_url} 
              alt={appConfig.app_name} 
              className="h-16 mx-auto mb-6" 
            />
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {appConfig.main_app_config?.hero_heading || appConfig.app_name}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-6">
            {appConfig.main_app_config?.hero_subheading || "Satisfaction Guaranteed, On-Time Delivery"}
          </p>
          
          {/* Cart Button */}
          <Button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-primary hover:bg-white/90"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({getTotalItems()})
          </Button>
        </div>
      </div>

      {/* Mobile-Optimized Tab Navigation */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {tabs.length > 0 && (
          <div className="mb-4 sm:mb-8 border-b pb-2 sm:pb-4">
            {/* Mobile: Horizontal scrollable tabs */}
            <div className="flex overflow-x-auto gap-1 sm:gap-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
              {tabs.map((tab: any, index: number) => (
                <Button
                  key={tab.collection_handle || index}
                  variant={selectedTab === index ? "default" : "outline"}
                  onClick={() => setSelectedTab(index)}
                  className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 whitespace-nowrap"
                >
                  {tab.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Product Display */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="mt-4 text-muted-foreground">
              Loading {tabs[selectedTab]?.name} products...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {products.map((product) => {
              const quantity = getProductQuantity(product);
              const variant = product.variants?.[0];
              const price = variant?.price || product.price || 0;
              
              return (
                <div key={product.id} className="bg-card rounded-lg border p-2 sm:p-4 hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="aspect-square bg-muted rounded-lg mb-2 sm:mb-4 overflow-hidden">
                    {product.image || product.featured_image ? (
                      <img 
                        src={product.image || product.featured_image} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-semibold mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm">{product.title}</h3>
                  <p className="text-lg sm:text-2xl font-bold text-primary mb-2 sm:mb-4">
                    ${typeof price === 'number' ? price.toFixed(2) : price}
                  </p>
                  
                  {/* Add to Cart / Quantity Controls */}
                  {quantity === 0 ? (
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full text-xs sm:text-sm h-8 sm:h-10"
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(product, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="font-semibold px-4">{quantity}</span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(product, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm"
        >
          Admin
        </Button>
        
        {getTotalItems() > 0 && (
          <Button
            onClick={() => navigate('/checkout')}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            Checkout ({getTotalItems()})
          </Button>
        )}
      </div>

      {/* Cart Sidebar */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};