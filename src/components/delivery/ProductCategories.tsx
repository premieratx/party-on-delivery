import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft, CheckCircle, Wine, Search } from 'lucide-react';
import { ProductSearchBar } from './ProductSearchBar';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../DeliveryWidget';
import { ProductLightbox } from './ProductLightbox';
import { supabase } from '@/integrations/supabase/client';
import { getAllCollectionsCached } from '@/utils/instantCacheClient';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { parseProductTitle } from '@/utils/productUtils';

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
const lastYRef = useRef(0);
const [scrolled, setScrolled] = useState(false);

// Enhanced search interface with smooth UI transitions
const {
  isSearchFocused,
  hasUserInteracted,
  shouldHideChrome,
  isScrolling,
  shouldHideBottomMenu,
  searchInputRef,
  handleSearchFocus,
  handleSearchBlur
} = useSearchInterface({ 
  hideOnScroll: true,
  onSearchFocus: () => {
    // Additional focus handling can go here
  }
});

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

  // Mobile: enhanced tab hiding with smooth transitions
  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      if (y > last + 10) {
        setHideTabs(true);
      } else if (y < last - 10 || y < 40) {
        setHideTabs(false);
      }
      lastYRef.current = y;
    };
    window.addEventListener('scroll', onScroll as any, { passive: true } as any);
    return () => window.removeEventListener('scroll', onScroll as any);
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
          console.log('🔄 Attempting to load collections with getAllCollectionsCached...');
          const instant = await getAllCollectionsCached();
          console.log('📊 getAllCollectionsCached response:', instant);
          if (instant?.length) {
            console.log('✅ Main delivery app: Using cached collections from get-all-collections, count:', instant.length);
            setCollections(instant);
            setRetryCount(0);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ No collections returned from getAllCollectionsCached, falling back to other methods');
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
        console.log('Using getAllCollectionsCached for maximum speed');
        const collections = await getAllCollectionsCached(forceRefresh);
        console.log('Collections response received:', {
          collectionsCount: collections?.length || 0,
        });
        if (!collections || !Array.isArray(collections)) {
          throw new Error('Invalid response format: no collections array');
        }
        if (collections.length === 0) {
          throw new Error('No collections found in Shopify store');
        }
        return { collections };
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
        console.log(`Custom site: filtered from ${result.collections.length} to ${collectionsToShow.length} collections`);
        console.log('Custom site collections:', collectionsToShow.map((c: any) => `${c.handle} (${c.title})`));
      }
      
      // DEBUG: Log all collection handles for debugging
      console.log('=== COLLECTION HANDLES DEBUG ===');
      collectionsToShow.forEach((collection: any, index: number) => {
        console.log(`Collection ${index}: ${collection.handle} (${collection.title}) - ${collection.products?.length || 0} products`);
      });
      console.log('=== END DEBUG ===');
      
      setCollections(collectionsToShow);
      setRetryCount(0); // Reset retry count on success
      
      // Cache the successful result
      cacheManager.setShopifyCollections(result.collections);
      console.log('Collections cached successfully');
      
    } catch (error) {
      console.error('=== ERROR in fetchCollections ===');
      console.error('Error details:', error);
      ErrorHandler.logError(error, 'fetchCollections');
      
      // Auto-retry logic with exponential backoff
      if (autoRetryEnabled && retryCount < 3 && !forceRefresh) {
        const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s delays
        console.log(`Auto-retry ${retryCount + 1}/3 in ${retryDelay}ms...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCollections(false);
        }, retryDelay);
        
        setError(`Connection issue detected. Auto-retry ${retryCount + 1}/3 in progress...`);
        return;
      }
      
      // Try to use cached data as fallback
      const cachedCollections = cacheManager.getShopifyCollections();
      if (cachedCollections && cachedCollections.length > 0) {
        console.log(`Using cached collections as fallback (${cachedCollections.length} collections)`);
        setCollections(cachedCollections);
        setError('Using cached data - connection issues detected. Collections may not be current.');
      } else {
        console.log('No cache available - showing full error to user');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load collections: ${errorMessage}. Click retry or check Shopify connection.`);
      }
    } finally {
      setLoading(false);
      console.log('=== fetchCollections END ===');
    }
  };

  const clearCacheAndRefresh = () => {
    console.log('=== clearCacheAndRefresh called ===');
    setRetryCount(0); // Reset retry count
    setAutoRetryEnabled(true); // Re-enable auto retry
    cacheManager.remove(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS);
    // Also clear any local storage cache
    localStorage.removeItem('shopify-collections-cache');
    fetchCollections(true);
  };

  const selectedCollection = collections.find(c => c.handle === stepMapping[selectedCategory]?.handle);

  // Ensure selected category is valid when collections load or config changes
  useEffect(() => {
    if (collections.length > 0 && (selectedCategory >= displayedTabsCount || !selectedCollection)) {
      console.log('Auto-selecting first collection:', stepMapping[0]?.title);
      setSelectedCategory(0);
    }
  }, [collections, selectedCategory, selectedCollection, displayedTabsCount, stepMapping]);

  // Apply deep-linking after collections are available
  useEffect(() => {
    if (collections.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const cat = (params.get('category') || '').toLowerCase();
    const prodTitle = params.get('productTitle');

    if (cat) {
      const idx = stepMapping.findIndex((s) => s.handle.includes(cat));
      if (idx >= 0) setSelectedCategory(idx);
    }

    if (prodTitle) {
      // Give time for selectedCategory state to settle
      setTimeout(() => {
        const cocktailsIdx = stepMapping.findIndex((s) => s.handle.includes('cocktail'));
        const activeIdx = cat ? stepMapping.findIndex((s) => s.handle.includes(cat)) : cocktailsIdx;
        const coll = collections.find((c) => c.handle === stepMapping[activeIdx]?.handle);
        const found = coll?.products.find((p) => p.title.toLowerCase().includes(prodTitle.toLowerCase()));
        if (found) {
          setLightboxProduct(found as any);
          setIsLightboxOpen(true);
        }
      }, 300);
    }
  }, [collections, stepMapping.join ? stepMapping.join(',') : displayedTabsCount]);

  // Removed auto-select on last tab to allow clicking far-right tab
  // Previously this forced index 4 back to 0 when custom collections exist, which
  // made the last tab appear unclickable for 5-tab layouts.

  // Helper to get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variantId || 'default';
      return itemId === productId && itemVariant === checkVariant;
    });
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
    // Use onAddToCart to ensure product data is provided for CREATE
    const item = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant ? variant.id : product.variants[0]?.id,
    };
    console.log('🛒 ProductCategories: Adding product to cart:', item);
    onAddToCart(item as any);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    console.log('Updating quantity:', productId, variantId, 'from', currentQty, 'to', newQty);
    onUpdateQuantity(productId, variantId, newQty);
  };

  const handleNextTab = () => {
    if (selectedCategory < stepMapping.length - 1) {
      setSelectedCategory(selectedCategory + 1);
      // Scroll to top when changing tabs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // On the last tab, go directly to checkout
      onProceedToCheckout();
    }
  };

  const confirmCheckout = () => {
    setShowCheckoutDialog(false);
    onProceedToCheckout();
  };

  // Handle product click for cocktails (step 4 now)
  const handleProductClick = (product: ShopifyProduct) => {
    // Enable lightbox for cocktails collections
    if (isCocktailsTab) {
      setLightboxProduct(product);
      setIsLightboxOpen(true);
    }
  };

  const handleSearchSelect = (product: ShopifyProduct) => {
    const variantId = product.variants?.[0]?.id;
    // Use onAddToCart so product data is provided for new cart items
    onAddToCart({
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.variants?.[0]?.price || product.price || 0,
      image: product.image,
      variant: variantId,
    });
  };
  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxProduct(null);
  };

  // Receive search results from hero search bar
  const handleSearchResultsChange = (results: ShopifyProduct[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setIsSearching(false);
    setShowSearch(true);
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
              <h3 className="text-lg font-semibold text-destructive mb-2">Shopify Connection Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              
              {retryCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Auto-retry attempt {retryCount}/3 {retryCount < 3 ? 'in progress...' : 'failed'}
                  </p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mb-4">
                Please check that your Shopify credentials are properly configured in the Supabase secrets:
                <br />• SHOPIFY_STORE_URL
                <br />• SHOPIFY_STOREFRONT_ACCESS_TOKEN
                <br />• SHOPIFY_ADMIN_API_ACCESS_TOKEN
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={() => fetchCollections(true)} variant="outline">
                  Manual Retry
                </Button>
                <Button onClick={clearCacheAndRefresh} variant="outline">
                  Clear Cache & Force Refresh
                </Button>
                <Button 
                  onClick={() => setAutoRetryEnabled(!autoRetryEnabled)} 
                  variant={autoRetryEnabled ? "default" : "secondary"}
                  size="sm"
                >
                  Auto-retry: {autoRetryEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Hero Section with Austin Background - hidden when search is focused */}
      <div className={`relative overflow-visible transition-all duration-200 ${isSearchFocused ? 'h-0 opacity-0 pointer-events-none' : 'h-[22rem] lg:h-[34rem]'}`}>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroPartyAustin})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Search App Button - Top Left Corner of Hero (all views) */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => navigate('/search')}
            className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 rounded-lg px-3 py-2 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            aria-label="Open Search App"
          >
            <Search className="w-5 h-5 text-white" />
            <span className="hidden sm:inline text-white font-medium">Search</span>
          </button>
        </div>

        {/* Cart/Checkout - Top Right of Hero (mobile/tablet only) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenCart}
            onTouchEnd={onOpenCart}
            className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
            aria-label="Open Cart"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1 leading-none">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cartItemCount > 0) { onProceedToCheckout(); } }}
            disabled={cartItemCount === 0}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center ${cartItemCount > 0 ? 'bg-white/20 border border-white/30 hover:bg-white/30' : 'bg-white/10 border border-white/20 opacity-50 cursor-not-allowed'} ${selectedCategory === maxCategoryIndex && cartItemCount > 0 ? 'ring-2 ring-primary animate-pulse' : ''}`}
            aria-label="Checkout"
          >
            <CheckCircle className={`${cartItemCount > 0 ? 'text-white' : 'text-white/60'} w-5 h-5`} />
          </button>
        </div>

          {/* Centered Content - evenly spaced */}
          <div className="relative z-10 h-full flex flex-col justify-between text-center px-4 py-6">
            {/* Top: Logo + Titles */}
            <div className="flex flex-col items-center gap-2 mt-10 md:mt-14">
              <img 
                src={customLogoUrl || partyOnDeliveryLogo}
                alt={customAppName || "Party on Delivery"} 
                className="h-16 lg:h-56 object-contain drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = partyOnDeliveryLogo;
                }}
              />
              <h1 className="text-2xl lg:text-4xl font-bold text-white drop-shadow-lg">
                {customHeroHeading || (customAppName && customAppName.toLowerCase().includes('premier party cruises') ? "Premier Party Cruises Concierge Service" : customAppName) || "Build Your Party Package"}
              </h1>
              <p className="text-white/90 text-sm lg:text-base drop-shadow-lg">
                {customHeroSubheading || "Select from our curated collection of drinks and party supplies"}
              </p>
            </div>

            {/* Middle: Search removed per request (use sticky search above tabs) */}

            {/* Bottom: Typing Intro (shown only when text provided) */}
            {customHeroScrollingText && (
              <div className="mt-1 mb-2">
                <TypingIntro text={customHeroScrollingText} className="text-white text-xl lg:text-3xl" speedMs={65} />
              </div>
            )}
          </div>
      </div>

      <div className={`sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b transition-all duration-200 ${shouldHideMenusCompletely ? 'opacity-0 pointer-events-none -translate-y-full' : ''} ${shouldHideChrome && isSearchFocused ? 'shadow-lg' : ''} ${shouldHideChrome && (isSearchFocused || isScrolling) ? '-translate-y-0' : 'translate-y-0'}`}>
        {/* Sticky search bar above tabs */}
        <div className="w-full px-2 md:px-4 py-2 border-b bg-background/95 backdrop-blur-md">
          <div className="max-w-2xl mx-auto">
            <ProductSearchBar
              onProductSelect={handleSearchSelect}
              placeholder="Search all products..."
              showDropdownResults={false}
              onResultsChange={handleSearchResultsChange}
              onSearchingChange={setIsSearching}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              inputRef={searchInputRef}
              inputClassName={`${isSearchFocused ? 'border-primary shadow-lg' : ''}`}
            />
          </div>
        </div>


        {/* Category Tabs - Only 5 product tabs + checkout (no search tab) */}
        <div className={`w-full px-1 md:px-4 py-3 transition-all duration-200 ${shouldHideMenusCompletely ? 'opacity-0 pointer-events-none -translate-y-full' : ''} ${shouldHideChrome && isSearchFocused ? 'opacity-0 transform -translate-y-full pointer-events-none' : hideTabs || (shouldHideChrome && isScrolling) ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
          <div className={`flex flex-nowrap justify-center gap-px h-12 overflow-x-auto ${scrolled ? 'sm:h-16' : 'sm:h-20'}`} >
            {displayedTabs.map((step, index) => {
              const isActive = selectedCategory === index;
              const IconComponent = step.step === 0 ? Wine : step.step === 1 ? Beer : step.step === 2 ? Martini : step.step === 3 ? Package : Martini;
              
              return (
                <button
                  type="button"
                  key={step.handle}
                  onClick={() => {
                    setSelectedCategory(index);
                    // When switching tabs, hide search results until user focuses search again
                    setShowSearch(false);
                    const targetCollection = collections.find(c => c.handle === step.handle);
                    if (targetCollection) {
                      // No need to fetch, collection already loaded
                    }
                    // Scroll to top for a clean view of the selected tab
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`relative overflow-hidden h-full transition-all duration-300 group flex-[0_1_auto] shrink min-w-[56px] px-2 rounded-none first:rounded-l-md last:rounded-r-md ${
                    isActive 
                      ? 'bg-primary/10 border-2 border-primary shadow-lg' 
                      : 'bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40'
                  } ${flashIndex === index ? 'ring-2 ring-primary animate-[pulse_0.6s_ease-in-out]' : ''}`}

                >
                  <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-2">
                    {/* Mobile layout: just title */}
                    <div className="sm:hidden flex flex-col items-center justify-center h-full px-1">
                      <div className={`text-[12px] font-bold leading-[1rem] tracking-tight text-center whitespace-normal break-words ${
                        isActive ? 'text-primary' : 'text-foreground'
                      }`}>{step.title}</div>
                    </div>
                    
                    {/* Desktop layout: large title centered */}
                    <div className="hidden sm:block relative w-full h-full">
                      <div className="flex items-center justify-center h-full gap-2">
                        <div className={`font-bold ${scrolled ? 'text-lg' : 'text-xl'} text-center ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}>{step.title}</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            
          {/* Append Cart/Checkout as part of tabs (desktop) */}
          <button
            type="button"
            onClick={onOpenCart}
            className={`hidden sm:flex items-center justify-center h-full transition-all duration-300 group flex-none sm:basis-20 px-2 rounded-none bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40`}
            aria-label="Open Cart"
          >
            <span className="inline-flex flex-col items-center gap-1 font-bold">
              <span className="inline-flex items-center gap-1"><ShoppingCart className="w-4 h-4" /><span>Cart</span></span>
              {cartItemCount > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1 leading-none">
                  {cartItemCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cartItemCount > 0) { onProceedToCheckout(); } }}
            disabled={cartItemCount === 0}
            className={`hidden sm:flex items-center justify-center h-full transition-all duration-300 group flex-none sm:basis-20 px-2 rounded-r-md rounded-l-none ${cartItemCount > 0 ? 'bg-success text-success-foreground hover:bg-success/90 checkout-blink' : 'bg-muted text-muted-foreground cursor-not-allowed'} ${selectedCategory === maxCategoryIndex && cartItemCount > 0 ? 'ring-2 ring-success' : ''}`}
            aria-label="Checkout"
          >
            <span className="inline-flex flex-col items-center gap-1 font-bold">
              <span>Checkout</span>
              <CheckCircle className="w-4 h-4" />
            </span>
          </button>

          </div>
        </div>

        {/* Desktop Cart / Checkout controls inline with tabs */}
        <div className="hidden">
          <button
            onClick={onOpenCart}
            className={`relative h-12 ${scrolled ? 'sm:h-16' : 'sm:h-20'} px-4 bg-muted border border-muted-foreground/30 hover:bg-muted/80 rounded-none transition-colors`}
            aria-label="Open Cart"
          >
            <span className="inline-flex items-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1 leading-none">
                  {cartItemCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cartItemCount > 0) { onProceedToCheckout(); } }}
            disabled={cartItemCount === 0}
            className={`h-12 ${scrolled ? 'sm:h-16' : 'sm:h-20'} px-4 rounded-r-md rounded-l-none transition-colors ${cartItemCount > 0 ? 'bg-success text-success-foreground hover:bg-success/90 checkout-blink' : 'bg-muted text-muted-foreground cursor-not-allowed'} ${selectedCategory === maxCategoryIndex && cartItemCount > 0 ? 'ring-2 ring-success' : ''}`}
            aria-label="Checkout"
          >
            <span className="inline-flex flex-col items-center gap-1 text-sm">
              <span>Checkout</span>
              <CheckCircle className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* "Choose your..." guide row - shown only initially and when menus are not hidden */}
        {!hasUserInteracted && !shouldHideMenusCompletely && selectedCollection && (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50 animate-fade-in">
              <p className="text-muted-foreground text-center text-sm">
                👆 Choose your {stepMapping.find(step => step.handle === selectedCollection?.handle)?.title.toLowerCase() || selectedCollection?.title.toLowerCase()}
              </p>
            </div>
          </div>
        )}

        {/* Section Heading with functional arrows - hidden during cover/start screens */}
        {!shouldHideMenusCompletely && selectedCollection && (
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
                className={`p-2 rounded-full transition-colors ${
                  selectedCategory === maxCategoryIndex 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'text-primary hover:bg-primary/10 cursor-pointer animate-[pulse_1s_ease-in-out_2]'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {/* Add instruction text for cocktails only */}
            {isCocktailsTab && (
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">Click each item to see photos and details</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full px-1 md:px-4 py-4">
        {showSearch && searchQuery.trim() && (
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Found {searchResults.length} products</div>
            <div className="grid gap-1 md:gap-2 grid-cols-3 lg:grid-cols-6">
              {searchResults.slice(0, 50).map((product) => {
                const variant = product.variants?.[0];
                const price = variant?.price ?? product.price;
                const cartQty = getCartItemQuantity(product.id, variant?.id);
                return (
                  <div key={product.id} className="bg-card border rounded-lg p-3 hover:shadow-md transition-all duration-200 flex flex-col">
                    <div className="bg-muted rounded overflow-hidden w-full aspect-square mb-3">
                      <img src={product.image} alt={product.title} className="w-full h-full object-contain" />
                    </div>
                    <h4 className="font-bold leading-tight text-center text-sm mb-2 line-clamp-2">{product.title}</h4>
<div className="mt-auto pt-2 flex flex-col items-center gap-2">
  <Badge variant="secondary" className="w-fit font-semibold text-center text-xs">${applyMarkup(price).toFixed(2)}</Badge>
  <div className="flex justify-center">
                        {cartQty > 0 ? (
                          <div className="flex items-center gap-0.5 bg-muted rounded">
                            <Button variant="ghost" size="sm" className="h-1.5 w-1.5 sm:h-4 sm:w-4 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleQuantityChange(product.id, variant?.id, -1)}>
                              <Minus className="w-[6px] h-[6px] sm:w-[10px] sm:h-[10px]" />
                            </Button>
                            <span className="text-[10px] font-medium px-1 min-w-[1.25rem] text-center">{cartQty}</span>
                            <Button variant="ghost" size="sm" className="h-1.5 w-1.5 sm:h-4 sm:w-4 p-0 hover:bg-primary hover:text-primary-foreground" onClick={() => handleQuantityChange(product.id, variant?.id, 1)}>
                              <Plus className="w-[6px] h-[6px] sm:w-[10px] sm:h-[10px]" />
                            </Button>
                          </div>
                        ) : (
                          <button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-1 h-1 sm:w-5 sm:h-5 flex items-center justify-center" onClick={() => handleAddToCart(product, variant)}>
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={4} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Product Grid - optimized with React.memo and virtualization */}
        <div className={`grid gap-1.5 lg:gap-3 ${(selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'grid-cols-3 lg:grid-cols-8' : 'grid-cols-3 lg:grid-cols-6'} ${showSearch && searchQuery.trim() ? 'hidden' : ''} ${isSearchFocused ? 'condensed-grid' : ''}`}>
          {selectedCollection?.products.slice(0, visibleProductCounts[selectedCategory] || 50).map((product) => {
            // Handle variant selection for products with multiple variants
            const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
            const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
            const cartQty = getCartItemQuantity(product.id, selectedVariant?.id);
            
            return (
               <div 
                 key={product.id} 
                 className={`bg-card border rounded-lg transition-all duration-200 flex flex-col h-full ${
                   isCocktailsTab ? 'cursor-pointer hover:border-primary/50' : ''
                 } ${isSearchFocused ? 'p-2' : 'p-3'} hover:shadow-md`}
                 onClick={() => handleProductClick(product)}
               >
                 {/* Product image - condensed when search focused */}
                 <div className={`bg-muted rounded overflow-hidden w-full aspect-square ${
                   isSearchFocused 
                     ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-1' : 'mb-2'
                     : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'mb-2' : 'mb-3'
                 }`}>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                 
                 {/* Product info with condensed height when search focused */}
                 <div className={`flex flex-col flex-1 justify-between ${
                   isSearchFocused 
                     ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'min-h-[4.5rem]' : 'min-h-[6rem]'
                     : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'min-h-[6rem]' : 'min-h-[8rem]'
                 }`}>
                   <div className="flex-1 flex flex-col justify-start">
                    {(() => {
                      // For cocktails, show full title without truncation
                      if (isCocktailsTab) {
                        return (
                          <h4 className="font-bold leading-tight text-center text-sm mb-2">
                            {product.title}
                          </h4>
                        );
                      }
                      
                      // For other categories, use the utility function to parse title and package size
                      const { cleanTitle, packageSize } = parseProductTitle(product.title);
                      
                      // Special handling for ice product
                      let displayTitle = cleanTitle;
                      let displayPackage = packageSize;
                      
                      if (product.title.toLowerCase().includes('bag of ice')) {
                        displayTitle = product.title.replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*bs\s*$/gi, '').replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*$/g, '').trim();
                        displayPackage = '20 Lbs';
                      }
                      
                      return (
                         <>
                           <h4 className={`font-bold leading-tight text-center line-clamp-2 ${
                             isSearchFocused
                               ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'text-[10px] mb-0.5' : 'text-xs mb-1'
                               : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'text-xs mb-1' : 'text-sm mb-1'
                           }`}>
                             {displayTitle}
                           </h4>
                           {displayPackage && (
                             <p className={`text-foreground text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                               isSearchFocused
                                 ? (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'text-[8px] leading-2 mb-0.5' : 'text-[10px] mb-1'
                                 : (selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'text-[10px] leading-3 mb-1' : 'text-xs mb-1'
                             }`}>
                               {displayPackage}
                             </p>
                           )}
                        </>
                      );
                    })()}

                    {/* Variant selector for products with multiple variants */}
                    {product.variants.length > 1 ? (
                      <div className="mb-2">
                        <Select
                          value={selectedVariantId}
                          onValueChange={(variantId) => setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: variantId
                          }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {product.variants.map((variant) => (
                              <SelectItem key={variant.id} value={variant.id} className="text-xs">
                                {variant.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                      {/* Cocktail drink count - only show for cocktails */}
                      {isCocktailsTab && (() => {
                        const drinkMatch = product.description.match(/(\d+)\s*(?:drinks?|servings?|cocktails?)/i);
                        if (drinkMatch) {
                          return (
                            <p className="text-foreground text-center mb-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                              {drinkMatch[1]} drinks
                            </p>
                          );
                        }
                        return null;
                      })()}
                  </div>
                  
                  {/* Price and cart controls container - always at bottom */}
                  <div className="mt-auto pt-2 flex flex-col items-center gap-2">
                    {/* Price row - consistent alignment */}
                    <div className="flex items-center justify-center h-5">
<Badge variant="secondary" className="w-fit font-semibold text-center text-xs">
  ${applyMarkup(selectedVariant?.price || 0).toFixed(2)}
</Badge>
                    </div>
                      
                    {/* Oval Cart Controls - Mobile specific sizing */}
                    <div className="flex justify-center items-center">
                      {cartQty > 0 ? (
                        <div 
                          className="flex items-center justify-center bg-muted/80 rounded-full px-0.5 py-0.5 gap-0.5 min-w-[28px] h-6 border border-border/50 sm:px-2 sm:py-1 sm:gap-2 sm:min-w-[60px] sm:h-8" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center sm:h-6 sm:w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(product.id, selectedVariant?.id, -1);
                            }}
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2} />
                          </Button>
                          <span className="text-xs font-bold min-w-[16px] text-center sm:text-sm sm:min-w-[20px]">
                            {cartQty}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 rounded-full hover:bg-primary/20 hover:text-primary flex items-center justify-center sm:h-6 sm:w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(product.id, selectedVariant?.id, 1);
                            }}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2} />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors w-0.5 h-0.5 md:w-8 md:h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedVariant) {
                              onAddToCart({
                                id: product.id,
                                title: product.title,
                                name: product.title,
                                price: selectedVariant.price,
                                image: product.image,
                                variant: selectedVariant.id
                              });
                             setCartCountAnimation(true);
                             setTimeout(() => setCartCountAnimation(false), 300);
                           }
                          }}
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                       </button>
                     )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCollection?.products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products found in this collection.</p>
          </div>
        )}

        {collections.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Unable to load Shopify collections.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fetchCollections(true)} className="mt-4">
                Try Again
              </Button>
              <Button onClick={clearCacheAndRefresh} variant="outline" className="mt-4">
                Clear Cache & Retry
              </Button>
            </div>
          </div>
        )}

        {/* Next Button */}
        {selectedCollection && (
          <div className="flex justify-center mt-8 pb-8">
            <Button 
              variant="default" 
              size="xl" 
              onClick={handleNextTab}
              className="px-8 py-3"
            >
              {selectedCategory < stepMapping.length - 1 ? (
                <>
                  Next <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                'Proceed to Checkout'
              )}
             </Button>
           </div>
         )}

         {/* Show loading indicator when more products are available */}
         {selectedCollection && (visibleProductCounts[selectedCategory] || 0) < selectedCollection.products.length && (
           <div className="text-center py-8">
             <div className="flex items-center justify-center gap-2">
               <Loader2 className="h-6 w-6 animate-spin" />
               <p className="text-muted-foreground">
                 Showing {visibleProductCounts[selectedCategory] || 0} of {selectedCollection.products.length} products
               </p>
             </div>
             <Button 
               variant="outline" 
               onClick={loadMoreProducts}
               className="mt-4"
             >
               Load More Products
             </Button>
           </div>
         )}
       </div>

      
      {/* Navigation Footer */}
      {onBack && (
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step 4 of 6
            </div>
            {onBackToStart && (
              <Button
                variant="outline"
                size="lg"
                onClick={onBackToStart}
                className="flex items-center gap-2"
              >
                🏠 Back to Start
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Product Lightbox for cocktails */}
      <ProductLightbox
        product={lightboxProduct}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={onUpdateQuantity}
        cartQuantity={lightboxProduct ? getCartItemQuantity(lightboxProduct.id, selectedVariants[lightboxProduct.id] || lightboxProduct.variants[0]?.id) : 0}
        selectedVariant={lightboxProduct ? lightboxProduct.variants.find(v => v.id === (selectedVariants[lightboxProduct.id] || lightboxProduct.variants[0]?.id)) || lightboxProduct.variants[0] : undefined}
        onProceedToCheckout={onProceedToCheckout}
       />
     </div>
   );
 };