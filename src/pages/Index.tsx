import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Beer, Wine, Package, Star } from 'lucide-react';
import { getAllCollectionsCached } from '@/utils/instantCacheClient';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  products: ShopifyProduct[];
}

const Index = () => {
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await getAllCollectionsCached();
        console.log('Loaded collections:', data?.length);
        if (data && data.length > 0) {
          setCollections(data);
        } else {
          console.log('No collections returned, using fallback');
          // Use a simple fallback with basic categories
          setCollections([
            { id: '1', title: 'Wine & Champagne', handle: 'wine-champagne', products: [] },
            { id: '2', title: 'Beer & Seltzers', handle: 'beer-seltzers', products: [] },
            { id: '3', title: 'Spirits', handle: 'spirits', products: [] },
            { id: '4', title: 'Party Supplies', handle: 'party-supplies', products: [] }
          ]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading collections:', error);
        // Use fallback data
        setCollections([
          { id: '1', title: 'Wine & Champagne', handle: 'wine-champagne', products: [] },
          { id: '2', title: 'Beer & Seltzers', handle: 'beer-seltzers', products: [] },
          { id: '3', title: 'Spirits', handle: 'spirits', products: [] },
          { id: '4', title: 'Party Supplies', handle: 'party-supplies', products: [] }
        ]);
        setIsLoading(false);
      }
    };

    loadCollections();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">🎉 Party On Delivery</h1>
          <p className="text-muted-foreground mb-8">Loading your party essentials...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">🎉 Party On Delivery</h1>
          <p className="text-muted-foreground">No products available at the moment</p>
        </div>
      </div>
    );
  }

  const currentCollection = collections[selectedCategory];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">🎉 Party On Delivery</h1>
        <p className="text-lg opacity-90">Austin's fastest party supply delivery</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm">4.9 • Over 1000+ happy customers</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex overflow-x-auto p-2 gap-2 max-w-4xl mx-auto">
          {collections.slice(0, 6).map((collection, index) => {
            const isActive = selectedCategory === index;
            const IconComponent = index === 0 ? Wine : index === 1 ? Beer : index === 2 ? Package : Package;
            
            return (
              <Button
                key={collection.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setSelectedCategory(index)}
                className="flex-shrink-0 flex items-center gap-2 min-w-max"
              >
                <IconComponent className="w-4 h-4" />
                {collection.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 max-w-6xl mx-auto">
        {currentCollection && (
          <>
            <h2 className="text-2xl font-bold mb-4">{currentCollection.title}</h2>
            {currentCollection.products && currentCollection.products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCollection.products.slice(0, 12).map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <Button size="sm" className="h-8 w-8 p-0">
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Products loading...</h3>
                <p className="text-muted-foreground">
                  Our Shopify API is temporarily rate limited. Products will appear shortly.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;