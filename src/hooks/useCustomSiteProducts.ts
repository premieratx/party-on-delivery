import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { deduplicateProducts } from '@/utils/duplicateAnalyzer';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  subcategory?: string;
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
      
      // Get all collections from Shopify
      const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading collections:', error);
        setProducts([]);
        return;
      }

      if (!collectionsData?.collections || !Array.isArray(collectionsData.collections)) {
        console.error('Invalid collections data structure');
        setProducts([]);
        return;
      }

      // Filter collections to only include allowed ones, then extract products
      const filteredCollections = collectionsData.collections.filter((collection: any) => 
        allowedCollections.includes(collection.handle)
      );

      console.log(`Found ${filteredCollections.length} matching collections from ${allowedCollections.length} allowed`);
      
      // Extract all products from filtered collections
      const allFilteredProducts: Product[] = [];
      filteredCollections.forEach((collection: any) => {
        if (collection.products && Array.isArray(collection.products)) {
          collection.products.forEach((product: any) => {
            const baseProduct = {
              id: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              description: product.description || '',
              handle: product.handle,
              category: mapCollectionToCategory(collection.handle),
              variants: product.variants || [],
              images: product.images || []
            };
            
            // Reclassify if needed
            allFilteredProducts.push(reclassifyProduct(baseProduct));
          });
        }
      });

      console.log(`Filtered to ${allFilteredProducts.length} products for custom site`);
      
      // Log duplicate analysis BEFORE deduplication
      const { generateDuplicateReport } = await import('@/utils/duplicateAnalyzer');
      const duplicateReport = generateDuplicateReport(allFilteredProducts);
      console.log('\n🔍 DUPLICATE PRODUCTS ANALYSIS (BEFORE DEDUPLICATION):\n', duplicateReport);
      
      // Apply deduplication and grouping
      const deduplicatedProducts = deduplicateProducts(allFilteredProducts);
      console.log(`Deduplicated to ${deduplicatedProducts.length} unique products`);
      setProducts(deduplicatedProducts as any);
      
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
      
      const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading collections:', error);
        setProducts([]);
        return;
      }

      if (!collectionsData?.collections || !Array.isArray(collectionsData.collections)) {
        console.error('Invalid collections data structure');
        setProducts([]);
        return;
      }

      // Extract all products from all collections
      const allProducts: Product[] = [];
      collectionsData.collections.forEach((collection: any) => {
        if (collection.products && Array.isArray(collection.products)) {
          collection.products.forEach((product: any) => {
            const baseProduct = {
              id: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              description: product.description || '',
              handle: product.handle,
              category: mapCollectionToCategory(collection.handle),
              variants: product.variants || [],
              images: product.images || []
            };
            
            // Reclassify if needed
            allProducts.push(reclassifyProduct(baseProduct));
          });
        }
      });

      console.log(`Loaded ${allProducts.length} total products`);
      
      // Log duplicate analysis BEFORE deduplication
      const { generateDuplicateReport } = await import('@/utils/duplicateAnalyzer');
      const duplicateReport = generateDuplicateReport(allProducts);
      console.log('\n🔍 DUPLICATE PRODUCTS ANALYSIS (BEFORE DEDUPLICATION):\n', duplicateReport);
      
      // Apply deduplication and grouping
      const deduplicatedProducts = deduplicateProducts(allProducts);
      console.log(`Deduplicated to ${deduplicatedProducts.length} unique products`);
      setProducts(deduplicatedProducts as any);
      
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
      'tailgate-beer': 'beer',
      'all-beer': 'beer', 
      'seltzer-collection': 'seltzers',
      'cocktail-kits': 'cocktails',
      'party-supplies': 'party-supplies',
      'newest-products': 'new',
      'customizable-items': 'party-supplies',
      'costumes': 'party-supplies',
      'champagne': 'wine',
      'texas-beer-collection': 'beer',
      'disco-collection': 'party-supplies',
      'liqueurs-cordials-cocktail-ingredients': 'mixers',
      'mixers-non-alcoholic': 'mixers',
      'ready-to-drink-cocktails': 'cocktails',
      'hats-sunglasses': 'party-supplies',
      'tequila-mezcal': 'spirits',
      'gin-rum': 'spirits',
      'decorations': 'party-supplies',
      'spirits': 'spirits',
      'wine': 'wine',
      'beer': 'beer',
      'seltzers': 'seltzers',
      'cocktails': 'cocktails'
    };
    
    return categoryMappings[collectionHandle] || 'other';
  };

  // Enhanced function to reclassify and subcategorize spirits
  const reclassifyProduct = (product: Product): Product => {
    const title = product.title.toLowerCase();
    const description = product.description?.toLowerCase() || '';
    
    // Spirit classification keywords and subcategories
    const spiritCategories = {
      whiskey: ['whiskey', 'whisky', 'bourbon', 'rye', 'scotch', 'bulleit', 'jameson', 'jack daniels', 'makers mark', 'wild turkey', 'woodford'],
      vodka: ['vodka', 'grey goose', 'absolut', 'smirnoff', 'belvedere', 'titos'],
      rum: ['rum', 'bacardi', 'captain morgan', 'mount gay', 'kraken', 'diplomatico'],
      gin: ['gin', 'bombay', 'tanqueray', 'hendricks', 'botanist'],
      tequila: ['tequila', 'jose cuervo', 'patron', 'don julio', 'herradura', 'espolon'],
      mezcal: ['mezcal', 'del maguey', 'montelobos'],
      liqueurs: ['liqueur', 'schnapps', 'amaretto', 'baileys', 'kahlua', 'cointreau', 'grand marnier', 'sambuca'],
      brandy: ['brandy', 'cognac', 'hennessy', 'remy martin', 'martell', 'armagnac']
    };
    
    // Check if product should be classified as spirits
    let matchedSubcategory = null;
    let isSpirit = false;
    
    for (const [subcategory, keywords] of Object.entries(spiritCategories)) {
      const hasKeyword = keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
      
      if (hasKeyword) {
        isSpirit = true;
        matchedSubcategory = subcategory;
        break;
      }
    }
    
    // If it's a spirit, update category and add subcategory
    if (isSpirit) {
      return { 
        ...product, 
        category: 'spirits',
        subcategory: matchedSubcategory
      };
    }
    
    // If already categorized as spirits but no subcategory, try to add one
    if (product.category === 'spirits' && !product.subcategory) {
      for (const [subcategory, keywords] of Object.entries(spiritCategories)) {
        const hasKeyword = keywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
        
        if (hasKeyword) {
          return { ...product, subcategory };
        }
      }
    }
    
    return product;
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