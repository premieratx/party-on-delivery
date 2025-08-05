import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Beer, Martini, Package, Plus, Minus, Loader2, ChevronRight, ArrowLeft, ChevronLeft, CheckCircle, Wine, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { parseProductTitle } from '@/utils/productUtils';
import { SearchIcon } from '@/components/common/SearchIcon';
import beerCategoryBg from '@/assets/beer-category-bg.jpg';
import cocktailCategoryBg from '@/assets/cocktail-category-bg.jpg';
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

interface CartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
}

export default function AirbnbConciergeServiceTabsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Custom app configuration - airbnb-concierge-service
  const stepMapping = [
    { step: 0, title: 'Cocktails', handle: 'cocktail-kits', backgroundImage: cocktailCategoryBg, pageTitle: 'Choose Your Cocktails' },
    { step: 1, title: 'Liquor', handle: 'spirits', backgroundImage: spiritsCategoryBg, pageTitle: 'Choose Your Liquor' },
    { step: 2, title: 'Beer', handle: 'tailgate-beer', backgroundImage: beerCategoryBg, pageTitle: 'Choose Your Beer' }
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⚡ Loading airbnb-concierge-service collections...');

      // Try instant cache first
      try {
        const { data: instantData, error: instantError } = await supabase.functions.invoke('instant-product-cache');
        
        if (!instantError && instantData?.collections) {
          console.log('✅ Using instant cached collections');
          const filteredCollections = instantData.collections.filter((collection: ShopifyCollection) => 
            ['cocktail-kits', 'spirits', 'tailgate-beer'].includes(collection.handle)
          );
          setCollections(filteredCollections);
          
          // Also set all products for search
          const products = filteredCollections.flatMap((collection: ShopifyCollection) => collection.products);
          setAllProducts(products);
          
          setLoading(false);
          return;
        }
      } catch (instantError) {
        console.log('⚠️ Instant cache failed, trying fallback...');
      }

      // Fallback to cache manager
      const cachedCollections = cacheManager.getShopifyCollections();
      if (cachedCollections && cachedCollections.length > 0) {
        console.log('Using cached collections from cache manager');
        const filteredCollections = cachedCollections.filter((collection: ShopifyCollection) => 
          ['cocktail-kits', 'spirits', 'tailgate-beer'].includes(collection.handle)
        );
        setCollections(filteredCollections);
        
        const products = filteredCollections.flatMap((collection: ShopifyCollection) => collection.products);
        setAllProducts(products);
        
        setLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollection = collections.find(c => c.handle === stepMapping[selectedCategory]?.handle);

  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (product: ShopifyProduct, variant?: any) => {
    const cartItem: CartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant ? variant.id : product.variants[0]?.id,
      quantity: 1
    };
    
    const existingItemIndex = cartItems.findIndex(item => 
      item.id === cartItem.id && item.variant === cartItem.variant
    );
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, cartItem]);
    }
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const existingItemIndex = cartItems.findIndex(item => 
      item.id === productId && item.variant === variantId
    );
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + delta;
      
      if (newQuantity <= 0) {
        updatedItems.splice(existingItemIndex, 1);
      } else {
        updatedItems[existingItemIndex].quantity = newQuantity;
      }
      
      setCartItems(updatedItems);
    }
  };

  const getCurrentProducts = () => {
    if (isSearchMode && searchTerm) {
      return allProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return selectedCollection?.products || [];
  };

  const handleCheckout = () => {
    // Store cart items and navigate to checkout
    localStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));
    localStorage.setItem('currentAppContext', JSON.stringify({
      appName: 'airbnb-concierge-service'
    }));
    navigate('/checkout');
  };

  const handleBackToStart = () => {
    navigate('/airbnb-concierge-service');
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Products</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchCollections()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentProducts = getCurrentProducts();

  return (
    <div className="min-h-screen relative">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stepMapping[selectedCategory]?.backgroundImage || heroPartyAustin})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 text-white">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToStart}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <img 
            src={partyOnDeliveryLogo} 
            alt="Party On Delivery" 
            className="h-12 w-auto"
          />
          
          {totalCartItems > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCheckout}
              className="text-white hover:bg-white/20"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart ({totalCartItems})
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="text-center text-white px-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Lynn's Lodgings Concierge Service
          </h1>
          <p className="text-white/80">
            {isSearchMode ? 'Search Results' : stepMapping[selectedCategory]?.pageTitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-6">
          <div className="max-w-md mx-auto relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchMode(e.target.value.length > 0);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/90 border-0 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        {!isSearchMode && (
          <div className="px-4 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stepMapping.map((step, index) => (
                <Button
                  key={step.step}
                  variant={selectedCategory === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(index)}
                  className={`whitespace-nowrap ${
                    selectedCategory === index 
                      ? 'bg-primary text-white' 
                      : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  {step.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentProducts.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants[0]?.id);
              const { cleanTitle, packageSize } = parseProductTitle(product.title);
              
              return (
                <Card key={product.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1">
                      {packageSize && (
                        <Badge variant="secondary" className="text-xs">
                          {packageSize}
                        </Badge>
                      )}
                      <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                        {cleanTitle || product.title}
                      </CardTitle>
                      <p className="text-lg font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {quantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(product.id, product.variants[0]?.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-lg px-3">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(product.id, product.variants[0]?.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="w-full h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bottom Cart Bar */}
        {totalCartItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{totalCartItems} items in cart</p>
                <p className="text-sm text-white/80">
                  Total: ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCheckout}
                className="bg-white text-primary hover:bg-white/90"
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}