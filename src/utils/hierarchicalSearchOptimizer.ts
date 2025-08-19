interface Product {
  id: string;
  title: string;
  price: number | string;
  image: string;
  product_type?: string;
  category?: string;
  collection_handles?: string[] | string;
  tags?: string[] | string;
  variants?: any[];
  [key: string]: any;
}

interface CategoryMapping {
  id: string;
  label: string;
  keywords: string[];
  productTypes: string[];
  collections: string[];
}

interface SubcategoryMapping {
  id: string;
  label: string;
  keywords: string[];
  parentCategory: string;
}

// Define major categories matching delivery app structure
export const MAJOR_CATEGORIES: CategoryMapping[] = [
  {
    id: 'spirits',
    label: '🥃 Spirits',
    keywords: ['spirit', 'liquor', 'alcohol', 'whiskey', 'vodka', 'gin', 'rum', 'tequila', 'mezcal', 'brandy', 'cognac', 'liqueur'],
    productTypes: ['spirits', 'whiskey', 'vodka', 'gin', 'rum', 'tequila', 'mezcal', 'brandy', 'liqueur'],
    collections: ['spirits', 'whiskey', 'vodka', 'gin-rum', 'tequila-mezcal', 'brandy-cognac', 'liqueurs']
  },
  {
    id: 'beer',
    label: '🍺 Beer',
    keywords: ['beer', 'lager', 'ale', 'ipa', 'stout', 'pilsner', 'light beer', 'craft beer'],
    productTypes: ['beer', 'light beer', 'craft beer', 'domestic beer', 'imported beer'],
    collections: ['tailgate-beer', 'texas-beer-collection', 'beer-light-beer-boat', 'beer-airbnb-craft', 'beer-kegs']
  },
  {
    id: 'wine',
    label: '🍷 Wine',
    keywords: ['wine', 'champagne', 'prosecco', 'sparkling', 'red wine', 'white wine', 'rosé'],
    productTypes: ['wine', 'champagne', 'sparkling wine'],
    collections: ['wine-champagne-bnb-wedding', 'champagne', 'wine']
  },
  {
    id: 'seltzer',
    label: '🥤 Seltzer',
    keywords: ['seltzer', 'hard seltzer', 'sparkling water', 'flavored seltzer'],
    productTypes: ['seltzer', 'hard seltzer', 'flavored seltzer'],
    collections: ['tailgate-seltzers', 'seltzer-collection', 'bachelor-seltzers-wine']
  },
  {
    id: 'cocktails',
    label: '🍹 Cocktails',
    keywords: ['cocktail', 'ready to drink', 'rtd', 'mixed drink', 'canned cocktail', 'pitcher'],
    productTypes: ['cocktail', 'ready-to-drink', 'rtd', 'mixed drink'],
    collections: ['tailgate-cocktail', 'party-pitcher-cocktails', 'cocktail-kits', 'live-on-the-lake-cocktail-kits', 'spirits-cocktail-kits-boat-collection']
  },
  {
    id: 'mixers',
    label: '🧊 Mixers & N/A',
    keywords: ['mixer', 'non-alcoholic', 'soda', 'juice', 'tonic', 'bitters', 'syrup', 'garnish'],
    productTypes: ['mixer', 'non-alcoholic', 'soda', 'juice'],
    collections: ['non-alcoholic', 'mixers-non-alcoholic', 'bachelorette-mixers-misc', 'hangover-management']
  },
  {
    id: 'party-supplies',
    label: '🎉 Party Supplies',
    keywords: ['party', 'supplies', 'decoration', 'games', 'cooler', 'ice', 'cups', 'napkins'],
    productTypes: ['party supplies', 'decorations', 'games', 'cooler', 'ice'],
    collections: ['tailgate-supplies-and-fun', 'bachelorette-party-supplies', 'concierge-backyard-parties', 'concierge-pool-toys', 'rental-items']
  }
];

// Define subcategories (mainly for spirits)
export const SUBCATEGORIES: SubcategoryMapping[] = [
  { id: 'whiskey', label: 'Whiskey', keywords: ['whiskey', 'whisky', 'bourbon', 'rye', 'scotch'], parentCategory: 'spirits' },
  { id: 'vodka', label: 'Vodka', keywords: ['vodka'], parentCategory: 'spirits' },
  { id: 'gin', label: 'Gin', keywords: ['gin'], parentCategory: 'spirits' },
  { id: 'rum', label: 'Rum', keywords: ['rum'], parentCategory: 'spirits' },
  { id: 'tequila', label: 'Tequila', keywords: ['tequila'], parentCategory: 'spirits' },
  { id: 'mezcal', label: 'Mezcal', keywords: ['mezcal'], parentCategory: 'spirits' },
  { id: 'liqueurs', label: 'Liqueurs', keywords: ['liqueur', 'liqueurs', 'amaro', 'aperitif', 'digestif', 'cordial'], parentCategory: 'spirits' }
];

/**
 * Hierarchical Product Search with Priority Scoring
 * Priority: Product Name (1000) > Collection (750) > Category (500) > Product Type (250)
 */
export class HierarchicalSearchOptimizer {
  private static cache = new Map<string, any[]>();
  private static lastCacheTime = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Categorize a product into major categories
   */
  static categorizeProduct(product: Product): string {
    const title = String(product.title || '').toLowerCase();
    const productType = String(product.product_type || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();
    
    // Parse collection handles
    let collections: string[] = [];
    if (Array.isArray(product.collection_handles)) {
      collections = product.collection_handles;
    } else if (typeof product.collection_handles === 'string') {
      try {
        collections = JSON.parse(product.collection_handles);
      } catch {
        collections = [product.collection_handles];
      }
    }
    const collectionsStr = collections.join(' ').toLowerCase();

    // Check each major category
    for (const cat of MAJOR_CATEGORIES) {
      // Check product type match
      if (cat.productTypes.some(type => productType.includes(type.toLowerCase()))) {
        return cat.id;
      }
      
      // Check collection match
      if (cat.collections.some(coll => collectionsStr.includes(coll.toLowerCase()))) {
        return cat.id;
      }
      
      // Check keyword match in title
      if (cat.keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
        return cat.id;
      }
    }

    return 'other';
  }

  /**
   * Get subcategory for spirits
   */
  static getSubcategory(product: Product): string | null {
    const category = this.categorizeProduct(product);
    if (category !== 'spirits') return null;

    const title = String(product.title || '').toLowerCase();
    const productType = String(product.product_type || '').toLowerCase();

    for (const subcat of SUBCATEGORIES) {
      if (subcat.keywords.some(keyword => 
        title.includes(keyword.toLowerCase()) || 
        productType.includes(keyword.toLowerCase())
      )) {
        return subcat.id;
      }
    }

    return null;
  }

  /**
   * Perform hierarchical search with scoring
   */
  static searchProducts(query: string, products: Product[], limit = 50): Product[] {
    if (!query.trim()) return products.slice(0, limit);

    const q = query.toLowerCase().trim();
    const cacheKey = `search-${q}-${limit}`;
    
    // Check cache
    const now = Date.now();
    if (this.cache.has(cacheKey) && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.cache.get(cacheKey);
    }

    const scored = products.map(product => ({
      product,
      score: this.calculateScore(product, q)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);

    // Cache results
    this.cache.set(cacheKey, scored);
    this.lastCacheTime = now;

    console.log(`🔍 HIERARCHICAL SEARCH: Found ${scored.length} products for "${query}" (Name > Collection > Category > Type)`);
    return scored;
  }

  /**
   * Calculate search score with hierarchical priority
   */
  private static calculateScore(product: Product, query: string): number {
    const title = String(product.title || '').toLowerCase();
    const productType = String(product.product_type || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();
    
    // Parse collections
    let collections: string[] = [];
    if (Array.isArray(product.collection_handles)) {
      collections = product.collection_handles;
    } else if (typeof product.collection_handles === 'string') {
      try {
        collections = JSON.parse(product.collection_handles);
      } catch {
        collections = [product.collection_handles];
      }
    }
    const collectionsStr = collections.join(' ').toLowerCase();

    let score = 0;

    // Product Name matches (highest priority: 1000-2000)
    if (title.includes(query)) {
      if (title === query) {
        score += 2000; // Exact match
      } else if (title.startsWith(query)) {
        score += 1500; // Starts with query
      } else {
        score += 1000; // Contains query
      }
    }

    // Collection matches (750 points)
    if (collectionsStr.includes(query)) {
      score += 750;
    }

    // Category matches (500 points)
    if (category.includes(query)) {
      score += 500;
    }

    // Product Type matches (250 points)
    if (productType.includes(query)) {
      score += 250;
    }

    // Bonus for partial word matches
    const words = query.split(' ').filter(w => w.length > 2);
    words.forEach(word => {
      if (title.includes(word)) score += 100;
      if (collectionsStr.includes(word)) score += 75;
      if (category.includes(word)) score += 50;
      if (productType.includes(word)) score += 25;
    });

    return score;
  }

  /**
   * Filter products by category
   */
  static filterByCategory(products: Product[], categoryId: string): Product[] {
    if (categoryId === 'all') return products;
    
    return products.filter(product => {
      const detectedCategory = this.categorizeProduct(product);
      return detectedCategory === categoryId;
    });
  }

  /**
   * Filter spirits by subcategory
   */
  static filterSpiritsBySubcategory(products: Product[], subcategoryId: string): Product[] {
    if (subcategoryId === 'all') return products;

    return products.filter(product => {
      const subcategory = this.getSubcategory(product);
      return subcategory === subcategoryId;
    });
  }

  /**
   * Clear search cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.lastCacheTime = 0;
  }
}