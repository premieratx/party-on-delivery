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

interface DuplicateGroup {
  baseName: string;
  products: Product[];
  sizes: string[];
  categories: string[];
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
  // Remove common size indicators and normalize
  const normalized = title
    .toLowerCase()
    .replace(/\s*\d+(\.\d+)?\s*(ml|l|liter|litre|oz|ounce)s?\s*/gi, ' ')
    .replace(/\s*\d+\s*(pack|pk)\s*/gi, ' ')
    .replace(/\s*(\d+x\d+|\d+\s*x\s*\d+)\s*/gi, ' ')
    .replace(/\s*single\s*/gi, ' ')
    .replace(/\s*bottle\s*/gi, ' ')
    .replace(/\s*can\s*/gi, ' ')
    .replace(/\s*case\s*/gi, ' ')
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