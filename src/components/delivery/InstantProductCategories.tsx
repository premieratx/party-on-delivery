import React, { useState, useMemo } from 'react';
import { SuperOptimizedProductGrid } from './SuperOptimizedProductGrid';
import { ProductSearchBar } from './ProductSearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';

interface InstantProductCategoriesProps {
  app_slug?: string;
  className?: string;
}

export const InstantProductCategories: React.FC<InstantProductCategoriesProps> = ({
  app_slug,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { collections, loading } = useOptimizedProductLoader({
    app_slug,
    lightweight: true,
    auto_refresh: true
  });

  // Extract unique categories from collections
  const categories = useMemo(() => {
    const cats = ['all'];
    collections.forEach(collection => {
      if (collection.handle && !cats.includes(collection.handle)) {
        cats.push(collection.handle);
      }
    });
    return cats;
  }, [collections]);

  const categoryDisplayNames: Record<string, string> = {
    all: 'All Products',
    beer: 'Beer',
    wine: 'Wine', 
    spirits: 'Spirits',
    mixers: 'Mixers & Sodas',
    snacks: 'Snacks',
    ice: 'Ice',
    other: 'Other'
  };

  const getProductCount = (category: string) => {
    if (category === 'all') {
      return collections.reduce((total, col) => total + (col.products?.length || 0), 0);
    }
    const collection = collections.find(col => col.handle === category);
    return collection?.products?.length || 0;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="w-full max-w-md mx-auto">
        <ProductSearchBar
          onProductSelect={(product) => console.log('Selected:', product)}
          placeholder="Search products..."
          value={searchTerm}
          onQueryChange={setSearchTerm}
          showDropdownResults={false}
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const count = getProductCount(category);
          if (count === 0 && category !== 'all') return null;
          
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-2"
            >
              {categoryDisplayNames[category] || category}
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Products Grid */}
      <SuperOptimizedProductGrid
        app_slug={app_slug}
        selectedCategory={selectedCategory === 'all' ? undefined : selectedCategory}
        searchTerm={searchTerm}
        limit={50}
      />
    </div>
  );
};