import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus } from 'lucide-react';
import { VideoBackground } from '@/components/common/VideoBackground';
import { TypingIntro } from '@/components/common/TypingIntro';
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
  { id: 'beer', title: 'Beer', handle: 'tailgate-beer', isSearch: false, icon: '🍺' },
  { id: 'seltzers', title: 'Seltzers', handle: 'seltzer-collection', isSearch: false, icon: '🥤' },
  { id: 'mixers', title: 'Mixers & N/A', handle: 'mixers-non-alcoholic', isSearch: false, icon: '🧊' },
  { id: 'cocktails', title: 'Cocktails', handle: 'cocktail-kits', isSearch: false, icon: '🍸' },
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchTab, setIsSearchTab] = useState(false);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();

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

  // Mock products for now (would normally fetch from Shopify)
  const mockProducts = useMemo(() => [
    {
      id: 'mock-1',
      title: 'Premium Whiskey',
      price: 45.99,
      image: bgImage,
      variants: [{ id: 'var-1', title: 'Default' }]
    },
    {
      id: 'mock-2', 
      title: 'Craft Beer Pack',
      price: 24.99,
      image: bgImage,
      variants: [{ id: 'var-2', title: 'Default' }]
    },
    {
      id: 'mock-3',
      title: 'Hard Seltzer Mix',
      price: 18.99,
      image: bgImage,
      variants: [{ id: 'var-3', title: 'Default' }]
    }
  ], []);

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
            
            {/* Search Button in Hero */}
            <div className="mt-8">
              <div className="flex max-w-md mx-auto">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none bg-white/90 text-black"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  className="rounded-l-none bg-primary hover:bg-primary/90"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockProducts.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
              
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
                    
                    {quantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                      >
                        Add to Cart
                      </Button>
                    )}
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