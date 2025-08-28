import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, MicOff, Clock, X, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';

interface AdvancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  allProducts?: any[];
  autoFocus?: boolean;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search products...",
  className = "",
  allProducts = [],
  autoFocus = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    searchHistory,
    addToHistory,
    clearHistory,
    isListening,
    voiceSupported,
    startVoiceSearch,
    stopVoiceSearch
  } = useAdvancedSearch(allProducts, {
    enableHistory: true,
    enableVoice: true
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestionText: string) => {
    onChange(suggestionText);
    addToHistory(suggestionText);
    setShowSuggestions(false);
    onSubmit();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      addToHistory(value.trim());
      onSubmit();
      setShowSuggestions(false);
    }
  };

  // Handle voice search
  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'category':
      case 'brand':
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-20"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  setShowSuggestions(false);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {voiceSupported && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={`h-6 w-6 p-0 ${isListening ? 'text-red-500' : ''}`}
              >
                {isListening ? (
                  <MicOff className="h-3 w-3" />
                ) : (
                  <Mic className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (value || suggestions.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-3 group"
                  onClick={() => handleSuggestionSelect(suggestion.text)}
                  role="option"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1 truncate">{suggestion.text}</span>
                  {suggestion.count && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                  {suggestion.type === 'recent' && (
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Recent
                    </span>
                  )}
                </button>
              ))}

              {searchHistory.length > 0 && (
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={clearHistory}
                    className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50"
                  >
                    Clear search history
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No suggestions found
            </div>
          )}
        </div>
      )}

      {/* Voice feedback indicator */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening... Speak now
          </div>
        </div>
      )}
    </div>
  );
};