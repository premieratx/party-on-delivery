import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Plus, Minus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { Input } from '@/components/ui/input';

interface CustomProductCategoriesProps {
  onAddToCart: (item: any) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: any[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
  collectionsConfig: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  appName: string;
}

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

export function CustomProductCategories({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  collectionsConfig,
  appName
}: CustomProductCategoriesProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching collections for custom app...');
      
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error fetching collections:', error);
        throw error;
      }

      if (!data?.collections) {
        throw new Error('No collections received from Shopify');
      }

      // Filter collections based on app configuration
      const relevantCollections = data.collections.filter((collection: any) =>
        collectionsConfig.tabs.some(tab => tab.collection_handle === collection.handle)
      );

      // Reorder collections to match tab configuration
      const orderedCollections = collectionsConfig.tabs.map(tab => {
        const collection = relevantCollections.find((c: any) => c.handle === tab.collection_handle);
        return collection || null;
      }).filter(Boolean);

      setCollections(orderedCollections);
      
    } catch (error) {
      console.error('Error in fetchCollections:', error);
      setError(`Failed to load collections: ${error.message}`);
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

  const handleAddToCart = (product: ShopifyProduct) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants[0]?.id
    };
    
    onAddToCart(cartItem);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    onUpdateQuantity(productId, variantId, newQty);
  };

  // Filter products based on search term
  const filteredProducts = selectedCollection?.products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {appName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCollections} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{appName}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedCollection?.title || 'Loading...'}
              </p>
            </div>
            {cartItemCount > 0 && (
              <Button onClick={onOpenCart} variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cartItemCount})
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {collectionsConfig.tabs.map((tab, index) => (
              <Button
                key={index}
                variant={selectedCategory === index ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(index)}
                className="shrink-0"
              >
                {tab.icon} {tab.name}
              </Button>
            ))}
            
            {/* Shared App Buttons */}
            <Button 
              onClick={() => navigate('/search')}
              variant="outline" 
              className="shrink-0 ml-auto flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button 
              onClick={() => navigate('/plan-my-party')}
              variant="outline"
              className="shrink-0 flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Party
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getCartItemQuantity(product.id, product.variants[0]?.id)}
                onAddToCart={() => handleAddToCart(product)}
                onUpdateQuantity={(delta) => handleQuantityChange(product.id, product.variants[0]?.id, delta)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      {onBack && (
        <div className="fixed bottom-20 left-4">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: ShopifyProduct;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
}

function ProductCard({ product, quantity, onAddToCart, onUpdateQuantity }: ProductCardProps) {
  const optimizedImage = useImageOptimization(product.image, false);
  const { cleanTitle, packageSize } = parseProductTitle(product.title);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="flex flex-col h-full p-3">
        {/* Product Image */}
        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
          <OptimizedImage
            src={optimizedImage.src}
            alt={product.title}
            className="w-full h-full object-cover"
            priority={false}
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium line-clamp-2 mb-1 text-sm">
            {cleanTitle}
          </h3>
          {packageSize && (
            <p className="text-xs text-muted-foreground mb-2">
              {packageSize}
            </p>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-primary text-lg">
                ${product.price.toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              )}
            </div>

            {/* Quantity Controls */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-1 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className="p-0 h-8 w-8 flex-shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[20px] text-center flex-1 text-base">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className="p-0 h-8 w-8 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAddToCart}
                className="w-full h-9 text-sm"
                size="default"
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}