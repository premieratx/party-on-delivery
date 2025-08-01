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

interface ProductVariant {
  id: string;
  title: string;
  price: number;
  size: string;
  sizeValue: number;
  image: string;
  handle: string;
  variants?: any[];
  images?: string[];
}

interface GroupedProduct {
  id: string;
  title: string;
  baseTitle: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  variants: ProductVariant[];
  images?: string[];
}

interface DuplicateGroup {
  baseName: string;
  products: Product[];
  sizes: string[];
  categories: string[];
}

export function deduplicateProducts(products: Product[]): GroupedProduct[] {
  // Group products by base name
  const productGroups = new Map<string, Product[]>();
  
  products.forEach(product => {
    const baseName = extractBaseName(product.title);
    if (!productGroups.has(baseName)) {
      productGroups.set(baseName, []);
    }
    productGroups.get(baseName)!.push(product);
  });
  
  const deduplicatedProducts: GroupedProduct[] = [];
  
  productGroups.forEach((productList, baseName) => {
    // Further deduplicate within each group by size and price
    const uniqueVariants = new Map<string, Product>();
    
    productList.forEach(product => {
      const sizeInfo = extractSizeInfo(product.title);
      const uniqueKey = `${sizeInfo.size}-${product.price}`;
      
      // Only keep one product per unique size-price combination
      if (!uniqueVariants.has(uniqueKey)) {
        uniqueVariants.set(uniqueKey, product);
      }
    });
    
    const uniqueProductList = Array.from(uniqueVariants.values());
    
    if (uniqueProductList.length === 1) {
      // Single unique product, convert to grouped format
      const product = uniqueProductList[0];
      const sizeInfo = extractSizeInfo(product.title);
      
      deduplicatedProducts.push({
        id: product.id,
        title: product.title,
        baseTitle: baseName,
        price: product.price,
        image: product.image,
        description: product.description,
        handle: product.handle,
        category: product.category,
        variants: [{
          id: product.id,
          title: product.title,
          price: product.price,
          size: sizeInfo.size,
          sizeValue: sizeInfo.value,
          image: product.image,
          handle: product.handle,
          variants: product.variants,
          images: product.images
        }],
        images: product.images
      });
    } else {
      // Multiple unique products, group them
      const sortedProducts = uniqueProductList
        .map(product => ({
          product,
          sizeInfo: extractSizeInfo(product.title)
        }))
        .sort((a, b) => b.sizeInfo.value - a.sizeInfo.value); // Largest to smallest
      
      const primaryProduct = sortedProducts[0].product;
      const variants: ProductVariant[] = sortedProducts.map(({ product, sizeInfo }) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        size: sizeInfo.size,
        sizeValue: sizeInfo.value,
        image: product.image,
        handle: product.handle,
        variants: product.variants,
        images: product.images
      }));
      
      deduplicatedProducts.push({
        id: primaryProduct.id,
        title: `${baseName} (${variants.length} sizes)`,
        baseTitle: baseName,
        price: primaryProduct.price,
        image: primaryProduct.image,
        description: primaryProduct.description,
        handle: primaryProduct.handle,
        category: primaryProduct.category,
        variants,
        images: primaryProduct.images
      });
    }
  });
  
  return deduplicatedProducts;
}

function extractSizeInfo(title: string): { size: string; value: number } {
  // Extract size patterns and convert to comparable values
  const packMatch = title.match(/(\d+)\s*(?:pack|pk)/i);
  const lMatch = title.match(/(\d+(?:\.\d+)?)\s*l(?:iter|itre)?(?!\w)/i);
  const mlMatch = title.match(/(\d+(?:\.\d+)?)\s*ml/i);
  const ozMatch = title.match(/(\d+(?:\.\d+)?)\s*oz(?:unce)?/i);
  
  // For beer/seltzers, prioritize pack size over oz
  if (packMatch) {
    const pack = parseInt(packMatch[1]);
    // Also check if there's an oz size to include
    const ozInPack = title.match(/(\d+(?:\.\d+)?)\s*oz/i);
    if (ozInPack) {
      const oz = parseFloat(ozInPack[1]);
      return { size: `${pack} Pack (${oz}oz)`, value: pack * oz * 29.5735 };
    }
    return { size: `${pack} Pack`, value: pack * 355 }; // Assume 355ml per can/bottle
  }
  
  // For spirits, prioritize bottle volume
  if (lMatch) {
    const liters = parseFloat(lMatch[1]);
    return { size: `${liters}L`, value: liters * 1000 }; // Convert to ml for comparison
  }
  
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    return { size: `${ml}mL`, value: ml };
  }
  
  if (ozMatch) {
    const oz = parseFloat(ozMatch[1]);
    return { size: `${oz}oz`, value: oz * 29.5735 }; // Convert to ml for comparison
  }
  
  // Default case - use price as a rough size indicator
  return { size: 'Standard', value: 750 }; // Default to 750ml equivalent
}

export function analyzeDuplicates(products: Product[]): DuplicateGroup[] {
  // Group products by base name (removing size indicators)
  const productGroups = new Map<string, Product[]>();
  
  products.forEach(product => {
    const baseName = extractBaseName(product.title);
    if (!productGroups.has(baseName)) {
      productGroups.set(baseName, []);
    }
    productGroups.get(baseName)!.push(product);
  });
  
  // Filter to only groups with multiple products
  const duplicateGroups: DuplicateGroup[] = [];
  
  productGroups.forEach((productList, baseName) => {
    if (productList.length > 1) {
      const sizes = extractSizes(productList);
      const categories = [...new Set(productList.map(p => p.category))];
      
      duplicateGroups.push({
        baseName,
        products: productList,
        sizes,
        categories
      });
    }
  });
  
  // Sort by most duplicates first
  return duplicateGroups.sort((a, b) => b.products.length - a.products.length);
}

function extractBaseName(title: string): string {
  // More aggressive normalization to catch all variations
  let normalized = title
    .toLowerCase()
    // Remove size patterns more comprehensively
    .replace(/\s*\d+(\.\d+)?\s*(ml|l|liter|litre)\s*/gi, ' ')
    .replace(/\s*\d+(\.\d+)?\s*(oz|ounce)s?\s*/gi, ' ')
    .replace(/\s*\d+\s*(pack|pk|pck)\s*/gi, ' ')
    .replace(/\s*(\d+x\d+|\d+\s*x\s*\d+)\s*/gi, ' ')
    .replace(/\s*\d+\s*count\s*/gi, ' ')
    .replace(/\s*single\s*/gi, ' ')
    .replace(/\s*bottle\s*/gi, ' ')
    .replace(/\s*can\s*/gi, ' ')
    .replace(/\s*case\s*/gi, ' ')
    .replace(/\s*hard seltzer\s*/gi, ' ')
    .replace(/\s*seltzer\s*/gi, ' ')
    .replace(/\s*beer\s*/gi, ' ')
    .replace(/\s*light\s*beer\s*/gi, ' light ')
    .replace(/\s*premium\s*/gi, ' ')
    .replace(/\s*craft\s*/gi, ' ')
    .replace(/\s*domestic\s*/gi, ' ')
    .replace(/\s*imported\s*/gi, ' ')
    // Remove parenthetical content that often contains sizes
    .replace(/\s*\([^)]*\)\s*/gi, ' ')
    .replace(/\s*\[[^\]]*\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  return normalized;
}

function extractSizes(products: Product[]): string[] {
  const sizes = new Set<string>();
  
  products.forEach(product => {
    const title = product.title;
    
    // Extract size patterns
    const sizeMatches = [
      ...title.matchAll(/(\d+(?:\.\d+)?)\s*(ml|l|liter|litre)/gi),
      ...title.matchAll(/(\d+(?:\.\d+)?)\s*(oz|ounce)/gi),
      ...title.matchAll(/(\d+)\s*(pack|pk)/gi),
      ...title.matchAll(/(\d+x\d+|\d+\s*x\s*\d+)/gi)
    ];
    
    sizeMatches.forEach(match => {
      sizes.add(match[0]);
    });
    
    // If no size found, add the price as identifier
    if (sizeMatches.length === 0) {
      sizes.add(`$${product.price}`);
    }
  });
  
  return Array.from(sizes).sort();
}

export function generateDuplicateReport(products: Product[]): string {
  const duplicateGroups = analyzeDuplicates(products);
  
  if (duplicateGroups.length === 0) {
    return "No duplicate products found!";
  }
  
  let report = `Found ${duplicateGroups.length} groups of duplicate products:\n\n`;
  
  duplicateGroups.forEach((group, index) => {
    report += `${index + 1}. **${group.baseName}** (${group.products.length} variants)\n`;
    report += `   Categories: ${group.categories.join(', ')}\n`;
    report += `   Sizes/Variants: ${group.sizes.join(', ')}\n`;
    report += `   Products:\n`;
    
    group.products.forEach(product => {
      report += `   - ${product.title} ($${product.price}) [${product.category}]\n`;
    });
    
    report += '\n';
  });
  
  return report;
}