import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2 } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://lghmqfspgekjnkxefrdc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaG1xZnNwZ2Vram5reGVmcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NzAzNTksImV4cCI6MjA1MzA0NjM1OX0.pjFOGnRDMb5nCtA4m6pAZfFdNhBWKhKq1I2R6Pj_D5w"
);

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

interface ProductCategoriesProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: CartItem[]; // Add this to track individual cart items
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCountAnimation, setCartCountAnimation] = useState(false);

  // Category mapping to collection handles
  const categoryMapping = [
    { title: 'Texas Beer', handle: 'texas-beer', icon: Beer, color: 'bg-amber-500' },
    { title: 'Seltzer Collection', handle: 'seltzer-collection', icon: Martini, color: 'bg-blue-500' },
    { title: 'Lake Package Items', handle: 'lake-package-items', icon: Package, color: 'bg-green-500' },
    { title: 'Cocktail Collection', handle: 'cocktail-collection-all', icon: Martini, color: 'bg-pink-500' }
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      console.log('Fetching Shopify collections...');
      
      const SHOPIFY_STORE = "premier-concierge.myshopify.com";
      // Updated with correct Storefront Access Token
      const SHOPIFY_API_KEY = "a49fa69332729e9f8329ad8caacc37ba";
      
      // Define the 4 collections for the order steps
      const targetCollections = [
        "texas-beer",
        "seltzer-collection", 
        "lake-package-items",
        "cocktail-collection-all"
      ];

      const allCollections = [];

      // Fetch each collection directly from Shopify
      for (const handle of targetCollections) {
        console.log(`Fetching collection: ${handle}`);
        
        const query = `
          query getCollectionByHandle($handle: String!) {
            collectionByHandle(handle: $handle) {
              id
              title
              handle
              description
              products(first: 20) {
                edges {
                  node {
                    id
                    title
                    handle
                    description
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                    variants(first: 5) {
                      edges {
                        node {
                          id
                          title
                          price {
                            amount
                            currencyCode
                          }
                          availableForSale
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        try {
          const response = await fetch(`https://${SHOPIFY_STORE}/api/2024-10/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              query,
              variables: { handle }
            }),
          });

          console.log(`Response for ${handle}:`, response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Data for ${handle}:`, data);
            
            if (data.data?.collectionByHandle) {
              const collection = data.data.collectionByHandle;
              
              // Transform products
              const products = collection.products.edges.map(({ node: product }) => {
                const variant = product.variants.edges[0]?.node;
                const image = product.images.edges[0]?.node;
                
                return {
                  id: product.id,
                  title: product.title,
                  price: variant ? parseFloat(variant.price.amount) : 0,
                  image: image?.url || '/placeholder.svg',
                  description: product.description,
                  handle: product.handle,
                  variants: product.variants.edges.map(({ node: v }) => ({
                    id: v.id,
                    title: v.title,
                    price: parseFloat(v.price.amount),
                    available: v.availableForSale
                  }))
                };
              });

              allCollections.push({
                id: collection.id,
                title: collection.title,
                handle: collection.handle,
                description: collection.description,
                products
              });
               
              console.log(`Added collection: ${collection.title} with ${products.length} products`);
            } else {
              console.log(`No collection found for handle: ${handle}`);
            }
          } else {
            const errorData = await response.text();
            console.error(`Error fetching ${handle}:`, response.status, response.statusText, errorData);
            
            // Show specific error for authentication issues
            if (response.status === 401) {
              console.error(`Authentication failed for ${handle}. The token may be invalid or not a Storefront Access Token.`);
            }
          }
        } catch (fetchError) {
          console.error(`Fetch error for ${handle}:`, fetchError);
        }
      }
      
      console.log('All collections loaded:', allCollections);
      setCollections(allCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCollection = collections[selectedCategory];

  // Helper to get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantTitle?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantTitle
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
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant?.title
    });
  };

  const handleQuantityChange = (productId: string, variantTitle: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantTitle);
    const newQty = Math.max(0, currentQty + delta);
    onUpdateQuantity(productId, variantTitle, newQty);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header with Cart */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Choose Your Products
            </h1>
            
            <Button 
              variant="default" 
              size="lg"
              onClick={onOpenCart}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartItemCount > 0 && (
                <Badge 
                  className={`absolute -top-2 -right-2 bg-accent text-accent-foreground min-w-[24px] h-6 rounded-full text-xs font-bold transition-all duration-300 ${
                    cartCountAnimation ? 'animate-pulse scale-125' : ''
                  }`}
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Sticky Category Navigation */}
        <div className="border-t bg-background/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryMapping.map((category, index) => {
                const Icon = category.icon;
                const isActive = selectedCategory === index;
                
                return (
                  <Button
                    key={category.handle}
                    variant={isActive ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedCategory(index)}
                    className="h-16 flex-col gap-2"
                  >
                    <div className={`w-6 h-6 rounded-full ${category.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs">{category.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pt-8">
        {/* Collection Info */}
        {selectedCollection && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedCollection.title}
              </CardTitle>
              <CardDescription>{selectedCollection.description}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Products Grid - 5 items per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {selectedCollection?.products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="aspect-square bg-muted relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {product.description}
                  </p>
                </div>
                
                {/* Variants */}
                {product.variants.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Options:</p>
                    <div className="space-y-2">
                      {product.variants.slice(0, 3).map((variant) => {
                        const cartQty = getCartItemQuantity(product.id, variant.title);
                        
                        return (
                          <div key={variant.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{variant.title}</span>
                              <Badge variant="secondary">
                                ${variant.price.toFixed(2)}
                              </Badge>
                            </div>
                            
                            {cartQty > 0 ? (
                              <div className="flex items-center gap-1 bg-muted rounded-md">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(product.id, variant.title, -1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-2 text-sm font-medium">{cartQty} added</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(product.id, variant.title, 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleAddToCart(product, variant)}
                                size="sm"
                                disabled={!variant.available}
                                className="gap-1"
                              >
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      ${product.price.toFixed(2)}
                    </Badge>
                    
                    {(() => {
                      const cartQty = getCartItemQuantity(product.id, undefined);
                      
                      return cartQty > 0 ? (
                        <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantityChange(product.id, undefined, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-2 text-sm font-medium flex-1 text-center">
                            {cartQty} added
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantityChange(product.id, undefined, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="lg"
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
      </div>
    </div>
  );
};