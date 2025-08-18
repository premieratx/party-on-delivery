import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ForceAddToCartButton } from '@/components/common/ForceAddToCartButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus } from 'lucide-react';
import { VideoBackground } from '@/components/common/VideoBackground';
import { TypingIntro } from '@/components/common/TypingIntro';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';
import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import bgImage from '@/assets/old-fashioned-bg.jpg';

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: any[];
  image?: string;
}

interface ProductCategoriesProps {
  appName?: string;
  heroHeading?: string;
  heroSubheading?: string;
  heroScrollingText?: string;
  logoUrl?: string;
  collectionsConfig?: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  onAddToCart?: (item: any) => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
  cartItems?: any[];
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout?: () => void;
  onBack?: () => void;
  onGoHome?: () => void;
  onSearchQueryChange?: (query: string) => void;
  externalSearchQuery?: string;
  customSiteSlug?: string;
  showSearch?: boolean;
  maxProducts?: number;
  forceRefresh?: boolean;
}

const DEFAULT_COLLECTIONS = [
  { id: 'spirits', title: 'Spirits', handle: 'spirits', isSearch: false, icon: '🥃' },
  { id: 'beer', title: 'Beer', handle: 'beer', isSearch: false, icon: '🍺' },
  { id: 'seltzers', title: 'Seltzers', handle: 'seltzers', isSearch: false, icon: '🥤' },
  { id: 'mixers', title: 'Mixers & N/A', handle: 'mixers', isSearch: false, icon: '🧊' },
  { id: 'cocktails', title: 'Cocktails', handle: 'cocktails', isSearch: false, icon: '🍸' },
  { id: 'search', title: 'Search', handle: 'search', isSearch: true, icon: '🔍' }
];

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  appName = "Austin's Premier Party Supply Delivery",
  heroHeading = "Austin's Premier Party Supply Delivery",
  heroSubheading = "Satisfaction Guaranteed, On-Time Delivery",
  heroScrollingText = "Let's Get It",
  logoUrl,
  collectionsConfig,
  onAddToCart,
  cartItemCount = 0,
  onOpenCart,
  cartItems = [],
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onGoHome,
  onSearchQueryChange,
  externalSearchQuery = '',
  customSiteSlug,
  showSearch = true,
  maxProducts = 50
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearchTab, setIsSearchTab] = useState(false);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const { products, collections, loading, error } = useOptimizedProductLoader();

  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // Use collections from config or defaults
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs) {
      return collectionsConfig.tabs.map((tab, index) => ({
        id: tab.collection_handle,
        title: tab.name,
        handle: tab.collection_handle,
        icon: tab.icon || '📦',
        isSearch: false
      })).concat([{ id: 'search', title: 'Search', handle: 'search', isSearch: true, icon: '🔍' }]);
    }
    return DEFAULT_COLLECTIONS;
  }, [collectionsConfig]);

  // Get products for current tab
  const currentTabProducts = useMemo(() => {
    const currentTab = tabs[selectedCategory];
    if (!currentTab || currentTab.isSearch) return [];
    
    // Find collection by handle or filter products by category
    const collection = collections.find(c => c.handle === currentTab.handle);
    if (collection?.products?.length) {
      return collection.products;
    }
    
    // Fallback: filter all products by category match
    return products.filter((product: any) => {
      return product.collection_handles?.some((handle: string) => 
        handle.toLowerCase().includes(currentTab.handle.toLowerCase()) ||
        currentTab.handle.toLowerCase().includes(handle.toLowerCase())
      ) || product.category?.toLowerCase() === currentTab.handle.toLowerCase();
    });
  }, [collections, tabs, selectedCategory, products]);

  const currentTab = tabs[selectedCategory];
  const isCurrentlySearchTab = currentTab?.isSearch;

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined
    };
    
    if (onAddToCart) {
      onAddToCart(cartItem);
    } else if (onUpdateQuantity) {
      const currentQty = getCartItemQuantity(product.id, cartItem.variant);
      onUpdateQuantity(product.id, cartItem.variant, currentQty + 1);
    }
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    if (onUpdateQuantity) {
      onUpdateQuantity(productId, variantId, newQty);
    }
  };

  const handleSearch = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Delivery App Dropdown */}
        <div className="absolute top-4 left-4 z-20">
          <DeliveryAppDropdown />
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 max-w-4xl">
            {logoUrl && (
              <div className="mb-6">
                <img src={logoUrl} alt={appName} className="h-16 mx-auto" />
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {heroHeading}
            </h1>
            {heroSubheading && (
              <p className="text-xl md:text-2xl text-blue-100 mb-6">
                {heroSubheading}
              </p>
            )}
            {heroScrollingText && (
              <div className="mb-8">
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {heroScrollingText}
                </div>
              </div>
            )}
            
            {/* Search Button in Hero - Links to Search Page */}
            <div className="mt-8">
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Occasion Buttons - What's the Occasion */}
      <div className="bg-background border-b py-4">
        <div className="container mx-auto px-4">
          <OccasionButtons isMobile={false} isScrollingDown={false} />
        </div>
      </div>

      {/* Search Bar Above Tabs */}
      {showSearch && (
        <div className="bg-background border-b py-4">
          <div className="container mx-auto px-4">
            <div className="flex max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                className="rounded-l-none"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab, index) => (
              <Button
                key={tab.id}
                variant={selectedCategory === index ? "default" : "ghost"}
                className="whitespace-nowrap min-w-fit"
                onClick={() => {
                  setSelectedCategory(index);
                  setIsSearchTab(tab.isSearch || false);
                }}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {isCurrentlySearchTab ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Search Products</h3>
            <p className="text-muted-foreground mb-6">
              Enter a search term above to find products
            </p>
            <div className="flex max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                className="rounded-l-none"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentTabProducts.slice(0, maxProducts).map((product) => {
              console.log('🛒 ProductCategories: Rendering product', product.id, product.title);
              
              return (
                <div key={product.id} className="bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">${product.price}</p>
                    
                    {/* Force Add to Cart Button */}
                    <ForceAddToCartButton
                      product={{
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        variants: product.variants
                      }}
                      variant="default"
                      showQuantity={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategories;