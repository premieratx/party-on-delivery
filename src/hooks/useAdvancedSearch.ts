import { useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';

interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'recent';
  count?: number;
}

interface AdvancedSearchOptions {
  maxSuggestions?: number;
  enableHistory?: boolean;
  enableVoice?: boolean;
  debounceMs?: number;
}

export function useAdvancedSearch(
  allProducts: any[] = [],
  options: AdvancedSearchOptions = {}
) {
  const {
    maxSuggestions = 8,
    enableHistory = true,
    enableVoice = true,
    debounceMs = 300
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory) {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved));
        } catch (error) {
          console.warn('Failed to load search history:', error);
        }
      }
    }
  }, [enableHistory]);

  // Check voice support
  useEffect(() => {
    if (enableVoice && 'webkitSpeechRecognition' in window) {
      setVoiceSupported(true);
    }
  }, [enableVoice]);

  // Generate suggestions based on products and search history
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim()) {
      // Show recent searches when no query
      return searchHistory.slice(0, maxSuggestions).map(term => ({
        text: term,
        type: 'recent' as const
      }));
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Recent searches that match current query
    searchHistory
      .filter(term => term.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach(term => {
        suggestions.push({
          text: term,
          type: 'recent'
        });
      });

    // Extract unique categories, brands, and product names with better matching
    const categories = new Set<string>();
    const brands = new Set<string>();
    const productTitles = new Set<string>();

    allProducts.forEach(product => {
      // Better category matching
      if (product.category && product.category.toLowerCase().includes(queryLower)) {
        categories.add(product.category);
      }
      if (product.product_type && product.product_type.toLowerCase().includes(queryLower)) {
        categories.add(product.product_type);
      }
      
      // Brand/vendor matching
      if (product.vendor && product.vendor.toLowerCase().includes(queryLower)) {
        brands.add(product.vendor);
      }
      
      // Product title matching with priority for starts-with
      if (product.title) {
        const titleLower = product.title.toLowerCase();
        if (titleLower.startsWith(queryLower) || titleLower.includes(queryLower)) {
          productTitles.add(product.cleanTitle || product.title);
        }
      }
    });

    // Add category suggestions with counts
    Array.from(categories).slice(0, 2).forEach(category => {
      const count = allProducts.filter(p => 
        p.category === category || p.product_type === category
      ).length;
      suggestions.push({
        text: category,
        type: 'category',
        count
      });
    });

    // Add brand suggestions with counts
    Array.from(brands).slice(0, 2).forEach(brand => {
      const count = allProducts.filter(p => p.vendor === brand).length;
      suggestions.push({
        text: brand,
        type: 'brand',
        count
      });
    });

    // Add product title suggestions (prioritize exact starts-with matches)
    const exactMatches = Array.from(productTitles)
      .filter(title => title.toLowerCase().startsWith(queryLower))
      .slice(0, 3);
    
    const partialMatches = Array.from(productTitles)
      .filter(title => !title.toLowerCase().startsWith(queryLower))
      .slice(0, Math.max(0, 3 - exactMatches.length));
    
    [...exactMatches, ...partialMatches].forEach(title => {
      suggestions.push({
        text: title,
        type: 'product'
      });
    });

    return suggestions.slice(0, maxSuggestions);
  }, [allProducts, searchHistory, maxSuggestions]);

  // Update suggestions when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions(searchQuery));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, generateSuggestions, debounceMs]);

  // Add to search history
  const addToHistory = useCallback((query: string) => {
    if (!enableHistory || !query.trim()) return;

    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [enableHistory, searchHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!voiceSupported || isListening) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      addToHistory(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [voiceSupported, isListening, addToHistory]);

  // Stop voice search
  const stopVoiceSearch = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    searchHistory,
    addToHistory,
    clearHistory,
    isListening,
    voiceSupported,
    startVoiceSearch,
    stopVoiceSearch
  };
}