import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Beer, Wine, Package } from 'lucide-react';
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
    const loadProducts = async () => {
      try {
        const data = await getAllCollectionsCached();
        setCollections(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Party On Delivery</h1>
          <p className="text-muted-foreground">Loading your party essentials...</p>
          <div className="mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentCollection = collections[selectedCategory];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Party On Delivery</h1>
        <p className="text-lg">Austin's fastest party supply delivery</p>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex overflow-x-auto p-2 gap-2">
          {collections.slice(0, 4).map((collection, index) => {
            const isActive = selectedCategory === index;
            const IconComponent = index === 0 ? Wine : index === 1 ? Beer : index === 2 ? Package : Package;
            
            return (
              <Button
                key={collection.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setSelectedCategory(index)}
                className="flex-shrink-0 flex items-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {collection.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {currentCollection && (
          <>
            <h2 className="text-2xl font-bold mb-4">{currentCollection.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentCollection.products?.slice(0, 12).map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
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
          </>
        )}
      </div>
    </div>
  );
};

export default Index;