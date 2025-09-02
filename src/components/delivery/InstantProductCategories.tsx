import React, { useState, useMemo } from 'react';
import { SuperOptimizedProductGrid } from './SuperOptimizedProductGrid';
import { ProductSearchBar } from './ProductSearchBar';
import { UltraFastMobileSearch } from '@/components/search/UltraFastMobileSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUltraFastProductLoader } from '@/hooks/useUltraFastProductLoader';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Use existing ultra-fast system from ultra-fast-search
  const { products, loading } = useUltraFastProductLoader();

  // Extract unique categories from products (preserves collection organization)
  const categories = useMemo(() => {
    const cats = ['all'];
    const categorySet = new Set<string>();
    
    products.forEach(product => {
      // Use collection handles as categories to preserve Shopify organization
      product.collection_handles?.forEach(handle => {
        if (handle && !categorySet.has(handle)) {
          categorySet.add(handle);
          cats.push(handle);
        }
      });
    });
    
    return cats;
  }, [products]);

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
      return products.length;
    }
    return products.filter(product => 
      product.collection_handles?.includes(category)
    ).length;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Ultra-Fast Mobile Search or Regular Search */}
      <div className="w-full max-w-md mx-auto">
        {isMobile ? (
          <UltraFastMobileSearch
            onProductSelect={(product) => {
              console.log('Ultra-fast selected:', product);
              // Update search term to show results in grid
              setSearchTerm(product.title);
            }}
            placeholder="🚀 Ultra-fast search..."
            autoFocus={false}
            onSearchStart={() => console.log('🔍 Ultra-fast search started')}
            onSearchEnd={() => console.log('✅ Ultra-fast search complete')}
          />
        ) : (
          <ProductSearchBar
            onProductSelect={(product) => console.log('Selected:', product)}
            placeholder="Search products..."
            value={searchTerm}
            onQueryChange={setSearchTerm}
            showDropdownResults={false}
          />
        )}
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
        limit={500}
      />
    </div>
  );
};