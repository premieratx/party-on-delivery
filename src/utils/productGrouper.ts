interface Product {
  id: string;
  title: string;
  price: string | number; // Accept both string and number
  image: string;
  variants?: Array<{
    id: string;
    price: string | number; // Accept both string and number
    title?: string;
  }>;
  [key: string]: any;
}

interface ProductVariant {
  id: string;
  price: number;
  size: string;
  originalProduct: Product;
}

interface GroupedProduct {
  id: string; // Use the first product's ID as the group ID
  baseTitle: string;
  image: string;
  variants: ProductVariant[];
  originalProducts: Product[];
}

/**
 * Extract the base name from a product title for grouping identical products
 */
function extractBaseName(title: string): string {
  let normalized = title
    .toLowerCase()
    // Remove size patterns
    .replace(/\s*\d+(\.\d+)?\s*(ml|l|liter|litre)\s*/gi, ' ')
    .replace(/\s*\d+(\.\d+)?\s*(oz|ounce)s?\s*/gi, ' ')
    .replace(/\s*\d+\s*(pack|pk|pck)\s*/gi, ' ')
    .replace(/\s*(\d+x\d+|\d+\s*x\s*\d+)\s*/gi, ' ')
    .replace(/\s*\d+\s*count\s*/gi, ' ')
    .replace(/\s*single\s*/gi, ' ')
    .replace(/\s*bottle\s*/gi, ' ')
    .replace(/\s*can\s*/gi, ' ')
    .replace(/\s*case\s*/gi, ' ')
    // Remove parenthetical content that often contains sizes
    .replace(/\s*\([^)]*\)\s*/gi, ' ')
    .replace(/\s*\[[^\]]*\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  return normalized;
}

/**
 * Extract size information from a product title
 */
function extractSize(title: string): string {
  const sizePatterns = [
    /(\d+(\.\d+)?\s*(ml|l|liter|litre))/gi,
    /(\d+(\.\d+)?\s*(oz|ounce)s?)/gi,
    /(\d+\s*(pack|pk|pck))/gi,
    /(\d+x\d+|\d+\s*x\s*\d+)/gi,
    /(\d+\s*count)/gi,
    /(single)/gi,
    /(bottle)/gi,
    /(can)/gi,
    /(case)/gi
  ];

  for (const pattern of sizePatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  // If no specific size found, try to extract any number + unit
  const genericMatch = title.match(/\b\d+(\.\d+)?\s*[a-z]+\b/gi);
  if (genericMatch) {
    return genericMatch[0];
  }

  return 'Standard';
}

/**
 * Group identical products by their base name into variants
 */
export function groupProductsByBaseName(products: Product[]): GroupedProduct[] {
  const groups = new Map<string, { products: Product[], firstIndex: number }>();

  // Group products by base name while preserving original order
  products.forEach((product, index) => {
    const baseName = extractBaseName(product.title);
    if (!groups.has(baseName)) {
      groups.set(baseName, { products: [], firstIndex: index });
    }
    groups.get(baseName)!.products.push(product);
  });

  // Convert groups to GroupedProduct format, preserving original order
  const groupedProducts: GroupedProduct[] = [];
  
  // Sort groups by first appearance to preserve Shopify order
  const sortedGroups = Array.from(groups.entries()).sort(([, groupA], [, groupB]) => 
    groupA.firstIndex - groupB.firstIndex
  );

  sortedGroups.forEach(([baseName, { products: productGroup }]) => {
    if (productGroup.length === 1) {
      // Single product - keep as is but in grouped format
      const product = productGroup[0];
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      groupedProducts.push({
        id: product.id,
        baseTitle: product.title,
        image: product.image,
        variants: [{
          id: product.variants?.[0]?.id || product.id,
          price: price,
          size: extractSize(product.title),
          originalProduct: product
        }],
        originalProducts: [product]
      });
    } else {
      // Multiple products - create variants, sorted by price within group
      const sortedProducts = productGroup.sort((a, b) => {
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
        return priceA - priceB;
      });
      const firstProduct = sortedProducts[0];
      
      // Create clean base title from the shortest title (usually has fewer descriptors)
      const baseTitle = sortedProducts
        .reduce((shortest, current) => current.title.length < shortest.title.length ? current : shortest)
        .title
        .replace(/\s*\d+(\.\d+)?\s*(ml|l|oz|pack|pk|bottle|can|case)\s*/gi, '')
        .replace(/\s*\([^)]*\)\s*/gi, '')
        .trim();

      groupedProducts.push({
        id: firstProduct.id,
        baseTitle: baseTitle,
        image: firstProduct.image,
        variants: sortedProducts.map(product => {
          const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
          return {
            id: product.variants?.[0]?.id || product.id,
            price: price,
            size: extractSize(product.title),
            originalProduct: product
          };
        }),
        originalProducts: sortedProducts
      });
    }
  });

  // Return in original Shopify order (already sorted by first appearance)
  return groupedProducts;
}

/**
 * Check if products should be grouped (have the same base name but different sizes)
 */
export function shouldGroupProducts(products: Product[]): boolean {
  if (products.length < 2) return false;
  
  const baseNames = new Set(products.map(p => extractBaseName(p.title)));
  return baseNames.size < products.length;
}
