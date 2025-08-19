import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, CreditCard } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  count: number;
  description: string;
  image: string;
}

interface CombinedSearchTabsCustomProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (categoryId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showSearchModal: boolean;
  onToggleSearch: () => void;
  collections: any[];
  mapCollectionToCategory: (handle: string) => string;
  // Cart and checkout functionality
  cartItemCount?: number;
  totalAmount?: number;
  onOpenCart?: () => void;
  onCheckout?: () => void;
}

export const CombinedSearchTabsCustom = ({
  categories,
  activeCategory,
  onCategorySelect,
  searchTerm,
  onSearchChange,
  showSearchModal,
  onToggleSearch,
  collections,
  mapCollectionToCategory,
  cartItemCount = 0,
  totalAmount = 0,
  onOpenCart,
  onCheckout
}: CombinedSearchTabsCustomProps) => {
  return (
    <>
      {/* Search Bar - STICKY WHEN MODAL ACTIVE */}
      {showSearchModal && (
        <div className="sticky top-[60px] z-50 bg-background border-b shadow-sm">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs - ALWAYS STICKY */}
      <div className={`sticky ${showSearchModal ? 'top-[136px]' : 'top-[60px]'} z-40 bg-white border-b shadow-sm`}>
        {/* Desktop Layout - Side by side */}
        <div className="hidden md:block">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Tabs */}
              <div className="flex overflow-x-auto scrollbar-hide flex-1">
                {categories.map((category) => {
                  const categoryProducts = collections
                    .filter(collection => mapCollectionToCategory(collection.handle) === category.id)
                    .flatMap(collection => collection.products);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => onCategorySelect(category.id)}
                      className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                        activeCategory === category.id
                          ? 'border-purple-500 text-purple-600 bg-purple-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <category.icon className="w-3 h-3" />
                        <span className="whitespace-nowrap">{category.name}</span>
                        {categoryProducts.length > 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {categoryProducts.length}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Running Total */}
              {totalAmount > 0 && (
                <div className="text-lg font-bold text-purple-600 whitespace-nowrap">
                  ${totalAmount.toFixed(2)}
                </div>
              )}
              
              {/* Cart and Checkout Buttons */}
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  onClick={onOpenCart}
                  className="flex items-center gap-2 h-8 text-xs"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart ({cartItemCount})</span>
                </Button>
                
                <Button
                  onClick={onCheckout}
                  className="flex items-center gap-2 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Checkout</span>
                </Button>
              </div>

              {/* Search Icon */}
              {!showSearchModal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSearch}
                  className="p-2 flex-shrink-0 h-8 w-8"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block md:hidden">
          {/* First Row - Tabs and Search Icon */}
          <div className="max-w-md mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <div className="flex overflow-x-auto scrollbar-hide flex-1">
                {categories.map((category) => {
                  const categoryProducts = collections
                    .filter(collection => mapCollectionToCategory(collection.handle) === category.id)
                    .flatMap(collection => collection.products);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => onCategorySelect(category.id)}
                      className={`flex-shrink-0 px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
                        activeCategory === category.id
                          ? 'border-purple-500 text-purple-600 bg-purple-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <category.icon className="w-3 h-3" />
                        <span className="whitespace-nowrap">{category.name}</span>
                        {categoryProducts.length > 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {categoryProducts.length}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Search Icon */}
              {!showSearchModal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSearch}
                  className="ml-2 flex-shrink-0 h-8 w-8 p-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Second Row - Cart and Checkout (Mobile Split Layout) */}
          <div className="max-w-md mx-auto px-4 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Cart Button */}
              <Button
                variant="outline"
                onClick={onOpenCart}
                className="flex items-center justify-center gap-2 h-8 text-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({cartItemCount})</span>
                {totalAmount > 0 && (
                  <span className="font-bold">${totalAmount.toFixed(2)}</span>
                )}
              </Button>
              
              {/* Checkout Button */}
              <Button
                onClick={onCheckout}
                className="flex items-center justify-center gap-2 h-8 text-xs bg-purple-600 hover:bg-purple-700"
              >
                <CreditCard className="w-4 h-4" />
                <span>Checkout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};