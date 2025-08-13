import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../DeliveryWidget';
import { useProductLoader } from '@/hooks/useProductLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import { TypingIntro } from '@/components/common/TypingIntro';

import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';
import spiritsCategoryBg from '@/assets/spirits-category-bg.jpg';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

interface LocalCartItem extends CartItem {
  productId?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  handle: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: Product[];
}

interface ProductCategoriesProps {
  onAddToCart: (item: Omit<LocalCartItem, 'quantity'>) => void;
  cartItemCount: number;
  customAppName?: string;
  customHeroHeading?: string;
  customHeroSubheading?: string;
  customLogoUrl?: string;
  customCollections?: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
      subheadline_text?: string;
      subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat';
      subheadline_size?: 'sm' | 'md' | 'lg' | 'xl';
    }>;
  };
  onOpenCart: () => void;
  cartItems: LocalCartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
  onBackToStart?: () => void;
  showBackToStart?: boolean;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
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
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<{[productId: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [visibleProductCount, setVisibleProductCount] = useState(50);
  const [scrolled, setScrolled] = useState(false);
  
  // Refs
  const lastScrollY = useRef(0);
  
  // Data loading
  const { collections, loading, error, refreshCollections } = useProductLoader();

  console.log('ProductCategories render:', { 
    collectionsCount: collections.length, 
    loading, 
    error,
    collections: collections.slice(0, 2) // First 2 collections for debugging
  });

  // Apply affiliate markup to prices
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);

  // Category mapping
  const getCategoryMapping = () => {
    if (customCollections?.tabs && customCollections.tabs.length > 0) {
      return customCollections.tabs.map((tab, index) => ({
        step: index,
        title: tab.name,
        handle: tab.collection_handle,
        backgroundImage: getCategoryBackground(tab.collection_handle),
        pageTitle: `Choose Your ${tab.name}`
      }));
    }
    
    return [
      { step: 0, title: 'Spirits', handle: 'spirits', backgroundImage: spiritsCategoryBg, pageTitle: 'Choose Your Spirits' },
      { step: 1, title: 'Beer', handle: 'tailgate-beer', backgroundImage: beerCategoryBg, pageTitle: 'Choose Your Beer' },
      { step: 2, title: 'Seltzers', handle: 'seltzer-collection', backgroundImage: seltzerCategoryBg, pageTitle: 'Choose Your Seltzers' },
      { step: 3, title: 'Mixers & N/A', handle: 'mixers-non-alcoholic', backgroundImage: partySuppliesCategoryBg, pageTitle: 'Choose Your Mixers & Non-Alcoholic Drinks' },
      { step: 4, title: 'Cocktails', handle: 'cocktail-kits', backgroundImage: cocktailCategoryBg, pageTitle: 'Choose Your Cocktails' },
      { step: 5, title: 'Search', handle: 'search', backgroundImage: partySuppliesCategoryBg, pageTitle: 'Search Products', isSearch: true }
    ];
  };

  const getCategoryBackground = (handle: string) => {
    if (handle.includes('spirit')) return spiritsCategoryBg;
    if (handle.includes('beer')) return beerCategoryBg;
    if (handle.includes('seltzer')) return seltzerCategoryBg;
    if (handle.includes('cocktail')) return cocktailCategoryBg;
    return partySuppliesCategoryBg;
  };

  const categoryMapping = getCategoryMapping();
  const displayedTabsCount = Math.min(customCollections?.tab_count ?? categoryMapping.length, categoryMapping.length);
  const displayedTabs = categoryMapping.slice(0, displayedTabsCount);

  // Auto-select first tab that has a matching collection if current selection doesn't exist
  useEffect(() => {
    if (!collections || collections.length === 0) return;
    const currentHandle = categoryMapping[selectedCategory]?.handle;
    const hasCurrent = !!collections.find(c => c.handle === currentHandle);
    if (!hasCurrent) {
      const firstAvailableIndex = categoryMapping.findIndex(tab =>
        !!collections.find(c => c.handle === tab.handle)
      );
      if (firstAvailableIndex !== -1) {
        setSelectedCategory(firstAvailableIndex);
      }
    }
  }, [collections, selectedCategory, categoryMapping]);

  // Current collection
  const selectedCollection = collections.find(c => c.handle === categoryMapping[selectedCategory]?.handle);

  // Scroll handling - simplified
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 16);
      
      // Load more products when near bottom
      if (selectedCollection && currentScrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) {
        const totalProducts = selectedCollection.products.length;
        if (visibleProductCount < totalProducts) {
          setVisibleProductCount(prev => Math.min(prev + 25, totalProducts));
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCollection, visibleProductCount]);

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const allProducts = collections.flatMap(c => c.products);
      const filtered = allProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Product interaction handlers
  const handleProductClick = (product: Product) => {
    // For now, just add to cart on click
    handleAddProductToCart(product);
  };

  const handleAddProductToCart = (product: Product, selectedVariant?: string) => {
    const variant = selectedVariant || selectedVariants[product.id] || 'default';
    const variantData = product.variants?.find(v => v.id === variant);
    
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variantData?.price || product.price,
      image: product.image,
      variant: variant
    };
    
    onAddToCart(cartItem);
    setSelectedVariants(prev => ({ ...prev, [product.id]: variant }));
  };

  const getCartItemQuantity = (productId: string, variant?: string) => {
    return cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variant || 'default';
      return itemId === productId && itemVariant === checkVariant;
    })?.quantity || 0;
  };

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleProductCount(50);
  }, [selectedCategory]);

  // Category tabs config
  const currentTabConfig = customCollections?.tabs?.[selectedCategory];
  const subheadlineText = currentTabConfig?.subheadline_text || '';
  const subheadlineFont = currentTabConfig?.subheadline_font || 'default';
  const subheadlineSize = currentTabConfig?.subheadline_size || 'md';

  const subheadlineFontClass = {
    playfair: 'font-playfair',
    oswald: 'font-oswald', 
    montserrat: 'font-montserrat',
    default: ''
  }[subheadlineFont];

  const subheadlineSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }[subheadlineSize];

  // Render functions
  const renderHeroSection = () => (
    <div className="relative min-h-[70vh] flex flex-col justify-center items-center text-center text-white overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroPartyAustin})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {customLogoUrl && (
          <img 
            src={customLogoUrl} 
            alt={customAppName || 'Logo'} 
            className="h-24 w-auto mx-auto mb-6"
          />
        )}
        
        <TypingIntro
          text={customHeroHeading || "Austin's Premier Party Delivery"}
          className="text-4xl md:text-6xl font-bold mb-4"
          speedMs={50}
        />
        
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          {customHeroSubheading || "Premium drinks delivered to your door in 30 minutes"}
        </p>
        
        <Button 
          onClick={() => setSelectedCategory(0)}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
        >
          Start Shopping
        </Button>
      </div>
    </div>
  );

  const renderCategoryTabs = () => (
    <div className={`sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b transition-transform duration-200 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide py-4 gap-2">
          {displayedTabs.map((tab, index) => (
            <Button
              key={tab.step}
              variant={selectedCategory === index ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(index)}
              className="flex-shrink-0 whitespace-nowrap"
            >
              {tab.isSearch ? <Search className="w-4 h-4 mr-1" /> : null}
              {tab.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>
      
      {isSearching && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {searchResults.map(product => renderProductCard(product))}
        </div>
      )}
      
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found for "{searchQuery}"
        </div>
      )}
    </div>
  );

  const renderProductCard = (product: Product) => {
    const selectedVariant = selectedVariants[product.id];
    const variantData = product.variants?.find(v => v.id === selectedVariant);
    const displayPrice = applyMarkup(variantData?.price || product.price);
    const quantity = getCartItemQuantity(product.id, selectedVariant);

    return (
      <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-200">
        <div className="relative">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
            onClick={() => handleProductClick(product)}
            loading="lazy"
          />
          {quantity > 0 && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              {quantity}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleProductClick(product)}>
            {product.title}
          </h3>
          
          {product.variants && product.variants.length > 1 && (
            <Select
              value={selectedVariant || ''}
              onValueChange={(value) => setSelectedVariants(prev => ({ ...prev, [product.id]: value }))}
            >
              <SelectTrigger className="w-full mb-3 h-8 text-xs">
                <SelectValue placeholder="Choose variant" />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map(variant => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.title} - ${applyMarkup(variant.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              ${displayPrice.toFixed(2)}
            </span>
            
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(product.id, selectedVariant, quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="min-w-[1.5rem] text-center font-medium">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(product.id, selectedVariant, quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleAddProductToCart(product, selectedVariant)}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProductsSection = () => {
    if (!selectedCollection) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">No products found for this category.</p>
        </div>
      );
    }

    const visibleProducts = selectedCollection.products.slice(0, visibleProductCount);

    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        {subheadlineText && (
          <div className="text-center mb-6">
            <p className={`${subheadlineFontClass} ${subheadlineSizeClass} text-muted-foreground`}>
              {subheadlineText}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProducts.map(product => renderProductCard(product))}
        </div>
        
        {visibleProductCount < selectedCollection.products.length && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setVisibleProductCount(prev => Math.min(prev + 25, selectedCollection.products.length))}
            >
              Load More Products
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refreshCollections} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No collections state
  if (!loading && collections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">No product collections found.</p>
          <Button onClick={refreshCollections} variant="outline">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const isSearchTab = categoryMapping[selectedCategory]?.isSearch;

  return (
    <div className="min-h-screen bg-background">
      {renderHeroSection()}
      {renderCategoryTabs()}
      
      {isSearchTab ? renderSearchSection() : renderProductsSection()}
      
    </div>
  );
};