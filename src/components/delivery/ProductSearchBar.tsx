import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SearchOptimizer } from '@/utils/searchOptimizer';

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

  // Load all products on mount
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Apply affiliate/delivery-app markup to displayed prices (session-based)
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);


  const loadAllProducts = async () => {
    try {
      console.log('🔍 ProductSearchBar: Loading ALL products from catalog for search...');
      
      // Use get-unified-products to get the complete catalog (not delivery-app specific)
      const { data, error } = await supabase.functions.invoke('get-unified-products', {
        body: { 
          use_type: 'search', // Use search mode to get all products
          lightweight: false, // Get full product data for search
          force_refresh: false,
          limit: null // Remove any limits to get all 1068+ products
        }
      });

      if (error) {
        console.error('Error loading products for search:', error);
        return;
      }

      if (data?.products) {
        console.log(`🔍 Loaded ${data.products.length} products from full catalog for search`);
        setAllProducts(data.products);
      } else {
        console.warn('No products returned from unified products');
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error loading products for search:', error);
      setAllProducts([]);
    }
  };


  // Real-time hierarchical search with SearchOptimizer
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
    
    try {
      // Use SearchOptimizer for hierarchical search: Product Name > Collection > Category > Product Type
      const searchIndex = SearchOptimizer.buildSearchIndex(allProducts, 'product-search-bar');
      const results = SearchOptimizer.searchProductsWithHierarchy(q, searchIndex, 20);
      
      console.log(`🔍 ProductSearchBar HIERARCHICAL: Found ${results.length} products for "${q}" (Name > Collection > Category > Type)`);
      setSearchResults(results);
      setShowResults(!!showDropdownResults);
      onResultsChange?.(results, q);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
      onResultsChange?.([], q);
    } finally {
      setIsLoading(false);
      onSearchingChange?.(false);
    }
  }, [searchQuery, allProducts, showDropdownResults, onResultsChange, onSearchingChange]);

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
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={inputRef as any}
            className={`pl-10 pr-10 h-12 text-base border-2 border-primary/20 focus:border-primary ${inputClassName || ''}`}
          />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdownResults && showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-sm text-muted-foreground mb-2">
              Found {searchResults.length} products
            </div>
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={(e) => { e.preventDefault(); handleProductClick(product); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleProductClick(product); }}
                className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {product.title}
                    </div>
                    <div className="text-primary font-semibold">
                      ${typeof product.price === 'number' ? applyMarkup(product.price).toFixed(2) : product.price}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdownResults && showResults && searchResults.length === 0 && !isLoading && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
          <div className="text-muted-foreground">
            No products found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};