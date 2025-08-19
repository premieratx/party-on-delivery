import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface RealProductLoaderProps {
  appConfig: any;
  onCartOpen: () => void;
}

export const RealProductLoader = ({ appConfig, onCartOpen }: RealProductLoaderProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();

  useEffect(() => {
    loadRealProducts();
  }, [appConfig]);

  const loadRealProducts = async () => {
    try {
      console.log('🛍️ Loading real products for app:', appConfig.app_name);
      setLoading(true);
      setError(null);

      // Get collection handles from the app config
      const collections = appConfig.collections_config?.tabs || [];
      console.log('📦 Collections configured:', collections);

      if (collections.length === 0) {
        console.log('⚠️ No collections configured, showing sample products');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get the first few collection handles to load products from
      const collectionHandles = collections.slice(0, 3).map((tab: any) => tab.collection_handle);
      console.log('🎯 Loading products from collections:', collectionHandles);

      // Query products from these collections - use array overlap operator
      const { data: productData, error: productError } = await supabase
        .from('shopify_products_cache')
        .select('*')
        .overlaps('collection_handles', collectionHandles)
        .limit(6);

      if (productError) {
        console.error('❌ Product query error:', productError);
        throw productError;
      }

      console.log('✅ Loaded products:', productData?.length || 0);
      setProducts(productData || []);

    } catch (err: any) {
      console.error('❌ Failed to load products:', err);
      setError(err.message);
    } finally {
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
    
    console.log('🛒 Adding real product to cart:', cartItem);
    addToCart(cartItem);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-destructive">Error loading products: {error}</p>
          <Button onClick={loadRealProducts} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <Button onClick={onCartOpen} variant="outline">
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart
        </Button>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products available yet</p>
          <p className="text-sm text-muted-foreground">Products will appear here once they're synced from Shopify</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => {
            const quantity = getCartItemQuantity(product.handle || product.id, 'default');
            const price = product.price || product.variants?.[0]?.price || 0;
            const image = product.image || product.image_url;

            return (
              <div key={product.id} className="bg-card rounded-lg border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
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
                  ) : (
                    <span className="text-muted-foreground">📦 {product.title}</span>
                  )}
                  <div className="hidden text-muted-foreground">📦 {product.title}</div>
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

      {products.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Real products from: {appConfig.app_name}</p>
          <p className="text-sm text-muted-foreground">
            Showing products from collections: {appConfig.collections_config?.tabs?.slice(0, 3).map((tab: any) => tab.name).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};