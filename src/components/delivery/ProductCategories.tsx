// COMPLETE SYSTEM SHUTDOWN v2025_01_14_21_25
// ALL COLLECTIONS LOADING DISABLED

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: any[];
  image?: string;
}

interface ProductCategoriesProps {
  onSearchQueryChange?: (query: string) => void;
  externalSearchQuery?: string;
  customSiteSlug?: string;
  showSearch?: boolean;
  maxProducts?: number;
  forceRefresh?: boolean;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  onSearchQueryChange,
  externalSearchQuery = '',
  customSiteSlug,
  showSearch = true,
  maxProducts = 50
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();

  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // COMPLETELY DISABLED - NO COLLECTIONS LOADING
  const fetchCollections = useCallback(async () => {
    console.log('🚫 Collections loading DISABLED - no preloading');
    setCollections([]);
    setLoading(false);
    setError('Collections loading disabled to prevent preloading issues');
  }, []);

  const currentCollection = useMemo(() => {
    return { 
      id: 'disabled', 
      title: 'Collections Disabled', 
      handle: 'disabled',
      description: 'Collections loading has been disabled to prevent preloading issues',
      products: [] 
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Collections Loading Disabled</h1>
        <p className="text-muted-foreground mb-4">
          Collections loading has been temporarily disabled to fix preloading issues.
        </p>
        <button 
          onClick={() => navigate('/app/party-on-delivery')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Main Delivery App
        </button>
      </div>
    </div>
  );
};

export default ProductCategories;