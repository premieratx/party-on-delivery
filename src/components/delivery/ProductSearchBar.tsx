import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { getAllCollectionsCached } from '@/utils/instantCacheClient';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
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
  inputRef?: React.RefObject<HTMLInputElement>;
  inputClassName?: string;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onProductSelect,
  placeholder = "Search all products...",
  className = "",
  showDropdownResults = true,
  onResultsChange,
  onSearchingChange,
  value,
  onQueryChange,
  onFocus,
  inputRef,
  inputClassName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [indexedProducts, setIndexedProducts] = useState<{ p: ShopifyProduct; t: string }[]>([]);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  // Load all products on mount
  useEffect(() => {
    loadAllProducts();
  }, []);



  const loadAllProducts = async () => {
    try {
      const collections = await getAllCollectionsCached();
      const products = (collections || []).flatMap((collection: any) => collection.products || []);
      setAllProducts(products);
      // Pre-index for faster search
      const indexed = products.map((p: ShopifyProduct) => ({
        p,
        t: `${p.title} ${p.description || ''} ${p.handle || ''}`.toLowerCase()
      }));
      setIndexedProducts(indexed);
    } catch (error) {
      console.error('Error loading all products:', error);
    }
  };

  const performSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q || indexedProducts.length === 0) {
      setSearchResults([]);
      setShowResults(false);
      onResultsChange?.([], q);
      onSearchingChange?.(false);
      return;
    }

    setIsSearching(true);
    onSearchingChange?.(true);
    const searchTerm = q.toLowerCase();
    const results = indexedProducts
      .filter(ip => ip.t.includes(searchTerm))
      .slice(0, 50)
      .map(ip => ip.p);

    setSearchResults(results);
    setShowResults(!!showDropdownResults);
    setIsSearching(false);
    onResultsChange?.(results, q);
    onSearchingChange?.(false);
  }, [indexedProducts, showDropdownResults]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
      onResultsChange?.([], '');
      onSearchingChange?.(false);
    }
  }, [debouncedSearchQuery, performSearch]);

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
        {isSearching && (
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
                onClick={() => handleProductClick(product)}
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
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdownResults && showResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
          <div className="text-muted-foreground">
            No products found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};