import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ultraFastSmartCache } from '@/utils/ultraFastSmartCache';
import { useSearchInterface } from '@/hooks/useSearchInterface';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  handle?: string;
  vendor?: string;
  category?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ProductSearchBarProps {
  onProductSelect: (product: ShopifyProduct) => void;
  placeholder?: string;
  className?: string;
  showDropdownResults?: boolean;
  onResultsChange?: (results: ShopifyProduct[], query: string) => void;
  onSearchingChange?: (searching: boolean) => void;
  // Controlled mode (optional)
  value?: string;
  onQueryChange?: (value: string) => void;
  // UX hooks
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  inputClassName?: string;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onProductSelect,
  placeholder = "Search all 1,068 products in catalog...",
  className = "",
  showDropdownResults = true,
  onResultsChange,
  onSearchingChange,
  value,
  onQueryChange,
  onFocus,
  onBlur,
  inputRef,
  inputClassName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  
  const isMobile = useIsMobile();
  const { 
    searchInputRef, 
    handleSearchFocus, 
    handleSearchBlur, 
    isSearchFocused,
    shouldHideChrome,
    shouldHideBottomMenu 
  } = useSearchInterface({
    onSearchFocus: onFocus,
    onSearchBlur: onBlur
  });

  // Load all products on mount
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Apply affiliate/delivery-app markup to displayed prices (session-based)
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);


  const loadAllProducts = async () => {
    try {
      console.log('🔥 ProductSearchBar: ULTRA-FAST cache warming...');
      
      // Use ultra-fast smart cache for sub-200ms loading
      await ultraFastSmartCache.getProductsInstant();
      
      console.log('✅ ULTRA-FAST: Search cache ready for sub-0.2s results');
      setAllProducts([]); // Not needed since search is handled by smart cache
    } catch (error) {
      console.error('Error warming search cache:', error);
      setAllProducts([]);
    }
  };


  // Real-time optimized search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setShowResults(false);
      onResultsChange?.([], '');
      onSearchingChange?.(false);
      return;
    }

    setIsLoading(true);
    onSearchingChange?.(true);
    
    const performSearch = async () => {
      try {
        // Use ultra-fast smart cache for instant comprehensive search
        const result = await ultraFastSmartCache.searchProductsInstant(q, { limit: 50 });
        
        console.log(`🔍 ProductSearchBar ULTRA-FAST: Found ${result.products.length}/${result.totalFound} products for "${q}" in ${result.loadTime}`);
        setSearchResults(result.products);
        setShowResults(!!showDropdownResults);
        onResultsChange?.(result.products, q);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowResults(false);
        onResultsChange?.([], q);
      } finally {
        setIsLoading(false);
        onSearchingChange?.(false);
      }
    };

    performSearch();
  }, [searchQuery, showDropdownResults, onResultsChange, onSearchingChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleProductClick = (product: ShopifyProduct) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className={`relative w-full ${className} ${isMobile && isSearchFocused ? 'z-[100]' : ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            type="search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            ref={inputRef || searchInputRef}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            inputMode="search"
            className={`pl-10 ${isLoading ? 'pr-14' : 'pr-10'} h-12 text-[16px] border-2 border-primary/20 focus:border-primary transition-colors touch-manipulation ${inputClassName || ''}`}
            style={{ 
              fontSize: '16px', // Prevent iOS zoom
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
        {!isLoading && searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            onTouchEnd={(e) => { e.preventDefault(); clearSearch(); }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdownResults && showResults && searchResults.length > 0 && (
        <div className={`${
          isMobile && isSearchFocused 
            ? 'fixed inset-x-2 top-20 bottom-20 z-[9999] bg-background border border-border rounded-lg shadow-2xl' 
            : 'absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96'
        } overflow-y-auto overscroll-contain`}>
          <div className="p-3">
            <div className="text-sm text-muted-foreground mb-3 font-medium">
              Found {searchResults.length} products
            </div>
            <div className="space-y-1">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    handleProductClick(product); 
                  }}
                  onTouchStart={(e) => { 
                    e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; 
                  }}
                  onTouchEnd={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.currentTarget.style.backgroundColor = ''; 
                    handleProductClick(product); 
                  }}
                  onTouchCancel={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                  className="w-full text-left p-3 hover:bg-muted active:bg-muted/80 rounded-lg transition-colors touch-manipulation border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight truncate mb-1">
                        {product.title}
                      </div>
                      <div className="text-primary font-bold text-base">
                        ${typeof product.price === 'number' ? applyMarkup(product.price).toFixed(2) : product.price}
                      </div>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdownResults && showResults && searchResults.length === 0 && !isLoading && searchQuery.trim() && (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center ${
          isMobile && isSearchFocused ? 'fixed left-4 right-4 top-16' : ''
        }`}>
          <div className="text-muted-foreground">
            No products found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};