export interface ParsedProduct {
  cleanTitle: string;
  packageSize: string;
}

export function parseProductTitle(title: string): ParsedProduct {
  // Remove trailing dots and special characters including big round dots
  const cleanedTitle = title.replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F\u25CF]+\s*$/g, '').trim();
  
  // Special handling for cocktail products with "(X drinks)" pattern
  const cocktailPattern = /\((\d+)\s+drinks?\)/gi;
  const cocktailMatch = cleanedTitle.match(cocktailPattern);
  let cocktailSubtitle = '';
  let titleWithoutCocktail = cleanedTitle;
  
  if (cocktailMatch) {
    const drinkCount = cocktailMatch[0].replace(/[()]/g, '').replace(/drinks?/i, 'Drinks');
    cocktailSubtitle = drinkCount.charAt(0).toUpperCase() + drinkCount.slice(1);
    titleWithoutCocktail = cleanedTitle.replace(cocktailPattern, '').trim();
  }
  
  // Enhanced patterns for better package detection
  const patterns = [
    // Enhanced beer/seltzer pack patterns: "12 Pack", "24pk", "6-pack", "4-Pack 12oz"
    /(\d+)\s*(-|pk|pack)(\s*[×x*]\s*(\d+)\s*(oz|ml))?/gi,
    // Size + count patterns: "12oz 6-pack", "16oz 4-pack"
    /(\d+)\s*(oz|ml)\s+(\d+)\s*(-|pk|pack)/gi,
    // Liquor/Wine patterns: "750ml", "1.75L", "1L"
    /(\d+(?:\.\d+)?)\s*(ml|l)/gi,
    // Just oz patterns: "12oz", "16 oz" (but only if no pack info found)
    /(\d+)\s*oz/gi
  ];

  let packageSize = cocktailSubtitle;
  let titleWithoutSize = titleWithoutCocktail;
  let packCount = null;
  let unitSize = null;

  // Only look for other patterns if no cocktail subtitle was found
  if (!cocktailSubtitle) {
    // Enhanced parsing to extract both pack count and unit size
    for (const pattern of patterns) {
      const matches = [...cleanedTitle.matchAll(new RegExp(pattern.source, pattern.flags))];
      if (matches.length > 0) {
        const match = matches[0];
        
        if (pattern.source.includes('(-|pk|pack)')) {
          // This is a pack pattern
          if (match[2] && match[4]) {
            // Has both pack count and unit size like "6-pack 12oz"
            packCount = parseInt(match[1]);
            unitSize = match[4] + match[5];
          } else {
            // Just pack count like "12 Pack"
            packCount = parseInt(match[1]);
          }
        } else if (pattern.source.includes('(oz|ml)\\s+')) {
          // Size + count pattern like "12oz 6-pack"
          unitSize = match[1] + match[2];
          packCount = parseInt(match[3]);
        } else if (pattern.source.includes('(ml|l)')) {
          // Liquor/wine size patterns
          unitSize = match[1] + match[2].toUpperCase();
        } else {
          // Just size pattern
          unitSize = match[1] + 'oz';
        }
        
        // Remove the matched pattern from title
        titleWithoutSize = cleanedTitle.replace(match[0], '').trim();
      }
    }

    // Create intelligent package description
    if (packCount && unitSize) {
      packageSize = formatPackageSize(packCount, unitSize);
    } else if (packCount) {
      packageSize = formatPackageSize(packCount);
    } else if (unitSize) {
      // For single bottles/cans, just show the size unless it's a common beer/seltzer size
      const sizeNum = parseInt(unitSize);
      if ((sizeNum === 12 || sizeNum === 16) && unitSize.includes('oz')) {
        // Likely a single can, but unclear - show size only
        packageSize = unitSize;
      } else {
        packageSize = unitSize;
      }
    }
  }

  // Additional cleanup for title - remove individual can/bottle sizes and big dots
  titleWithoutSize = titleWithoutSize
    .replace(/\s*Can\s*/gi, ' ')
    .replace(/\s*Bottle\s*/gi, ' ')
    .replace(/\s*Hard Seltzer\s*/gi, ' ')
    .replace(/\s*\d+\s*oz\s*/gi, ' ') // Remove standalone oz measurements
    .replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F\u25CF]+/g, '') // Remove all dots and bullets
    // Specific bourbon/whiskey title cleanup
    .replace(/\s*straight\s*(bourbon|rye|whiskey)\s*(\d+\s*year)/gi, '$1 $2')
    .replace(/\s*frontier\s*whiskey\s*/gi, ' Whiskey ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanTitle: titleWithoutSize,
    packageSize: packageSize || ''
  };
}

/**
 * Format package size in user-friendly format
 */
function formatPackageSize(count: number, unitSize?: string): string {
  const countWords: { [key: number]: string } = {
    4: 'Four-Pack',
    6: 'Six-Pack', 
    12: 'Twelve-Pack',
    18: 'Eighteen-Pack',
    24: 'Twenty-Four Pack',
    30: 'Thirty-Pack'
  };
  
  const baseFormat = countWords[count] || `${count}-Pack`;
  
  if (unitSize) {
    // Show unit size for clarity: "Six-Pack 12oz" or "Four-Pack 16oz"
    return `${baseFormat} ${unitSize}`;
  }
  
  return baseFormat;
}