import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft, CheckCircle, Wine, Search, Palette } from 'lucide-react';
import { ProductSearchBar } from './ProductSearchBar';
import { DeliveryAppSelector } from './DeliveryAppSelector';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../DeliveryWidget';
import { ProductLightbox } from './ProductLightbox';
import { supabase } from '@/integrations/supabase/client';
import { getInstantProducts } from '@/utils/instantCacheClient';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { parseProductTitle } from '@/utils/productUtils';
import { getContainerDescription } from '@/utils/containerSizeExtractor';

import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import seltzerCategoryBg from '@/assets/seltzer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
import partySuppliesCategoryBg from '@/assets/party-supplies-category-bg.jpg';
import spiritsCategoryBg from '@/assets/spirits-category-bg.jpg';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';
import { TypingIntro } from '@/components/common/TypingIntro';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchInterface } from '@/hooks/useSearchInterface';
import { haptic } from '@/utils/hapticFeedback';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { CustomThemeCreator } from '@/components/admin/CustomThemeCreator';
import { SpeechButton } from '@/components/common';
import { OccasionButtons } from './OccasionButtons';

interface LocalCartItem extends CartItem {
  productId?: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[]; // Add support for multiple images
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
  onAddToCart: (item: Omit<LocalCartItem, 'quantity'>) => void;
  cartItemCount: number;
  customAppName?: string;
  customHeroHeading?: string;
  customHeroSubheading?: string;
  customLogoUrl?: string;
  customHeroScrollingText?: string;
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
  cartItems: LocalCartItem[]; // Add this to track individual cart items
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
  onBackToStart?: () => void;
  showBackToStart?: boolean;
  // New props to control menu visibility
  isStartScreen?: boolean;
  isCoverScreen?: boolean;
  hideMenus?: boolean;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onBackToStart,
  customAppName,
  customHeroHeading,
  customHeroSubheading,
  customLogoUrl,
  customHeroScrollingText,
  customCollections,
  isStartScreen = false,
  isCoverScreen = false,
  hideMenus = false
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(0); // Start with first (far left) tab
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomSite, setIsCustomSite] = useState(false);
  const [customSiteCollections, setCustomSiteCollections] = useState<string[]>([]);
  const [cartCountAnimation, setCartCountAnimation] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{[productId: string]: string}>({});
  const [lightboxProduct, setLightboxProduct] = useState<ShopifyProduct | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [visibleProductCounts, setVisibleProductCounts] = useState<{[collectionIndex: number]: number}>({});
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
const [flashIndex, setFlashIndex] = useState<number | null>(null);
const isMobile = useIsMobile();
const [hideTabs, setHideTabs] = useState(false);
const [hideAllMenus, setHideAllMenus] = useState(false);
const lastYRef = useRef(0);
const [scrolled, setScrolled] = useState(false);
const [isScrollingDown, setIsScrollingDown] = useState(false);
const [showMobileCartCheckout, setShowMobileCartCheckout] = useState(false);
const [showCustomThemeCreator, setShowCustomThemeCreator] = useState(false);

// Enhanced search interface with smooth UI transitions
// Enhanced search interface with scroll detection
const {
  isSearchFocused,
  hasUserInteracted,
  shouldHideChrome,
  isScrolling,
  shouldHideBottomMenu,
  isScrollingUp,
  headerCompressed,
  searchInputRef,
  handleSearchFocus,
  handleSearchBlur
} = useSearchInterface({
  hideOnScroll: true,
  onSearchFocus: () => {
    // Additional focus handling can go here
  }
});

// Enhanced scroll detection for cart/checkout replacement
useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const isScrollingNow = currentScrollY > 50; // Show cart when scrolled more than 50px
    setIsScrollingDown(isScrollingNow);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Apply affiliate markup to displayed prices (session-based)
const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);


  // Deep-linking: optional category/product from URL (e.g., ?category=cocktails&productTitle=Spicy%20Margarita)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const prodTitle = params.get('productTitle');
    (window as any).__dl = { cat, prodTitle };
  }, []);
  
  // Check URL parameters and current app state to determine if menus should be hidden
  const searchParams = new URLSearchParams(window.location.search);
  const currentStep = searchParams.get('step');
  const shouldHideMenusCompletely = hideMenus || isStartScreen || isCoverScreen || currentStep === 'start';
 
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll as any, { passive: true } as any);
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  // Use custom collections if provided, otherwise use default mapping
  const getStepMapping = () => {
    if (customCollections?.tabs && customCollections.tabs.length > 0) {
      return customCollections.tabs.map((tab, index) => ({
        step: index,
        title: tab.name,
        handle: tab.collection_handle,
        backgroundImage: getBackgroundForHandle(tab.collection_handle),
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

  // Helper function to get appropriate background image for collection handle
  const getBackgroundForHandle = (handle: string) => {
    if (handle.includes('spirit')) return spiritsCategoryBg;
    if (handle.includes('beer')) return beerCategoryBg;
    if (handle.includes('seltzer')) return seltzerCategoryBg;
    if (handle.includes('cocktail')) return cocktailCategoryBg;
    return partySuppliesCategoryBg;
  };

  const stepMapping = getStepMapping();
  
  // Determine how many tabs to show based on config
  const displayedTabsCount = Math.min(customCollections?.tab_count ?? stepMapping.length, stepMapping.length);
  const displayedTabs = stepMapping.slice(0, displayedTabsCount);
  const maxCategoryIndex = displayedTabsCount - 1;
  const isCocktailsTab = !!stepMapping[selectedCategory]?.handle?.includes('cocktail');

  // Subheadline config for current tab
  const currentTabConfig = customCollections?.tabs?.[selectedCategory] as any;
  const subFont = currentTabConfig?.subheadline_font || 'default';
  const subSize = currentTabConfig?.subheadline_size || 'md';
  const subFontClass = subFont === 'playfair' ? 'font-playfair' : subFont === 'oswald' ? 'font-oswald' : subFont === 'montserrat' ? 'font-montserrat' : '';
  const subSizeClass = subSize === 'sm' ? 'text-sm' : subSize === 'lg' ? 'text-lg' : subSize === 'xl' ? 'text-xl' : 'text-base';
  const subText = (currentTabConfig?.subheadline_text || '').trim();

  useEffect(() => {
    // Always load all collections for main delivery app
    // Custom sites should be separate pages/URLs
    setIsCustomSite(false);
    setCustomSiteCollections([]);
    
    fetchCollections();

    // Listen for admin sync events to refresh collections
    const handleAdminSync = () => {
      console.log('Admin sync detected - refreshing delivery app collections');
      clearCacheAndRefresh();
    };

    window.addEventListener('admin-sync-complete', handleAdminSync);
    
    return () => {
      window.removeEventListener('admin-sync-complete', handleAdminSync);
    };
  }, []);

  // Mobile: enhanced scroll behavior with menu hiding
  useEffect(() => {
    if (!isMobile) return;
    
    let startY = 0;
    let isScrolling = false;
    
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isScrolling = false;
    };
    
    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = Math.abs(currentY - startY);
      
      // If movement is more than half screen height, consider it scrolling
      if (deltaY > window.innerHeight * 0.5) {
        isScrolling = true;
        setHideAllMenus(true);
      }
    };
    
    const onTouchEnd = () => {
      if (!isScrolling) {
        setHideAllMenus(false);
      }
    };
    
    const onScroll = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      
      // Show cart/checkout in tab area when past search bar
      if (y > 200) {
        setShowMobileCartCheckout(true);
      } else {
        setShowMobileCartCheckout(false);
      }
      
      // Hide/show tabs based on scroll direction
      if (y > last + 10) {
        setHideTabs(true);
      } else if (y < last - 10 || y < 40) {
        setHideTabs(false);
        setHideAllMenus(false);
      }
      
      lastYRef.current = y;
    };
    
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll as any, { passive: true } as any);
    
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll as any);
    };
  }, [isMobile]);

  // Re-fetch collections when custom site data changes
  useEffect(() => {
    if (isCustomSite && customSiteCollections.length > 0) {
      console.log('Custom site collections changed, re-fetching:', customSiteCollections);
      fetchCollections();
    }
  }, [isCustomSite, customSiteCollections.join(',')]);

  // Initialize visible counts and lazy loading
  useEffect(() => {
    if (collections.length > 0) {
      const initialVisibleCounts: {[collectionIndex: number]: number} = {};
      collections.forEach((_, index) => {
        // Load 50 items initially, or all if less than 50
        const totalProducts = collections[index]?.products?.length || 0;
        initialVisibleCounts[index] = Math.min(50, totalProducts);
      });
      setVisibleProductCounts(initialVisibleCounts);
    }
  }, [collections]);

  // Scroll event listener for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 200px from bottom
      if (scrollPosition >= documentHeight - 200) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCategory, visibleProductCounts, collections]);

  const loadMoreProducts = () => {
    if (!selectedCollection) return;
    
    const currentVisible = visibleProductCounts[selectedCategory] || 50;
    const totalProducts = selectedCollection.products.length;
    
    if (currentVisible < totalProducts) {
      const nextVisible = Math.min(currentVisible + 25, totalProducts); // Load 25 more at a time
      setVisibleProductCounts(prev => ({
        ...prev,
        [selectedCategory]: nextVisible
      }));
    }
  };

  const fetchCollections = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`=== fetchCollections START (forceRefresh: ${forceRefresh}) ===`);
      
      console.log('⚡ Loading main delivery app with instant cache strategy...');

      // First try instant cache for super fast loading
      if (!forceRefresh) {
        try {
          const instant = await getInstantProducts();
          if (instant.collections?.length) {
            console.log('✅ Main delivery app: Using instant cached collections');
            setCollections(instant.collections);
            setRetryCount(0);
            setLoading(false);
            return;
          }
        } catch (instantError) {
          console.log('⚠️ Instant cache failed, trying local cache...');
        }

        // Fallback to cache manager
        const cachedCollections = cacheManager.getShopifyCollections();
        if (cachedCollections && cachedCollections.length > 0) {
          console.log('Using cached collections from cache manager');
          setCollections(cachedCollections);
          setLoading(false);
          return;
        }
      } else {
        console.log('Force refresh - clearing cache and fetching fresh data');
        cacheManager.remove(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS);
      }
      
      console.log('Fetching fresh collections from regular endpoint...');
      
      const result = await ErrorHandler.withRetry(async () => {
        console.log('Using getInstantProducts for maximum speed');
        const instant = await getInstantProducts({ forceRefresh });
        console.log('Instant response received:', {
          collectionsCount: instant.collections?.length || 0,
          productsCount: instant.products?.length || 0,
        });
        if (!instant.collections || !Array.isArray(instant.collections)) {
          throw new Error('Invalid response format: no collections array');
        }
        if (instant.collections.length === 0) {
          throw new Error('No collections found in Shopify store');
        }
        return instant;
      }, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 1.5
      });

      console.log(`Successfully fetched ${result.collections.length} collections`);
      
      // Filter collections for custom sites
      let collectionsToShow = result.collections;
      if (isCustomSite && customSiteCollections.length > 0) {
        collectionsToShow = result.collections.filter((collection: any) => 
          customSiteCollections.includes(collection.handle)
        );
        console.log(\`Filtered to \${collectionsToShow.length} collections for custom site:\`, customSiteCollections);
      }
      
      setCollections(collectionsToShow);
      setRetryCount(0);
      
    } catch (error: any) {
      console.error('Failed to fetch collections:', error);
      setError(error.message || 'Failed to load product collections. Please try again.');
      
      if (autoRetryEnabled && retryCount < 2) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(\`Auto-retry attempt \${retryCount + 1} in \${retryDelay}ms...\`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCollections(false);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCacheAndRefresh = () => {
    cacheManager.remove(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS);
    fetchCollections(true);
  };

  // Get the selected collection based on our mappings
  const selectedCollection = React.useMemo(() => {
    const currentMapping = stepMapping[selectedCategory];
    if (!currentMapping) return null;
    
    if (currentMapping.isSearch) {
      // For search, return a synthetic collection with search results
      return {
        id: 'search',
        title: 'Search Results',
        handle: 'search',
        description: \`Showing results for "\${searchQuery}"\`,
        products: searchResults
      };
    }
    
    return collections.find(collection => 
      collection.handle === currentMapping.handle
    ) || null;
  }, [selectedCategory, collections, stepMapping, searchResults, searchQuery]);

  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, change: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + change);
    onUpdateQuantity(productId, variantId, newQty);
    
    if (newQty > currentQty) {
      haptic.vibrate(50);
      // Flash the tab to show the item was added
      setFlashIndex(selectedCategory);
      setTimeout(() => setFlashIndex(null), 300);
    }
  };

  const handleAddToCart = (product: ShopifyProduct, variant?: any) => {
    const productName = parseProductTitle(product.title);
    const containerInfo = getContainerDescription(product.title);
    
    onAddToCart({
      id: product.id,
      variant: variant?.id,
      title: productName.displayName,
      name: productName.displayName,
      price: variant?.price || product.price,
      image: product.image,
      productId: product.id
    });
    
    haptic.vibrate(100);
    
    setCartCountAnimation(true);
    setTimeout(() => setCartCountAnimation(false), 300);
    
    // Flash the tab to show the item was added
    setFlashIndex(selectedCategory);
    setTimeout(() => setFlashIndex(null), 300);
  };

  const handleProductClick = (product: ShopifyProduct) => {
    if (isCocktailsTab) {
      setLightboxProduct(product);
      setIsLightboxOpen(true);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setIsSearching(true);
    setShowSearch(true);
    
    try {
      // Search across all collections
      const allProducts = collections.flatMap(collection => collection.products);
      const filtered = allProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered);
      
      // Switch to search tab if we're not already there
      const searchTabIndex = stepMapping.findIndex(step => step.isSearch);
      if (searchTabIndex !== -1 && selectedCategory !== searchTabIndex) {
        setSelectedCategory(searchTabIndex);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Loading your party essentials...</p>
            <p className="text-sm text-muted-foreground">
              {retryCount > 0 ? \`Retry attempt \${retryCount}\` : 'Getting the best products for you'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-destructive/5 to-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Issue</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => fetchCollections(true)} 
              className="w-full"
              variant="default"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => setAutoRetryEnabled(!autoRetryEnabled)} 
              variant="outline" 
              className="w-full"
            >
              {autoRetryEnabled ? 'Disable' : 'Enable'} Auto-Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no collections loaded, show empty state
  if (!collections || collections.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>No Products Available</CardTitle>
            <CardDescription>We're working on stocking our inventory. Please check back soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchCollections(true)} className="w-full">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background relative">
      {!shouldHideMenusCompletely && (
        <SpeechButton />
      )}
      
      {showCustomThemeCreator && (
        <div className="fixed inset-0 z-50">
          <CustomThemeCreator 
            onClose={() => setShowCustomThemeCreator(false)}
          />
        </div>
      )}

      {/* Hero Section - hidden when menus are disabled */}
      {!shouldHideMenusCompletely && (
          <div 
            className="relative bg-cover bg-center min-h-[30vh] flex items-center justify-center" 
            style={{ 
              backgroundImage: \`linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(\${heroPartyAustin})\`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-center text-white space-y-2 px-4">
              {customLogoUrl && (
                <img 
                  src={customLogoUrl}
                  alt="Logo"
                  className="h-16 w-auto mx-auto mb-4"
                />
              )}
              <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">
                {customHeroHeading || (customAppName || 'Party On Delivery')}
              </h1>
              <p className="text-lg lg:text-xl opacity-90">
                {customHeroSubheading || 'Premium delivery for your next celebration'}
              </p>
              {customHeroScrollingText && (
                <div className="mt-1 mb-2">
                  <TypingIntro text={customHeroScrollingText} className="text-white text-xl lg:text-3xl" speedMs={65} />
                </div>
              )}
            </div>
        </div>
      )}

      {/* Search Bar - ALWAYS STICKY (replaces What's the occasion when scrolling) */}
      <div className={\`sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md border-b transition-all duration-200\`}>
        <div className={\`w-full px-2 md:px-4 py-2\`}>
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            
            {/* Left Section: What's the Occasion - Expanded */}
            <div className="flex items-center gap-4 flex-1">
              {!isScrollingDown ? (
                <OccasionButtons isMobile={isMobile} isScrollingDown={isScrollingDown} />
              ) : (
                <>
                  {/* Cart and Checkout when scrolling */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCart}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">Cart</span>
                    {cartItemCount > 0 && (
                      <Badge variant="secondary" className="ml-1 min-w-[20px] h-5 text-xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onProceedToCheckout}
                    disabled={cartItemCount === 0}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Checkout</span>
                  </Button>
                </>
              )}
            </div>
            
            {/* Search Bar - moved to right side */}
            <div className="flex items-center gap-2 max-w-md w-full justify-end">
              <ProductSearchBar
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                isLoading={isSearching}
                placeholder="Search products..."
                className="w-full"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomThemeCreator(true)}
                className="flex-shrink-0 hidden lg:flex"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Category Tabs - ALWAYS STICKY */}
      <div className="sticky top-[60px] z-40 w-full px-1 md:px-4 py-3 bg-background/95 backdrop-blur-md border-b">
        <div className={\`flex flex-nowrap justify-center gap-px h-12 overflow-x-auto\`}>
          {/* Mobile: Show cart/checkout when scrolled, otherwise show tabs */}
          {isMobile && showMobileCartCheckout ? (
            <>
              <button
                onClick={onOpenCart}
                className={\`flex-1 bg-muted hover:bg-muted/70 text-foreground rounded-l-md text-xs font-bold px-3 flex items-center justify-center gap-2 transition-all duration-300 \${cartItemCount > 0 ? 'animate-pulse' : ''}\`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({cartItemCount})</span>
              </button>
              <button
                onClick={onProceedToCheckout}
                disabled={cartItemCount === 0}
                className={\`hidden sm:flex items-center justify-center h-full transition-all duration-300 group flex-none sm:basis-20 px-2 rounded-r-md rounded-l-none \${cartItemCount > 0 ? 'bg-success text-success-foreground hover:bg-success/90 checkout-blink' : 'bg-muted text-muted-foreground cursor-not-allowed'}\`}
                aria-label="Checkout"
              >
                <span className="inline-flex flex-col items-center gap-1 font-bold">
                  <span>Checkout</span>
                  <CheckCircle className="w-4 h-4" />
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Regular tabs */}
              {displayedTabs.map((step, index) => {
                const isActive = selectedCategory === index;
                const isSearchTab = step.isSearch;
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isSearchTab) {
                        setShowSearch(true);
                      } else {
                        setShowSearch(false);
                      }
                      setSelectedCategory(index);
                      haptic.vibrate(50);
                    }}
                    className={\`flex-1 min-w-0 px-1 lg:px-3 py-2 text-xs lg:text-sm font-bold transition-all duration-200 relative \${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted hover:bg-muted/70 text-foreground'
                    } \${
                      index === 0 ? 'rounded-l-md' : ''
                    } \${
                      index === displayedTabs.length - 1 ? 'rounded-r-md' : ''
                    } \${
                      flashIndex === index ? 'animate-pulse bg-success' : ''
                    }\`}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                      <span className="leading-none line-clamp-1">{step.title}</span>
                      {isSearchTab && showSearch && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 min-w-0 h-4">
                          {searchResults.length}
                        </Badge>
                      )}
                      {!isSearchTab && selectedCollection && selectedCategory === index && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 min-w-0 h-4">
                          {selectedCollection.products.length}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Section Heading - Hidden when sticky mode is active */}
      {!shouldHideMenusCompletely && !hideAllMenus && !(isSearchFocused || hasUserInteracted) && selectedCollection && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex items-center justify-center gap-4">
            {selectedCategory !== 0 && (
              <button
                onClick={() => selectedCategory > 0 && setSelectedCategory(selectedCategory - 1)}
                disabled={selectedCategory === 0}
                className="p-2 rounded-full transition-colors text-primary hover:bg-primary/10 cursor-pointer animate-[pulse_1s_ease-in-out_2]"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedCategory === 0 && <div className="w-10"></div>}
            <h2 className="text-foreground text-xl sm:text-2xl font-bold text-center">
              {stepMapping.find(step => step.handle === selectedCollection?.handle)?.pageTitle || selectedCollection?.title}
            </h2>
            <button
              onClick={() => selectedCategory < maxCategoryIndex && setSelectedCategory(selectedCategory + 1)}
              disabled={selectedCategory === maxCategoryIndex}
              className={\`p-2 rounded-full transition-colors \${
                selectedCategory === maxCategoryIndex 
                  ? 'text-muted-foreground cursor-not-allowed' 
                  : 'text-primary hover:bg-primary/10 cursor-pointer animate-[pulse_1s_ease-in-out_2]'
              }\`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          {/* Subheadline for current category if configured */}
          {subText && (
            <div className={\`mt-3 text-center \${subFontClass} \${subSizeClass} text-muted-foreground leading-relaxed\`}>
              {subText}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20">
        {selectedCollection && selectedCollection.products && selectedCollection.products.length > 0 ? (
          <div className="max-w-7xl mx-auto px-2 lg:px-4">
            {/* Search Results Header */}
            {showSearch && searchQuery.trim() && (
              <div className="mb-4 px-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Search results for "{searchQuery}" ({searchResults.length} items)
                </h3>
              </div>
            )}
            
            {/* Cocktails Tab - Card Layout */}
            {isCocktailsTab && !showSearch && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {selectedCollection.products.slice(0, visibleProductCounts[selectedCategory] || 50).map((product) => {
                  const variant = product.variants[0];
                  const price = variant?.price || product.price;
                  
                  return (
                    <Card 
                      key={product.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 group bg-card border hover:border-primary/50"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-foreground">
                          {parseProductTitle(product.title).displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-semibold">
                            \${applyMarkup(price).toFixed(2)}
                          </Badge>
                          <Button size="sm" variant="default">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Container description for spirits/beer (non-cocktails) */}
            {!isCocktailsTab && selectedCollection.products.slice(0, 5).map((product) => {
              const containerInfo = getContainerDescription(product.title);
              if (containerInfo) {
                return (
                  <div key={\`container-\${product.id}\`} className="bg-muted/50 p-3 mx-2 mb-4 rounded-lg border-l-4 border-primary">
                    <p className="text-sm text-muted-foreground">
                      <strong>Container Info:</strong> {containerInfo}
                    </p>
                  </div>
                );
              }
              return null;
            }).slice(0, 1)}

            {/* Regular Product Grid */}
            {(!isCocktailsTab || showSearch) && (
              <div className={\`px-2 lg:px-0\`}>
                {/* Container size info for spirits/beer */}
                {!showSearch && (selectedCategory === 0 || selectedCategory === 1) && selectedCollection.products.length > 0 && (
                  <div className="mb-4">
                    {getContainerDescription(selectedCollection.products[0].title) && (
                      <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary">
                        <p className="text-sm text-muted-foreground">
                          <strong>Container Info:</strong> {getContainerDescription(selectedCollection.products[0].title)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedCollection.products.slice(0, visibleProductCounts[selectedCategory] || 50).map((product) => {
                  const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
                  const variant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
                  const price = variant?.price || product.price;
                  const cartQty = getCartItemQuantity(product.id, variant?.id);
                  
                  return (
                    <div 
                      key={product.id} 
                      className={\`bg-card border rounded-lg transition-all duration-200 flex flex-col h-full \${
                        isCocktailsTab ? 'cursor-pointer hover:border-primary/50' : ''
                      } \${isSearchFocused ? 'p-2' : 'p-3'} hover:shadow-md\`}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Product image - condensed when search focused */}
                      <div className={\`bg-muted rounded overflow-hidden w-full aspect-square \${
                        isSearchFocused 
                          ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-1' : 'mb-2'
                          : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-2' : 'mb-3'
                      }\`}>
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Product details */}
                      <div className="flex-1 flex flex-col">
                        <h3 className={\`font-semibold text-foreground mb-1 \${isSearchFocused ? 'text-xs leading-tight' : 'text-sm'} line-clamp-2\`}>
                          {parseProductTitle(product.title).displayName}
                        </h3>
                        
                        {/* Variant selector for products with multiple variants */}
                        {!isSearchFocused && product.variants && product.variants.length > 1 && (
                          <div className="mb-2">
                            <Select 
                              value={selectedVariants[product.id] || product.variants[0]?.id} 
                              onValueChange={(value) => setSelectedVariants(prev => ({ ...prev, [product.id]: value }))}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {product.variants.map((v) => (
                                  <SelectItem key={v.id} value={v.id} className="text-xs">
                                    {v.title} - \${applyMarkup(v.price).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Container description for spirits/beer */}
                        {!isSearchFocused && !isCocktailsTab && (selectedCategory === 0 || selectedCategory === 1) && (
                          <div className="text-[10px] text-muted-foreground mb-1 leading-tight">
                            {getContainerDescription(product.title)}
                          </div>
                        )}
                        
                        <div className="mt-auto pt-2 flex flex-col items-center gap-2">
                          <Badge variant="secondary" className="product-price w-fit font-semibold text-center text-xs bg-primary/10 text-primary border-primary/20">
                            \${applyMarkup(price).toFixed(2)}
                          </Badge>
                          <div className="flex justify-center">
                            {cartQty > 0 ? (
                              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={\`\${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full\`} 
                                  onClick={() => handleQuantityChange(product.id, variant?.id, -1)}
                                >
                                  <Minus className={\`\${isMobile ? 'w-3 h-3' : 'w-3 h-3'}\`} />
                                </Button>
                                <span className={\`text-xs font-bold \${isMobile ? 'px-1 min-w-[1.5rem]' : 'px-2 min-w-[2rem]'} text-center\`}>
                                  {cartQty}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={\`\${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-primary hover:text-primary-foreground rounded-full\`} 
                                  onClick={() => handleQuantityChange(product.id, variant?.id, 1)}
                                >
                                  <Plus className={\`\${isMobile ? 'w-3 h-3' : 'w-3 h-3'}\`} />
                                </Button>
                              </div>
                            ) : (
                              <button 
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center transition-transform hover:scale-110" 
                                onClick={() => handleAddToCart(product, variant)}
                              >
                                <Plus className="w-4 h-4" strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Product Grid - optimized with React.memo and virtualization */}
            <div className={\`grid gap-1.5 lg:gap-3 \${(selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'grid-cols-3 lg:grid-cols-8' : 'grid-cols-3 lg:grid-cols-6'} \${showSearch && searchQuery.trim() ? 'hidden' : ''} \${isSearchFocused ? 'condensed-grid' : ''}\`}>
              {selectedCollection?.products.slice(0, visibleProductCounts[selectedCategory] || 50).map((product) => {
                // Handle variant selection for products with multiple variants
                const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
                const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
                const cartQty = getCartItemQuantity(product.id, selectedVariant?.id);
                
                return (
                  <div 
                    key={product.id} 
                    className={\`bg-card border rounded-lg transition-all duration-200 flex flex-col h-full \${
                      isCocktailsTab ? 'cursor-pointer hover:border-primary/50' : ''
                    } \${isSearchFocused ? 'p-2' : 'p-3'} hover:shadow-md\`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Product image - condensed when search focused */}
                    <div className={\`bg-muted rounded overflow-hidden w-full aspect-square \${
                      isSearchFocused 
                        ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-1' : 'mb-2'
                        : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-2' : 'mb-3'
                    }\`}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Product details */}
                    <div className="flex-1 flex flex-col">
                      <h3 className={\`font-semibold text-foreground mb-1 \${isSearchFocused ? 'text-xs leading-tight' : 'text-sm'} line-clamp-2\`}>
                        {parseProductTitle(product.title).displayName}
                      </h3>
                      
                      {/* Variant selector for products with multiple variants */}
                      {!isSearchFocused && product.variants && product.variants.length > 1 && (
                        <div className="mb-2">
                          <Select 
                            value={selectedVariants[product.id] || product.variants[0]?.id} 
                            onValueChange={(value) => setSelectedVariants(prev => ({ ...prev, [product.id]: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {product.variants.map((v) => (
                                <SelectItem key={v.id} value={v.id} className="text-xs">
                                  {v.title} - \${applyMarkup(v.price).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Container description for spirits/beer */}
                      {!isSearchFocused && !isCocktailsTab && (selectedCategory === 0 || selectedCategory === 1) && (
                        <div className="text-[10px] text-muted-foreground mb-1 leading-tight">
                          {getContainerDescription(product.title)}
                        </div>
                      )}
                      
                      <div className="mt-auto pt-2 flex flex-col items-center gap-2">
                        <Badge variant="secondary" className="product-price w-fit font-semibold text-center text-xs bg-primary/10 text-primary border-primary/20">
                          \${applyMarkup(selectedVariant?.price || product.price).toFixed(2)}
                        </Badge>
                        <div className="flex justify-center">
                          {cartQty > 0 ? (
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={\`\${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full\`} 
                                onClick={() => handleQuantityChange(product.id, selectedVariant?.id, -1)}
                              >
                                <Minus className={\`\${isMobile ? 'w-3 h-3' : 'w-3 h-3'}\`} />
                              </Button>
                              <span className={\`text-xs font-bold \${isMobile ? 'px-1 min-w-[1.5rem]' : 'px-2 min-w-[2rem]'} text-center\`}>
                                {cartQty}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={\`\${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-primary hover:text-primary-foreground rounded-full\`} 
                                onClick={() => handleQuantityChange(product.id, selectedVariant?.id, 1)}
                              >
                                <Plus className={\`\${isMobile ? 'w-3 h-3' : 'w-3 h-3'}\`} />
                              </Button>
                            </div>
                          ) : (
                            <button 
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center transition-transform hover:scale-110" 
                              onClick={() => handleAddToCart(product, selectedVariant)}
                            >
                              <Plus className="w-4 h-4" strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md w-full text-center mx-4">
              <CardHeader>
                <CardTitle>No Products Found</CardTitle>
                <CardDescription>
                  {showSearch && searchQuery.trim() 
                    ? \`No products found for "\${searchQuery}". Try a different search term.\`
                    : 'This category is currently empty. More products coming soon!'
                  }
                </CardDescription>
              </CardHeader>
              {showSearch && searchQuery.trim() && (
                <CardContent>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearch(false);
                      setSearchResults([]);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && !shouldHideMenusCompletely && !hideAllMenus && (
        <MobileBottomNav
          currentStep="products"
          cartItemCount={cartItems.length}
          onOpenCart={onOpenCart}
          onProceedToCheckout={onProceedToCheckout}
          onOpenSearch={() => {}}
        />
      )}

      {/* Product Lightbox for cocktails */}
      <ProductLightbox
        product={lightboxProduct}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onAddToCart={handleAddToCart}
      />
      
      {/* Back to Start button - shown only when showBackToStart is true */}
      {showBackToStart && onBackToStart && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={onBackToStart}
            variant="outline"
            size="sm"
            className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 text-foreground hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Start
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to checkout?</DialogTitle>
            <DialogDescription>
              You have {cartItemCount} items in your cart.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Continue Shopping
            </Button>
            <Button onClick={() => {
              setShowCheckoutDialog(false);
              onProceedToCheckout();
            }}>
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};