import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProductLoader } from '@/hooks/useProductLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Search, Star, ShoppingCart, Home, ArrowLeft, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { TypingIntro } from '@/components/common/TypingIntro';

// Import category backgrounds
import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';
import spiritsCategoryBg from '@/assets/spirits-category-bg.jpg';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

interface CartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

interface LocalCartItem extends CartItem {
  productId?: string;
}

interface Product {
  id: string;
  title: string;
  price: string | number;
  image: string;
  description?: string;
  handle?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: string | number;
  }>;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: Product[];
}

interface ProductCategoriesProps {
  onAddToCart: (product: any) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: LocalCartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, newQuantity: number, productData?: any) => void;
  onProceedToCheckout: () => void;
  customAppName?: string;
  customHeroHeading?: string;
  customHeroSubheading?: string;
  customLogoUrl?: string;
  customCollections?: {
    tabs?: Array<{
      name: string;
      collection_handle: string;
    }>;
    tab_count?: number;
  };
  onBack?: () => void;
  onBackToStart?: () => void;
  showBackToStart?: boolean;
}

export function ProductCategories({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  customAppName,
  customHeroHeading,
  customHeroSubheading,
  customLogoUrl,
  customCollections
}: ProductCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 32; // 8 per row x 4 rows
  const { collections, loading, error, refreshCollections } = useProductLoader();
  
  // Extract all products from collections
  const products = collections.flatMap(collection => collection.products || []);

  const getCategoryMapping = () => {
    if (customCollections?.tabs) {
      return [
        { id: 'all', name: 'All Products', icon: '🛍️' },
        ...customCollections.tabs.map(tab => ({
          id: tab.collection_handle,
          name: tab.name,
          icon: getCategoryIcon(tab.name)
        }))
      ];
    }
    
    return [
      { id: 'all', name: 'All Products', icon: '🛍️', bgImage: '' },
      { id: 'spirits', name: 'Spirits', icon: '🥃', bgImage: spiritsCategoryBg },
      { id: 'beer', name: 'Beer', icon: '🍺', bgImage: beerCategoryBg },
      { id: 'wine', name: 'Wine', icon: '🍷', bgImage: cocktailCategoryBg },
      { id: 'mixers', name: 'Mixers & N/A', icon: '🥤', bgImage: seltzerCategoryBg },
      { id: 'party-supplies', name: 'Party Supplies', icon: '🎉', bgImage: partySuppliesCategoryBg }
    ];
  };

  const getCategoryIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      'Spirits': '🥃', 'Liquor': '🥃',
      'Beer': '🍺', 'Beers': '🍺',
      'Wine': '🍷', 'Champagne': '🍾', 'Wine & Champagne': '🍾',
      'Cocktails': '🍸', 'Cocktail Kits': '🍸', 'Cocktail Kits!': '🍸',
      'Mixers': '🥤', 'Mixers & N/A': '🥤', 'Seltzers': '💧',
      'Party Supplies': '🎉'
    };
    return iconMap[name] || '🛍️';
  };

  const getCategoryBackground = (categoryId: string) => {
    const bgMap: Record<string, string> = {
      'spirits': spiritsCategoryBg,
      'beer': beerCategoryBg, 
      'wine': cocktailCategoryBg,
      'mixers': seltzerCategoryBg,
      'party-supplies': partySuppliesCategoryBg
    };
    return bgMap[categoryId] || '';
  };

  useEffect(() => {
    if (customCollections?.tabs && customCollections.tabs.length > 0) {
      setSelectedCategory(customCollections.tabs[0].collection_handle);
    }
  }, [customCollections]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load more products with pagination
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        if (!loading) {
          setCurrentPage(prev => prev + 1);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedCategory('all');
  };

  // Get cart item quantities for product grid
  const getCartItemQuantities = () => {
    const quantities: Record<string, number> = {};
    cartItems.forEach(item => {
      const key = `${item.id}-${item.variant || 'default'}`;
      quantities[key] = item.quantity;
    });
    return quantities;
  };

  // Render functions
  const renderHeroSection = () => (
    <div className="relative h-80 md:h-96 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroPartyAustin})` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
            {cartItemCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10 relative"
                onClick={onOpenCart}
              >
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                  {cartItemCount}
                </Badge>
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm"
              onClick={onProceedToCheckout}
              disabled={cartItemCount === 0}
              className="bg-white text-primary hover:bg-white/90"
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm p-4">
          <div className="container mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 bg-white/90"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearch(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto">
          {customLogoUrl && (
            <img 
              src={customLogoUrl} 
              alt={customAppName || "Logo"} 
              className="h-20 md:h-24 w-auto mx-auto mb-6"
            />
          )}
          
          <TypingIntro
            text={customHeroHeading || customAppName || "Party On Delivery"}
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            speedMs={50}
          />
          
          {customHeroSubheading && (
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {customHeroSubheading}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoryTabs = () => {
    const categories = getCategoryMapping();
    const isSticky = scrollY > 300;
    
    return (
      <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm shadow-md' : 'relative'} transition-all duration-300`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSearchSection = () => {
    if (!searchTerm) return null;
    
    const searchResults = products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Search Results for "{searchTerm}" ({searchResults.length})
          </h2>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
        
        {/* Enhanced Product Grid: 4 per row mobile, 8 per row desktop */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4">
          {searchResults.map((product) => renderProductCard(product))}
        </div>
      </div>
    );
  };

  const renderProductCard = (product: Product) => {
    const selectedVariant = selectedVariants[product.id] || (product.variants?.[0]?.id);
    const variant = product.variants?.find(v => v.id === selectedVariant) || product.variants?.[0];
    const price = variant?.price || product.price;
    const cartQuantity = cartItems.find(item => 
      (item.productId || item.id) === product.id && 
      item.variant === (variant?.title || 'default')
    )?.quantity || 0;

    const { cleanTitle } = parseProductTitle(product.title);
    const optimizedUrls = useImageOptimization(product.image, false);

    return (
      <Card key={`${product.id}-${selectedVariant}`} className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        <CardContent className="p-3 flex flex-col h-full">
          <div className="relative mb-3 flex-shrink-0">
            <OptimizedImage
              src={optimizedUrls.src || product.image}
              alt={cleanTitle}
              className="w-full h-32 md:h-48 object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-grow flex flex-col">
            <h3 className="font-semibold text-xs md:text-sm mb-2 line-clamp-2 flex-grow">
              {cleanTitle}
            </h3>
            
            {product.variants && product.variants.length > 1 && (
              <div className="mb-2">
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariants(prev => ({
                    ...prev,
                    [product.id]: e.target.value
                  }))}
                  className="w-full text-xs border rounded px-2 py-1"
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} - ${parseFloat(String(v.price)).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-auto">
              <span className="font-bold text-primary text-sm">
                ${parseFloat(String(price)).toFixed(2)}
              </span>
              
              <div className="flex items-center gap-1">
                {cartQuantity > 0 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateQuantity(
                        product.id, 
                        variant?.title || 'default', 
                        cartQuantity - 1
                      )}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium w-6 text-center">
                      {cartQuantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateQuantity(
                        product.id, 
                        variant?.title || 'default', 
                        cartQuantity + 1,
                        {
                          id: product.id,
                          title: product.title,
                          name: product.title,
                          price: parseFloat(String(price)),
                          image: product.image,
                          variant: variant?.title || 'default'
                        }
                      )}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onAddToCart({
                      id: product.id,
                      title: product.title,
                      name: product.title,
                      price: parseFloat(String(price)),
                      image: product.image,
                      variant: variant?.title || 'default'
                    })}
                    className="h-7 text-xs px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProductsSection = () => {
    if (searchTerm) {
      return renderSearchSection();
    }

    const filteredProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => {
          const collection = collections.find(c => 
            c.products.some(p => p.id === product.id)
          );
          return collection?.handle === selectedCategory;
        });

    const displayedProducts = filteredProducts.slice(0, currentPage * productsPerPage);

    return (
      <div id="products" className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'all' ? 'All Products' : 
             getCategoryMapping().find(c => c.id === selectedCategory)?.name || 'Products'} 
            ({filteredProducts.length})
          </h2>
        </div>

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 32 }).map((_, i) => (
              <Card key={i} className="h-48 md:h-64">
                <CardContent className="p-3">
                  <div className="animate-pulse space-y-2">
                    <div className="bg-muted h-24 md:h-32 rounded" />
                    <div className="bg-muted h-3 rounded" />
                    <div className="bg-muted h-3 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? "We're loading our products. Please check back soon!" 
                : "No products in this category yet."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Enhanced Product Grid: 4 per row mobile, 8 per row desktop */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4">
              {displayedProducts.map((product) => renderProductCard(product))}
            </div>
            
            {displayedProducts.length < filteredProducts.length && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to load products</h2>
          <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeroSection()}
      {renderCategoryTabs()}
      {renderProductsSection()}
    </div>
  );
}