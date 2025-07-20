import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CocktailLightbox } from './CocktailLightbox';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface CartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

interface ProductCategoriesProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  onCheckout: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const ProductCategories = ({ onAddToCart, onCheckout, getTotalItems, getTotalPrice }: ProductCategoriesProps) => {
  const [cocktailProducts, setCocktailProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchCocktailProducts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-shopify-products', {
          body: { 
            handles: ['cocktail-kits']
          }
        });

        if (error) {
          console.error('Error fetching cocktail products:', error);
          return;
        }

        if (data?.collections && data.collections.length > 0) {
          // Extract products from the cocktail-kits collection
          const cocktailCollection = data.collections.find((c: any) => c.handle === 'cocktail-kits');
          if (cocktailCollection?.products) {
            setCocktailProducts(cocktailCollection.products);
          }
        }
      } catch (error) {
        console.error('Error fetching cocktail products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCocktailProducts();
  }, []);

  const formatPrice = (price: number) => {
    return isNaN(price) ? 0 : price;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product, selectedVariant?: { id: string; title: string; price: number }) => {
    const variant = selectedVariant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    const price = variant ? formatPrice(variant.price) : formatPrice(product.price);
    
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: price,
      image: product.image || '/placeholder.svg',
      variant: variant?.title
    };
    
    onAddToCart(cartItem);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cocktail kits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-20 lg:pb-0">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Austin's Best Cocktail Kits
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Premium cocktail kits with all ingredients included - delivered to your door
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cocktailProducts.map((product) => (
            <div
              key={product.id}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => handleProductClick(product)}
            >
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-floating overflow-hidden border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {product.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz')}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                    ${formatPrice(product.variants?.[0]?.price || product.price).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cocktailProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cocktail kits available at the moment.</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart/Checkout Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 lg:hidden z-50">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {/* Cart functionality if needed */}}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart ({getTotalItems()})</span>
          </Button>
          {getTotalItems() > 0 && (
            <Button
              onClick={onCheckout}
              className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
            >
              Checkout ${getTotalPrice().toFixed(2)}
            </Button>
          )}
        </div>
      </div>

      {/* Product Lightbox */}
      {selectedProduct && (
        <CocktailLightbox
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default ProductCategories;