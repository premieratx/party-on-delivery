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
  
  // Extract various package size patterns
  const patterns = [
    // Beer/Seltzer patterns: "12 Pack", "24pk", "6-pack"
    /(\d+)\s*(-|pk|pack)(?:\s*[×x*]\s*(\d+)\s*(oz|ml))?/gi,
    // Liquor/Wine patterns: "750ml", "1.75L", "1L"
    /(\d+(?:\.\d+)?)\s*(ml|l|oz)/gi,
    // Just oz patterns: "12oz", "16 oz"
    /(\d+)\s*oz/gi
  ];

  let packageSize = cocktailSubtitle; // Use cocktail subtitle as package size if exists
  let titleWithoutSize = titleWithoutCocktail;

  // Only look for other patterns if no cocktail subtitle was found
  if (!cocktailSubtitle) {
    // Try each pattern
    for (const pattern of patterns) {
      const matches = cleanedTitle.match(pattern);
      if (matches) {
        // Take the first match for package size
        packageSize = matches[0];
        
        // Remove all instances of the pattern from title
        titleWithoutSize = cleanedTitle.replace(pattern, '').trim();
        break;
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
    .replace(/\s*straight\s*(bourbon|rye|whiskey)\s*(\d+\s*year)/gi, '$1 $2') // "Bulleit Straight Bourbon 6 Year" -> "Bulleit Bourbon 6 Year"
    .replace(/\s*frontier\s*whiskey\s*/gi, ' Whiskey ')
    .replace(/\s+/g, ' ')
    .trim();

  // Format package size for display (only if not cocktail subtitle)
  if (packageSize && !cocktailSubtitle) {
    // Standardize common formats
    packageSize = packageSize
      .replace(/(\d+)\s*(-|pk|pack)/gi, '$1 Pack')
      .replace(/(\d+(?:\.\d+)?)\s*ml/gi, '$1mL')
      .replace(/(\d+(?:\.\d+)?)\s*l/gi, '$1L')
      .replace(/(\d+)\s*oz/gi, '$1oz');
  }

  return {
    cleanTitle: titleWithoutSize,
    packageSize: packageSize
  };
}