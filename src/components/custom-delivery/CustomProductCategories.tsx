import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft, CheckCircle, Wine, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomCartItem } from './CustomDeliveryAppWidget';
import { ProductLightbox } from '../delivery/ProductLightbox';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { parseProductTitle } from '@/utils/productUtils';
import { SearchIcon } from '@/components/common/SearchIcon';
import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';
import spiritsCategoryBg from '@/assets/spirits-category-bg.jpg';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

interface ShopifyProduct {
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

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
}

interface CustomProductCategoriesProps {
  onAddToCart: (item: Omit<CustomCartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: any[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack: () => void;
  onBackToStart: () => void;
}

export const CustomProductCategories: React.FC<CustomProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onBackToStart
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('spirits');
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Custom delivery app categories - similar to main app but potentially different selection
  const categories = [
    { 
      id: 'spirits', 
      name: 'Premium Spirits', 
      icon: Martini, 
      count: 0, 
      description: 'Top-shelf liquor selection',
      image: spiritsCategoryBg
    },
    { 
      id: 'beer', 
      name: 'Craft Beer', 
      icon: Beer, 
      count: 0, 
      description: 'Local and imported brews',
      image: beerCategoryBg
    },
    { 
      id: 'wine', 
      name: 'Fine Wine', 
      icon: Wine, 
      count: 0, 
      description: 'Curated wine collection',
      image: cocktailCategoryBg
    },
    { 
      id: 'party-supplies', 
      name: 'Party Essentials', 
      icon: Package, 
      count: 0, 
      description: 'Everything for your event',
      image: partySuppliesCategoryBg
    }
  ];

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      console.log('⚡ Custom Delivery App: Loading with instant cache...');

      // Load from instant cache
      const { data, error } = await supabase.functions.invoke('instant-product-cache');
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const instantData = data.data;
        
        // Extract collections from the instant cache data structure
        let loadedCollections: ShopifyCollection[] = [];
        
        if (instantData.collections && Array.isArray(instantData.collections)) {
          loadedCollections = instantData.collections;
          console.log(`✅ Custom Delivery App: Loaded ${loadedCollections.length} collections from instant cache`);
        } else {
          console.warn('⚠️ No collections found in instant cache data');
        }
        
        setCollections(loadedCollections);
        
        // Debug: Log collection handles and categories
        console.log('📋 Available collections:', loadedCollections.map(c => ({
          handle: c.handle,
          title: c.title,
          category: mapCollectionToCategory(c.handle),
          productCount: c.products?.length || 0
        })));
        
      } else {
        console.error('❌ Failed to load from instant cache:', data);
        setCollections([]);
      }
    } catch (error) {
      console.error('Custom Delivery App: Error loading collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  // Map collection handles to categories - custom mapping for this app
  const mapCollectionToCategory = (handle: string): string => {
    // Premium Spirits
    if (handle === 'spirits' || handle === 'gin-rum' || handle === 'tequila-mezcal' || handle === 'whiskey') return 'spirits';
    // Craft Beer
    if (handle === 'tailgate-beer' || handle === 'texas-beer-collection' || handle.includes('beer')) return 'beer';
    // Fine Wine
    if (handle === 'champagne' || handle.includes('wine')) return 'wine';
    // Party Essentials
    if (handle === 'party-supplies' || handle === 'decorations' || handle === 'hats-sunglasses' || handle === 'costumes') return 'party-supplies';
    
    return 'other';
  };

  // Filter collections by active category
  const filteredCollections = collections.filter(collection => {
    const category = mapCollectionToCategory(collection.handle);
    return category === activeCategory;
  });

  // Get all products from filtered collections
  const allProducts = filteredCollections.flatMap(collection => 
    collection.products.map(product => ({
      ...product,
      collectionId: collection.id,
      collectionHandle: collection.handle
    }))
  );

  // Filter products by search term
  const searchFilteredProducts = searchTerm 
    ? allProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allProducts;

  const getCartQuantity = (productId: string, variant?: string): number => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variant || 'default';
      return itemId === productId && itemVariant === checkVariant;
    });
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const selectedVariant = selectedVariants[product.id];
    const variant = product.variants.find(v => v.id === selectedVariant) || product.variants[0];
    
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant.price,
      image: product.image,
      variant: variant.id
    };

    console.log('🛒 CustomProductCategories: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = getCartQuantity(product.id, variant.id);
    
    onUpdateQuantity(product.id, variant.id, currentQty + 1);
    
    // Show feedback
    import('@/hooks/use-toast').then(({ useToast }) => {
      const { toast } = useToast();
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    });
  };

  const handleUpdateQuantity = (productId: string, change: number, variant?: string) => {
    const currentQuantity = getCartQuantity(productId, variant);
    const newQuantity = Math.max(0, currentQuantity + change);
    onUpdateQuantity(productId, variant, newQuantity);
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <img 
                src={partyOnDeliveryLogo} 
                alt="Party on Delivery" 
                className="h-6 w-auto object-contain"
              />
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">Custom Delivery</h1>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearchModal(true)}
              className="p-2"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-30">
        <div className="max-w-md mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {categories.map((category) => {
              const categoryProducts = collections
                .filter(collection => mapCollectionToCategory(collection.handle) === category.id)
                .flatMap(collection => collection.products);
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory === category.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    {categoryProducts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {categoryProducts.length}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : searchFilteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching products found' : 'No products available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Products will appear here when available'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchFilteredProducts.map((product) => {
              const selectedVariant = selectedVariants[product.id] || product.variants[0]?.id;
              const variant = product.variants.find(v => v.id === selectedVariant) || product.variants[0];
              const cartQuantity = getCartQuantity(product.id, variant?.id);
              
              return (
                <Card key={`${product.id}-${selectedVariant}`} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex p-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 ml-4">
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-5">
                          {product.title}
                        </h3>
                        
                        <div className="mt-2">
                          <span className="text-lg font-bold text-purple-600">
                            ${variant?.price?.toFixed(2) || '0.00'}
                          </span>
                        </div>

                        {/* Variant Selector */}
                        {product.variants.length > 1 && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={selectedVariant}
                              onValueChange={(value) => handleVariantChange(product.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {product.variants.map((variant) => (
                                  <SelectItem key={variant.id} value={variant.id}>
                                    {variant.title} - ${variant.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Controls */}
                  <div className="px-4 pb-4">
                    {cartQuantity === 0 ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between bg-purple-50 rounded-lg p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(product.id, -1, variant?.id);
                          }}
                          className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-100"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <span className="font-medium text-purple-700 min-w-[2rem] text-center">
                          {cartQuantity}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(product.id, 1, variant?.id);
                          }}
                          className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Lightbox */}
      {selectedProduct && (
        <ProductLightbox
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          selectedVariant={selectedProduct.variants.find(v => v.id === selectedVariants[selectedProduct.id]) || selectedProduct.variants[0]}
          onUpdateQuantity={onUpdateQuantity}
          cartQuantity={getCartQuantity(selectedProduct.id, selectedProduct.variants.find(v => v.id === selectedVariants[selectedProduct.id])?.id)}
        />
      )}

      {/* Search Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
            <DialogDescription>
              Find products in the {categories.find(c => c.id === activeCategory)?.name} category
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {searchTerm && (
              <div className="text-sm text-gray-600">
                Found {searchFilteredProducts.length} product{searchFilteredProducts.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setShowSearchModal(false);
              }}
            >
              Clear
            </Button>
            <Button onClick={() => setShowSearchModal(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};