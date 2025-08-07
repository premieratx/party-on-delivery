import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

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
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onProductSelect,
  placeholder = "Search all products...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load all products on mount
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery]);

  const loadAllProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { force_refresh: false }
      });

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      if (data?.collections) {
        const products = data.collections.flatMap((collection: any) => 
          collection.products || []
        );
        setAllProducts(products);
      }
    } catch (error) {
      console.error('Error loading all products:', error);
    }
  };

  const performSearch = useCallback((query: string) => {
    if (!query.trim() || allProducts.length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    const searchTerm = query.toLowerCase();
    const results = allProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.handle?.toLowerCase().includes(searchTerm)
    ).slice(0, 20); // Limit to 20 results

    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  }, [allProducts]);

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
          className="pl-10 pr-10 h-12 text-base border-2 border-primary/20 focus:border-primary"
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
      {showResults && searchResults.length > 0 && (
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
      {showResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
          <div className="text-muted-foreground">
            No products found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};