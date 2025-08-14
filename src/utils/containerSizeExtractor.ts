/**
 * Utility function to extract container size information from product titles
 */

export function extractContainerSize(title: string): string {
  // Common patterns for container sizes
  const patterns = [
    // ML patterns (750ml, 375ml, etc.)
    /(\d+)\s*ml/i,
    // Liter patterns (1.75L, 1L, etc.)
    /(\d+(?:\.\d+)?)\s*L(?:iter)?/i,
    // Ounce patterns (12oz, 16oz, etc.)
    /(\d+)\s*oz/i,
    // Pack patterns (12 pack, 6-pack, etc.)
    /(\d+)[\s\-]*pack/i,
    // Count patterns (4 count, 6 count, etc.)
    /(\d+)\s*count/i,
    // Bottle patterns (4 bottles, 6 bottles, etc.)
    /(\d+)\s*bottles?/i,
    // Can patterns (12 cans, 6 cans, etc.)
    /(\d+)\s*cans?/i,
    // Cocktail patterns (4 cocktails, 2 cocktails, etc.)
    /(\d+)\s*cocktails?/i,
    // Gallon patterns (1 gallon, 2 gallons, etc.)
    /(\d+(?:\.\d+)?)\s*gallons?/i,
    // Quart patterns (1 quart, 2 quarts, etc.)
    /(\d+(?:\.\d+)?)\s*quarts?/i,
    // Pint patterns (1 pint, 2 pints, etc.)
    /(\d+(?:\.\d+)?)\s*pints?/i,
    // Custom patterns for mixed drinks
    /serves?\s*(\d+)/i,
    // Handle "Single" or "Individual" items
    /\b(single|individual)\b/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      // Handle special cases
      if (match[0].toLowerCase().includes('single') || match[0].toLowerCase().includes('individual')) {
        return 'Single Item';
      }
      
      // Return the matched size with proper formatting
      let size = match[0];
      
      // Standardize formatting
      size = size.replace(/\s+/g, ' '); // normalize spaces
      size = size.toLowerCase();
      
      // Capitalize first letter and units
      size = size.replace(/^(\d+)(\w*)/, (_, num, unit) => {
        const unitMap: { [key: string]: string } = {
          'ml': 'ml',
          'l': 'L',
          'oz': 'oz',
          'pack': ' Pack',
          'count': ' Count',
          'bottles': ' Bottles',
          'bottle': ' Bottle',
          'cans': ' Cans',
          'can': ' Can',
          'cocktails': ' Cocktails',
          'cocktail': ' Cocktail',
          'gallons': ' Gallons',
          'gallon': ' Gallon',
          'quarts': ' Quarts',
          'quart': ' Quart',
          'pints': ' Pints',
          'pint': ' Pint',
          'liter': 'L',
          'liters': 'L'
        };
        
        return num + (unitMap[unit] || unit);
      });
      
      // Handle "serves" pattern
      if (match[0].toLowerCase().includes('serves')) {
        size = `Serves ${match[1]}`;
      }
      
      return size;
    }
  }

  // If no pattern matches, check for common keywords that might indicate size
  const keywords = ['mini', 'large', 'jumbo', 'family', 'party', 'small', 'medium', 'big'];
  for (const keyword of keywords) {
    if (title.toLowerCase().includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Size';
    }
  }

  // Default fallback - assume it's a single item
  return 'Single Item';
}

/**
 * Get a short description of the container for display in search results
 */
export function getContainerDescription(title: string): string {
  const size = extractContainerSize(title);
  
  // If it's a pack, emphasize that
  if (size.toLowerCase().includes('pack') || size.toLowerCase().includes('count')) {
    return size;
  }
  
  // If it's a liquid measurement, show it prominently
  if (size.match(/\d+(ml|L|oz|gallon|quart|pint)/i)) {
    return size;
  }
  
  // For cocktails or serves
  if (size.toLowerCase().includes('serves') || size.toLowerCase().includes('cocktail')) {
    return size;
  }
  
  // For single items, don't show anything to save space
  if (size === 'Single Item') {
    return '';
  }
  
  return size;
}