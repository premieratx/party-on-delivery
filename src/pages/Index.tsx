import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

const Index = () => {
  console.log('🚀 HOMEPAGE v4: ULTRA SIMPLE - Starting...');
  
  const navigate = useNavigate();
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  
  // State for app config and products
  const [appConfig, setAppConfig] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      console.log('📋 STEP 1: Loading delivery app config...');
      setLoading(true);
      setError(null);

      // Load the main delivery app config
      const { data: homepageApp, error: configError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true)
        .eq('is_homepage', true)
        .maybeSingle();

      console.log('📋 STEP 2: Config result:', { homepageApp, configError });

      if (configError) {
        throw new Error(`Config error: ${configError.message}`);
      }

      let finalConfig = homepageApp;
      if (!homepageApp) {
        console.log('📋 STEP 3: No homepage app, getting fallback...');
        const { data: fallbackApps, error: fallbackError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1);

        if (fallbackError) {
          throw new Error(`Fallback error: ${fallbackError.message}`);
        }

        if (!fallbackApps || fallbackApps.length === 0) {
          throw new Error('No delivery apps found in database');
        }

        finalConfig = fallbackApps[0];
      }

      console.log('📋 STEP 4: Using config:', finalConfig.app_name);
      setAppConfig(finalConfig);

      // Load products from the configured collections
      console.log('🛍️ STEP 5: Loading products...');
      const collectionsConfig = finalConfig.collections_config as any;
      const collections = collectionsConfig?.tabs || [];
      
      if (collections.length > 0) {
        const collectionHandles = collections.slice(0, 3).map((tab: any) => tab.collection_handle);
        console.log('🛍️ STEP 6: Loading from collections:', collectionHandles);

        const { data: productData, error: productError } = await supabase
          .from('shopify_products_cache')
          .select('*')
          .overlaps('collection_handles', collectionHandles)
          .limit(6);

        if (productError) {
          console.error('❌ Product error:', productError);
          // Don't fail the whole page for product errors, just show empty products
          setProducts([]);
        } else {
          console.log('✅ Loaded products:', productData?.length || 0);
          setProducts(productData || []);
        }
      } else {
        console.log('⚠️ No collections configured');
        setProducts([]);
      }

    } catch (err: any) {
      console.error('💥 FATAL ERROR:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      console.log('🏁 STEP 7: Loading complete');
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.handle || product.id,
      title: product.title,
      name: product.title,
      price: product.price || (product.variants?.[0]?.price || 0),
      image: product.image || product.image_url || '',
      variant: 'default'
    };
    
    console.log('🛒 Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  // LOADING STATE
  if (loading) {
    console.log('⏳ RENDERING: Loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading Store</h3>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    console.log('❌ RENDERING: Error -', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-lg font-semibold text-destructive">Error Loading Store</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>
            <Button onClick={() => navigate('/admin')} variant="outline" className="w-full">
              Admin Panel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // NO CONFIG STATE
  if (!appConfig) {
    console.log('⚠️ RENDERING: No config');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">No Store Configuration</h3>
          <p className="text-muted-foreground">Store not configured yet</p>
          <Button onClick={() => navigate('/admin')}>Admin Panel</Button>
        </div>
      </div>
    );
  }

  // SUCCESS STATE - RENDER THE STORE
  console.log('✅ RENDERING: Success with', products.length, 'products');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          {appConfig.logo_url && (
            <img 
              src={appConfig.logo_url} 
              alt={appConfig.app_name} 
              className="h-16 mx-auto mb-6"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {appConfig.main_app_config?.hero_heading || appConfig.app_name}
          </h1>
          <p className="text-xl opacity-90 mb-6">
            {appConfig.main_app_config?.hero_subheading || "Premium Delivery Service"}
          </p>
          
          <Button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-3"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({getTotalItems()})
          </Button>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Button onClick={() => setIsCartOpen(true)} variant="outline">
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({getTotalItems()})
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products available</p>
            <p className="text-sm text-muted-foreground">Products will appear here once configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {products.map((product) => {
              const quantity = getCartItemQuantity(product.handle || product.id, 'default');
              const price = product.price || product.variants?.[0]?.price || 0;
              const image = product.image || product.image_url;

              return (
                <div key={product.id} className="bg-card rounded-lg border p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                    {image ? (
                      <img 
                        src={image} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${image ? 'hidden' : ''} text-muted-foreground`}>
                      📦 {product.title}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">${price}</p>
                  
                  {quantity === 0 ? (
                    <Button onClick={() => handleAddToCart(product)} className="w-full">
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.handle || product.id, 'default', quantity - 1, {
                          id: product.handle || product.id,
                          title: product.title,
                          name: product.title,
                          price: price,
                          image: image || '',
                          variant: 'default'
                        })}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-lg">{quantity}</span>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuantity(product.handle || product.id, 'default', quantity + 1, {
                          id: product.handle || product.id,
                          title: product.title,
                          name: product.title,
                          price: price,
                          image: image || '',
                          variant: 'default'
                        })}
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

        {/* Store Info & Admin Access */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            Store: {appConfig.app_name} • {products.length} products loaded
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/admin')} variant="outline">
              Admin Panel
            </Button>
            {getTotalItems() > 0 && (
              <Button onClick={() => navigate('/checkout')}>
                Checkout ({getTotalItems()} items)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <UnifiedCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Index;