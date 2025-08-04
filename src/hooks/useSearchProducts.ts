import { useState, useEffect, useCallback } from 'react';
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

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: any[];
}

export function useSearchProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorizedProducts, setCategorizedProducts] = useState<{ [key: string]: Product[] }>({});

  // Map collection handles to our search app categories
  const mapCollectionToCategory = useCallback((handle: string): string => {
    // Spirits (first tab in search)
    if (handle === 'spirits' || handle === 'gin-rum' || handle === 'tequila-mezcal' || handle === 'whiskey') return 'spirits';
    // Beer (second tab) - ADD BACK tailgate-beer collection
    if (handle === 'tailgate-beer' || handle === 'texas-beer-collection' || handle.includes('beer')) return 'beer';
    // Seltzers (third tab) - ADD BACK seltzer-collection  
    if (handle === 'seltzer-collection' || handle.includes('seltzer')) return 'seltzers';
    // Cocktails (fourth tab)
    if (handle === 'cocktail-kits' || handle === 'ready-to-drink-cocktails' || handle.includes('cocktail')) return 'cocktails';
    // Mixers & N/A (fifth tab)
    if (handle === 'mixers-non-alcoholic' || handle.includes('mixer') || handle.includes('non-alcoholic')) return 'mixers';
    // Wine
    if (handle === 'champagne' || handle.includes('wine')) return 'wine';
    // Party Supplies
    if (handle === 'party-supplies' || handle === 'decorations' || handle === 'hats-sunglasses' || handle === 'costumes') return 'party-supplies';
    // Other category - includes newest-products and customizable-items collections
    if (handle === 'newest-products' || handle === 'customizable-items' || handle === 'annie-s-store') return 'other';
    // Everything else
    return 'other';
  }, []);

  // Reclassify product into more specific categories for spirits
  const reclassifyProduct = useCallback((product: Product) => {
    const title = product.title.toLowerCase();
    const description = product.description?.toLowerCase() || '';
    
    // If already categorized as spirits, try to determine subcategory
    if (product.category === 'spirits') {
      let subcategory = product.subcategory;
      
      // Enhanced spirit categorization
      if (title.includes('vodka') || description.includes('vodka')) {
        subcategory = 'vodka';
      } else if (title.includes('tequila') || title.includes('mezcal') || description.includes('tequila') || description.includes('mezcal')) {
        subcategory = 'tequila';
      } else if (title.includes('whiskey') || title.includes('whisky') || title.includes('bourbon') || title.includes('rye') || description.includes('whiskey') || description.includes('bourbon')) {
        subcategory = 'whiskey';
      } else if (title.includes('gin') || description.includes('gin')) {
        subcategory = 'gin';
      } else if (title.includes('rum') || description.includes('rum')) {
        subcategory = 'rum';
      } else if (title.includes('brandy') || title.includes('cognac') || description.includes('brandy') || description.includes('cognac')) {
        subcategory = 'brandy';
      }
      
      return { ...product, subcategory };
    }
    
    return product;
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 SearchProducts: Loading all collections from Shopify...');
      
      // Get all collections from Shopify
      const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading collections:', error);
        return;
      }
      
      if (!collectionsData?.success || !collectionsData?.collections) {
        console.error('Invalid response from get-all-collections');
        return;
      }

      const collections = collectionsData.collections as ShopifyCollection[];
      console.log(`✅ SearchProducts: Loaded ${collections.length} collections`);
      
      // Extract all products from all collections
      const allProductsRaw: Product[] = [];
      const productsByCategory: { [key: string]: Product[] } = {
        spirits: [],
        beer: [],
        seltzers: [],
        cocktails: [],
        mixers: [],
        wine: [],
        'party-supplies': [],
        other: []
      };

      collections.forEach(collection => {
        const category = mapCollectionToCategory(collection.handle);
        console.log(`📦 Processing collection "${collection.title}" (${collection.handle}) -> category: ${category}`);
        
        if (collection.products && collection.products.length > 0) {
          collection.products.forEach(rawProduct => {
            const product: Product = {
              id: rawProduct.id,
              title: rawProduct.title,
              price: rawProduct.priceRange?.minVariantPrice?.amount || 0,
              image: rawProduct.images?.edges?.[0]?.node?.url || rawProduct.featuredImage?.url || '',
              description: rawProduct.description || '',
              handle: rawProduct.handle,
              category: category,
              variants: rawProduct.variants?.edges?.map((edge: any) => edge.node) || [],
              images: rawProduct.images?.edges?.map((edge: any) => edge.node.url) || []
            };

            // Reclassify for better categorization
            const reclassifiedProduct = reclassifyProduct(product);
            
            allProductsRaw.push(reclassifiedProduct);
            productsByCategory[category].push(reclassifiedProduct);
          });
        }
      });

      // Deduplicate products using our enhanced analyzer
      const deduplicatedProducts = deduplicateProducts(allProductsRaw);
      console.log(`🔧 SearchProducts: Deduplicated ${allProductsRaw.length} -> ${deduplicatedProducts.length} products`);

      // Deduplicate products by category as well
      const deduplicatedByCategory: { [key: string]: Product[] } = {};
      Object.keys(productsByCategory).forEach(category => {
        deduplicatedByCategory[category] = deduplicateProducts(productsByCategory[category]);
        console.log(`📂 Category "${category}": ${deduplicatedByCategory[category].length} products`);
      });

      setProducts(deduplicatedProducts);
      setCategorizedProducts(deduplicatedByCategory);

    } catch (error) {
      console.error('Error in loadProducts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapCollectionToCategory, reclassifyProduct]);

  // Get favorites/best selling products
  const getFavoritesProducts = useCallback((allProducts: Product[]) => {
    // Create a Map to track unique products by ID to avoid duplicates
    const uniqueProducts = new Map<string, Product>();
    
    // Filter for popular products
    allProducts.forEach(product => {
      const title = product.title.toLowerCase();
      const isPopularItem = title.includes('deep eddy') || 
                           title.includes('tito') || 
                           title.includes('casamigos') || 
                           title.includes('bulleit') ||
                           title.includes('teremana') ||
                           title.includes('high noon') ||
                           title.includes('modelo') ||
                           title.includes('miller lite') ||
                           title.includes('coors light') ||
                           title.includes('coors original') ||
                           title.includes('lone star') ||
                           title.includes('cocktail kit') ||
                           product.category === 'spirits' ||
                           product.category === 'cocktails' ||
                           product.category === 'beer' ||
                           product.category === 'seltzers';
      
      // Only add if it's a popular item and not already in the map
      if (isPopularItem && !uniqueProducts.has(product.id)) {
        uniqueProducts.set(product.id, product);
      }
    });

    // Convert back to array and sort by popularity score
    const favoritesProducts = Array.from(uniqueProducts.values())
      .sort((a, b) => {
        const aScore = getPopularityScore(a);
        const bScore = getPopularityScore(b);
        return bScore - aScore;
      })
      .slice(0, 50); // Limit to 50 favorite items

    return favoritesProducts;
  }, []);

  // Helper function to calculate popularity score
  const getPopularityScore = (product: Product) => {
    const title = product.title.toLowerCase();
    let score = 0;
    
    // Premium spirit brands
    if (title.includes('tito')) score += 10;
    if (title.includes('deep eddy')) score += 9;
    if (title.includes('casamigos')) score += 8;
    if (title.includes('bulleit')) score += 7;
    if (title.includes('teremana')) score += 6;
    
    // Popular beer brands
    if (title.includes('modelo')) score += 8;
    if (title.includes('miller lite')) score += 7;
    if (title.includes('coors light')) score += 7;
    if (title.includes('coors original')) score += 6;
    if (title.includes('lone star')) score += 6;
    
    // Seltzer brands
    if (title.includes('high noon')) score += 8;
    
    // Product type popularity
    if (title.includes('vodka')) score += 5;
    if (title.includes('tequila')) score += 5;
    if (title.includes('bourbon')) score += 4;
    if (title.includes('cocktail')) score += 4;
    if (title.includes('beer')) score += 4;
    if (title.includes('seltzer')) score += 4;
    
    // Size preference (750ml is standard, 1.75L is value, beer cases/packs)
    if (title.includes('750ml')) score += 2;
    if (title.includes('1.75l')) score += 3;
    if (title.includes('12 pack') || title.includes('12-pack')) score += 3;
    if (title.includes('24 pack') || title.includes('24-pack')) score += 4;
    if (title.includes('case')) score += 3;
    
    return score;
  };

  // Get products by category
  const getProductsByCategory = useCallback((category: string): Product[] => {
    if (category === 'all') {
      return products;
    }
    if (category === 'favorites') {
      return getFavoritesProducts(products);
    }
    return categorizedProducts[category] || [];
  }, [products, categorizedProducts, getFavoritesProducts]);

  // Get available categories
  const getAvailableCategories = useCallback((): string[] => {
    return ['all', 'favorites', 'spirits', 'beer', 'seltzers', 'cocktails', 'mixers', 'wine', 'party-supplies', 'other'];
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoading,
    categorizedProducts,
    getProductsByCategory,
    getAvailableCategories,
    reload: loadProducts
  };
}
