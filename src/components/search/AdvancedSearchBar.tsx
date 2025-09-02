import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          <Input
            ref={inputRef}
            type="search"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-10 pr-10 text-[16px] touch-manipulation"
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

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};