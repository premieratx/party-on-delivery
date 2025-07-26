import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  variants?: any[];
  images?: string[];
}

export function useCustomSiteProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customSiteData, setCustomSiteData] = useState<any>(null);

  useEffect(() => {
    // Check if we're on a custom site
    const storedCustomSiteData = localStorage.getItem('customSiteData');
    if (storedCustomSiteData) {
      const data = JSON.parse(storedCustomSiteData);
      setCustomSiteData(data);
      
      if (data.allowedCollections && data.allowedCollections.length > 0) {
        loadFilteredProducts(data.allowedCollections);
      } else {
        loadAllProducts();
      }
    } else {
      loadAllProducts();
    }
  }, []);

  const loadFilteredProducts = async (allowedCollections: string[]) => {
    try {
      console.log('Loading products for collections:', allowedCollections);
      
      // First get all products
      const { data: allProducts, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        return;
      }

      // Filter products based on allowed collections
      const filteredProducts = allProducts.filter((product: any) => {
        // Check if product belongs to any of the allowed collections
        if (product.collection_handle) {
          return allowedCollections.includes(product.collection_handle);
        }
        
        // For products without explicit collection, check category mapping
        const productCategory = mapCollectionToCategory(product.collection_handle || '');
        return allowedCollections.some(collection => 
          mapCollectionToCategory(collection) === productCategory
        );
      });

      console.log(`Filtered ${allProducts.length} products to ${filteredProducts.length} for custom site`);
      setProducts(filteredProducts);
      
    } catch (error) {
      console.error('Error loading filtered products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      console.log('Loading all products (not a custom site)');
      
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        return;
      }

      setProducts(data || []);
      
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map collection handles to categories
  const mapCollectionToCategory = (collectionHandle: string): string => {
    const categoryMappings: Record<string, string> = {
      'beer': 'Beer',
      'wine': 'Wine',
      'spirits': 'Spirits',
      'cocktails': 'Cocktails',
      'seltzers': 'Seltzers',
      'mixers': 'Mixers',
      'party-supplies': 'Party Supplies',
      'rentals': 'Rentals',
      'event-rentals': 'Event Rentals',
      'wedding-packages': 'Wedding Packages',
      'boat-packages': 'Boat Packages',
      'concierge-packages': 'Concierge Packages'
    };

    return categoryMappings[collectionHandle] || 'Other';
  };

  const getAvailableCategories = () => {
    if (!customSiteData?.allowedCollections) {
      // Return all categories if not a custom site
      return ['favorites', 'beer', 'wine', 'spirits', 'cocktails', 'seltzers', 'party-supplies'];
    }

    // Map allowed collections to categories
    const categories = customSiteData.allowedCollections.map((collection: string) => {
      const category = mapCollectionToCategory(collection);
      return category.toLowerCase().replace(' ', '-');
    });

    // Always include favorites
    return ['favorites', ...categories];
  };

  const isCustomSite = () => {
    return customSiteData?.isCustomSite || false;
  };

  const getSiteConfig = () => {
    return customSiteData?.siteConfig || null;
  };

  return {
    products,
    isLoading,
    isCustomSite: isCustomSite(),
    customSiteData,
    siteConfig: getSiteConfig(),
    availableCategories: getAvailableCategories(),
    reload: () => {
      setIsLoading(true);
      if (customSiteData?.allowedCollections) {
        loadFilteredProducts(customSiteData.allowedCollections);
      } else {
        loadAllProducts();
      }
    }
  };
}