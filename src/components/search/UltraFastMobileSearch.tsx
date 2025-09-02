import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  cleanTitle?: string;
  price: number;
  image: string;
  handle?: string;
  category?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface UltraFastMobileSearchProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSearchStart?: () => void;
  onSearchEnd?: () => void;
}

export const UltraFastMobileSearch: React.FC<UltraFastMobileSearchProps> = ({
  onProductSelect,
  placeholder = "🚀 Ultra-fast search...",
  className = "",
  autoFocus = false,
  onSearchStart,
  onSearchEnd
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTime, setSearchTime] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Ultra-fast search with <200ms target
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setSearchTime('');
      onSearchEnd?.();
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    onSearchStart?.();

    try {
      console.log(`🚀 ULTRA-FAST MOBILE SEARCH: "${searchQuery}"`);
      
      const searchResult = await optimizedUltraFastSearch.searchProductsInstant(searchQuery, {
        limit: isMobile ? 2000 : 2000 // Show all products in search
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ MOBILE SEARCH COMPLETED: "${searchQuery}" - ${searchResult.products.length} results in ${duration.toFixed(1)}ms`);
      
      setResults(searchResult.products);
      setShowResults(true);
      setSearchTime(`${duration.toFixed(0)}ms`);
      
      // Show performance toast for very fast searches
      if (duration < 100 && searchResult.fromLocalCache) {
        toast({
          title: `⚡ Ultra-fast search: ${duration.toFixed(0)}ms`,
          description: `Found ${searchResult.products.length} products instantly`,
          duration: 2000,
        });
      }

    } catch (error) {
      console.error('❌ Ultra-fast mobile search error:', error);
      setResults([]);
      setShowResults(false);
      setSearchTime('');
    } finally {
      setIsLoading(false);
      onSearchEnd?.();
    }
  }, [isMobile, onSearchStart, onSearchEnd, toast]);

  // Debounced search for real-time results
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, query.length > 2 ? 150 : 300); // Faster for longer queries

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Auto-focus on mobile if requested
  useEffect(() => {
    if (autoFocus && inputRef.current && isMobile) {
      // Delay focus to prevent iOS keyboard issues
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, isMobile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setShowResults(false);
    setResults([]);
    
    // Blur input to hide mobile keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSearchTime('');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (query.trim() && results.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't hide results if clicking on a result
    if (e.relatedTarget?.closest('[data-search-result]')) {
      return;
    }
    
    // Delay hiding to allow for result clicks
    setTimeout(() => {
      setShowResults(false);
    }, 150);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
          {searchTime && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {searchTime}
            </Badge>
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${searchTime ? 'pl-20' : 'pl-10'} pr-12 h-12 text-[16px] border-2 border-primary/20 focus:border-primary transition-all duration-200 touch-manipulation`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          inputMode="search"
          style={{ 
            fontSize: '16px', // Prevent iOS zoom
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {query && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              onTouchEnd={(e) => { e.preventDefault(); clearSearch(); }}
              className="h-6 w-6 p-0 touch-manipulation hover:bg-muted/50"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Ultra-Fast Results */}
      {showResults && results.length > 0 && (
        <div className={`${
          isMobile 
            ? 'fixed inset-x-2 top-20 bottom-20 z-[99999] bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl' 
            : 'absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-50 max-h-96'
        } overflow-y-auto overscroll-contain`}>
          
          {/* Performance Header */}
          <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {results.length} results
                </span>
              </div>
              {searchTime && (
                <Badge variant="outline" className="text-xs">
                  ⚡ {searchTime}
                </Badge>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="p-2 space-y-1">
            {results.map((product) => (
              <button
                key={product.id}
                data-search-result
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  handleProductSelect(product); 
                }}
                onTouchStart={(e) => { 
                  e.currentTarget.style.backgroundColor = 'hsl(var(--muted)/0.8)'; 
                }}
                onTouchEnd={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  e.currentTarget.style.backgroundColor = ''; 
                  handleProductSelect(product); 
                }}
                onTouchCancel={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
                className="w-full text-left p-3 hover:bg-muted/50 active:bg-muted/80 rounded-lg transition-all duration-150 touch-manipulation border border-transparent hover:border-border/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-md"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-tight truncate mb-1 group-hover:text-primary transition-colors">
                      {product.cleanTitle || product.title}
                    </div>
                    <div className="text-primary font-bold text-base">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
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
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !isLoading && query.trim() && (
        <div className={`${
          isMobile 
            ? 'fixed inset-x-2 top-20 z-[99999] bg-background border border-border rounded-lg shadow-xl' 
            : 'absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50'
        } p-6 text-center`}>
          <div className="text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="font-medium">No products found</div>
            <div className="text-sm">Try a different search term</div>
          </div>
        </div>
      )}
    </div>
  );
};