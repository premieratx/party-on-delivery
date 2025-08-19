import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchInterface } from '@/hooks/useSearchInterface';

interface Tab {
  id: string;
  title: string;
  handle: string;
  icon?: string;
}

interface CombinedSearchTabsProps {
  tabs: Tab[];
  selectedCategory: number;
  onTabSelect: (index: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  showSearch?: boolean;
  isSearchActive?: boolean;
  onSearchActiveChange?: (active: boolean) => void;
  isSearching?: boolean;
}

export const CombinedSearchTabs = ({
  tabs,
  selectedCategory,
  onTabSelect,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  showSearch = true,
  isSearchActive = false,
  onSearchActiveChange,
  isSearching = false
}: CombinedSearchTabsProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { headerCompressed } = useSearchInterface();

  // Auto-expand search when user starts typing
  useEffect(() => {
    if (searchQuery?.trim()) {
      setIsSearchExpanded(true);
      onSearchActiveChange?.(true);
    } else {
      onSearchActiveChange?.(false);
    }
  }, [searchQuery, onSearchActiveChange]);

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    onSearchActiveChange?.(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery?.trim()) {
      setIsSearchExpanded(false);
      onSearchActiveChange?.(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    onSearchActiveChange?.(true);
  };

  return (
    <div className="sticky top-0 z-40 bg-background border-b shadow-sm transition-all duration-300">
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap px-4 py-2 h-10 min-w-fit flex-shrink-0 transition-all duration-200"
                  onClick={() => onTabSelect(index)}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  <span>{tab.title}</span>
                </Button>
              ))}
            </div>
            
            {/* Search Bar */}
            {showSearch && (
              <div className="flex w-80">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="rounded-r-none"
                  onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                />
                <Button 
                  onClick={onSearchSubmit}
                  className="rounded-l-none px-3"
                  disabled={isSearching}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden">
        {/* First Row - Tabs and Search Icon */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap text-xs px-2 py-1 h-8 min-w-fit flex-shrink-0 transition-all duration-200"
                  onClick={() => onTabSelect(index)}
                >
                  {tab.icon && <span className="mr-1 text-xs">{tab.icon}</span>}
                  <span className="text-xs">{tab.title}</span>
                </Button>
              ))}
            </div>
            
            {/* Search Icon */}
            {showSearch && !isSearchExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchIconClick}
                className="ml-2 flex-shrink-0 h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Second Row - Expanded Search Bar (Mobile only) */}
        {showSearch && isSearchExpanded && (
          <div className="container mx-auto px-4 pb-3">
            <div className="flex">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="rounded-r-none"
                onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                autoFocus
              />
              <Button 
                onClick={onSearchSubmit}
                className="rounded-l-none px-3"
                disabled={isSearching}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};