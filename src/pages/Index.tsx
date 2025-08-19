import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

const Index = () => {
  console.log('🚨 HOMEPAGE BULLETPROOF v3: Starting load...');
  
  const navigate = useNavigate();
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const loadEverything = async () => {
      try {
        console.log('🚨 STEP 1: Starting database query...');
        
        // Use maybeSingle() to avoid errors when no data found
        const { data: homepageApp, error: homepageError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .eq('is_homepage', true)
          .maybeSingle();

        console.log('🚨 STEP 2: Homepage query result:', { homepageApp, homepageError });

        let finalConfig = null;

        if (homepageError) {
          console.error('🚨 HOMEPAGE ERROR:', homepageError);
          throw homepageError;
        }

        if (!homepageApp) {
          console.log('🚨 STEP 3: No homepage app found, getting fallback...');
          
          const { data: fallbackApps, error: fallbackError } = await supabase
            .from('delivery_app_variations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
          
          console.log('🚨 STEP 4: Fallback query result:', { fallbackApps, fallbackError });
            
          if (fallbackError) {
            console.error('🚨 FALLBACK ERROR:', fallbackError);
            throw fallbackError;
          }

          if (!fallbackApps || fallbackApps.length === 0) {
            throw new Error('No delivery apps found in database');
          }
          
          finalConfig = fallbackApps[0];
          console.log('🚨 STEP 5: Using fallback app:', finalConfig.app_name);
        } else {
          finalConfig = homepageApp;
          console.log('🚨 STEP 5: Using homepage app:', finalConfig.app_name);
        }
        
        console.log('🚨 STEP 6: Final config loaded:', finalConfig);
        setAppConfig(finalConfig);
        
      } catch (err: any) {
        console.error('🚨 FATAL ERROR in loadEverything:', err);
        console.error('🚨 ERROR DETAILS:', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
        setError(`Database error: ${err?.message || 'Unknown error'}`);
      } finally {
        console.log('🚨 STEP 7: Setting loading to false');
        setLoading(false);
      }
    };

    loadEverything();
  }, []);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: 'sample-beer',
      title: 'Party Pack Beer',
      name: 'Party Pack Beer', 
      price: 29.99,
      image: '',
      variant: 'default'
    };
    
    console.log('🛒 Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  // Show loading
  if (loading) {
    console.log('🚨 RENDERING: Loading state');
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

  // Show error
  if (error) {
    console.log('🚨 RENDERING: Error state -', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-lg font-semibold text-destructive">Database Error</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>
            <Button onClick={() => navigate('/admin')} variant="outline" className="w-full">
              Go to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show missing config
  if (!appConfig) {
    console.log('🚨 RENDERING: No config state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">No Store Configuration</h3>
          <p className="text-muted-foreground">No delivery apps are configured</p>
          <Button onClick={() => navigate('/admin')}>
            Set Up Store
          </Button>
        </div>
      </div>
    );
  }

  // SUCCESS - Render the store
  console.log('🚨 RENDERING: Success state with config:', appConfig.app_name);
  
  const quantity = getCartItemQuantity('sample-beer', 'default');
  
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          {appConfig.logo_url && (
            <img src={appConfig.logo_url} alt={appConfig.app_name} className="h-16 mx-auto mb-6" />
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {appConfig.main_app_config?.hero_heading || appConfig.app_name}
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            {appConfig.main_app_config?.hero_subheading || "Austin's Premier Party Supply Delivery"}
          </p>
          
          <Button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-3"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({getTotalItems()})
          </Button>
        </div>
      </div>

      {/* Simple Product Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Sample Products */}
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">🍺 Beer</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Party Pack Beer</h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">$29.99</p>
            
            {quantity === 0 ? (
              <Button onClick={handleAddToCart} className="w-full">
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity('sample-beer', 'default', quantity - 1, {
                    id: 'sample-beer',
                    title: 'Party Pack Beer',
                    name: 'Party Pack Beer',
                    price: 29.99,
                    image: '',
                    variant: 'default'
                  })}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-lg">{quantity}</span>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => updateQuantity('sample-beer', 'default', quantity + 1, {
                    id: 'sample-beer',
                    title: 'Party Pack Beer', 
                    name: 'Party Pack Beer',
                    price: 29.99,
                    image: '',
                    variant: 'default'
                  })}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">🥤 Seltzers</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Premium Seltzers</h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">$24.99</p>
            <Button variant="outline" className="w-full">Add to Cart</Button>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">🍸 Cocktails</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Cocktail Kit</h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">$49.99</p>
            <Button variant="outline" className="w-full">Add to Cart</Button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Store successfully loaded: {appConfig.app_name}</p>
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