import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface SimpleDeliveryAppProps {
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  collectionsConfig?: any;
}

export const SimpleDeliveryApp: React.FC<SimpleDeliveryAppProps> = ({
  appName,
  heroHeading,
  heroSubheading,
  logoUrl,
  collectionsConfig
}) => {
  const navigate = useNavigate();
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  // Simple product loading - no complex hooks
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🏠 SimpleDeliveryApp: Loading products...');
        
        // Simple static products to get the app working
        const sampleProducts = [
          {
            id: 'sample-1',
            title: 'Party Pack Beer',
            price: 29.99,
            image: '',
            variants: [{ id: 'var-1', price: 29.99 }]
          },
          {
            id: 'sample-2', 
            title: 'Premium Seltzers',
            price: 24.99,
            image: '',
            variants: [{ id: 'var-2', price: 24.99 }]
          },
          {
            id: 'sample-3',
            title: 'Cocktail Kit',
            price: 49.99,
            image: '',
            variants: [{ id: 'var-3', price: 49.99 }]
          }
        ];
        
        setProducts(sampleProducts);
        console.log('✅ SimpleDeliveryApp: Products loaded');
      } catch (error) {
        console.error('❌ SimpleDeliveryApp: Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.id || 'default'
    };
    
    console.log('🛒 Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const variantId = product.variants?.[0]?.id || 'default';
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    
    const cartItem = {
      id: productId,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: variantId
    };
    
    updateQuantity(productId, variantId, newQty, cartItem);
  };

  const tabs = collectionsConfig?.tabs || [
    { name: 'Beer', collection_handle: 'beer' },
    { name: 'Seltzers', collection_handle: 'seltzers' },
    { name: 'Cocktails', collection_handle: 'cocktails' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-foreground text-white py-16">
        <div className="container mx-auto px-4 text-center">
          {logoUrl && (
            <img src={logoUrl} alt={appName} className="h-16 mx-auto mb-6" />
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {heroHeading}
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            {heroSubheading}
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

      {/* Simple Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab, index) => (
            <Button
              key={index}
              variant={selectedTab === index ? "default" : "outline"}
              onClick={() => setSelectedTab(index)}
            >
              {tab.name}
            </Button>
          ))}
        </div>

        {/* Simple Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id || 'default');
              
              return (
                <div key={product.id} className="bg-card rounded-lg p-6 border">
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-muted-foreground">Product Image</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">
                    ${product.price}
                  </p>
                  
                  {quantity === 0 ? (
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="font-semibold">{quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, 1)}
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

        {/* Admin & Checkout Buttons */}
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            size="sm"
          >
            Admin
          </Button>
          
          <Button
            onClick={() => navigate('/checkout')}
            size="sm"
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Cart Sidebar */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};