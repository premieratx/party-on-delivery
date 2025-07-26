/**
 * Party Planning Calculation System
 * 
 * This system calculates recommendations based on standard container sizes and converts
 * user selections back to equivalent standard containers for display.
 * 
 * Standard containers:
 * - Beer: 12-pack (12 beers per case)
 * - Wine: 750mL bottle (5 glasses per bottle)
 * - Liquor: 750mL bottle (25 drinks per bottle)
 * - Cocktails: 12 drinks per kit
 */

import { parseProductTitle } from './productUtils';

// Standard container definitions
export const STANDARD_CONTAINERS = {
  beer: {
    size: 12, // beers per case
    unit: 'Case',
    volumePerItem: 355, // mL per beer (standard 12oz can)
  },
  wine: {
    size: 750, // mL per bottle
    unit: 'Bottle',
    drinksPerContainer: 5, // glasses per bottle
  },
  liquor: {
    size: 750, // mL per bottle
    unit: 'Bottle', 
    drinksPerContainer: 25, // drinks per bottle
  },
  cocktails: {
    size: 12, // drinks per kit
    unit: 'Kit',
    drinksPerContainer: 12, // drinks per kit
  }
};

export interface RecommendationResult {
  category: string;
  recommendedQuantity: number;
  standardUnit: string;
  totalDrinks?: number;
  totalVolume?: number;
}

export interface SelectionSummary {
  category: string;
  selectedQuantity: number;
  standardUnit: string;
  actualDrinks?: number;
  actualVolume?: number;
  equivalentStandardContainers: number;
}

/**
 * Calculate recommendations for each drink category
 */
export function calculateRecommendations(
  numberOfPeople: number,
  drinkerType: 'light' | 'medium' | 'heavy',
  eventDuration: number,
  drinkTypes: string[]
): RecommendationResult[] {
  let drinksPerPersonPerHour = 0.5;
  if (drinkerType === 'light') drinksPerPersonPerHour = 0.5;
  else if (drinkerType === 'medium') drinksPerPersonPerHour = 1;
  else if (drinkerType === 'heavy') drinksPerPersonPerHour = 1.5;
  
  const totalDrinksNeeded = numberOfPeople * drinksPerPersonPerHour * eventDuration;
  const categoryRatio = 1 / drinkTypes.length;
  const drinksPerCategory = Math.ceil(totalDrinksNeeded * categoryRatio);

  return drinkTypes.map(category => {
    switch (category) {
      case 'beer':
        const beerCases = Math.ceil(drinksPerCategory / STANDARD_CONTAINERS.beer.size);
        return {
          category,
          recommendedQuantity: beerCases,
          standardUnit: STANDARD_CONTAINERS.beer.unit,
          totalDrinks: beerCases * STANDARD_CONTAINERS.beer.size,
          totalVolume: beerCases * STANDARD_CONTAINERS.beer.size * STANDARD_CONTAINERS.beer.volumePerItem
        };
      
      case 'wine':
        const wineBottles = Math.ceil(drinksPerCategory / STANDARD_CONTAINERS.wine.drinksPerContainer);
        return {
          category,
          recommendedQuantity: wineBottles,
          standardUnit: STANDARD_CONTAINERS.wine.unit,
          totalDrinks: wineBottles * STANDARD_CONTAINERS.wine.drinksPerContainer,
          totalVolume: wineBottles * STANDARD_CONTAINERS.wine.size
        };
      
      case 'liquor':
        const liquorBottles = Math.ceil(drinksPerCategory / STANDARD_CONTAINERS.liquor.drinksPerContainer);
        return {
          category,
          recommendedQuantity: liquorBottles,
          standardUnit: STANDARD_CONTAINERS.liquor.unit,
          totalDrinks: liquorBottles * STANDARD_CONTAINERS.liquor.drinksPerContainer,
          totalVolume: liquorBottles * STANDARD_CONTAINERS.liquor.size
        };
      
      case 'cocktails':
        const cocktailKits = Math.ceil(drinksPerCategory / STANDARD_CONTAINERS.cocktails.drinksPerContainer);
        return {
          category,
          recommendedQuantity: cocktailKits,
          standardUnit: STANDARD_CONTAINERS.cocktails.unit,
          totalDrinks: cocktailKits * STANDARD_CONTAINERS.cocktails.drinksPerContainer
        };
      
      default:
        return {
          category,
          recommendedQuantity: drinksPerCategory,
          standardUnit: 'items'
        };
    }
  });
}

/**
 * Calculate actual drinks/volume from selected products and convert to standard containers
 */
export function calculateSelectionSummary(
  category: string,
  selectedItems: Array<{ title: string; quantity: number; price: number }>
): SelectionSummary {
  let totalActualDrinks = 0;
  let totalActualVolume = 0;
  let totalSelectedQuantity = 0;

  selectedItems.forEach(item => {
    totalSelectedQuantity += item.quantity;
    const { packageSize } = parseProductTitle(item.title);
    
    switch (category) {
      case 'beer':
        // Extract pack size and convert to total beers
        const beerMatch = packageSize.match(/(\d+)\s*Pack/i);
        const beersPerPack = beerMatch ? parseInt(beerMatch[1]) : 12; // default to 12-pack
        const totalBeers = item.quantity * beersPerPack;
        totalActualDrinks += totalBeers;
        totalActualVolume += totalBeers * STANDARD_CONTAINERS.beer.volumePerItem;
        break;
      
      case 'wine':
        // Extract bottle size
        const wineMatch = packageSize.match(/(\d+(?:\.\d+)?)\s*(ml|l)/i);
        let bottleSize = 750; // default 750mL
        if (wineMatch) {
          const size = parseFloat(wineMatch[1]);
          const unit = wineMatch[2].toLowerCase();
          bottleSize = unit === 'l' ? size * 1000 : size;
        }
        const totalWineVolume = item.quantity * bottleSize;
        totalActualVolume += totalWineVolume;
        totalActualDrinks += Math.floor(totalWineVolume / STANDARD_CONTAINERS.wine.size * STANDARD_CONTAINERS.wine.drinksPerContainer);
        break;
      
      case 'liquor':
        // Extract bottle size
        const liquorMatch = packageSize.match(/(\d+(?:\.\d+)?)\s*(ml|l)/i);
        let liquorBottleSize = 750; // default 750mL
        if (liquorMatch) {
          const size = parseFloat(liquorMatch[1]);
          const unit = liquorMatch[2].toLowerCase();
          liquorBottleSize = unit === 'l' ? size * 1000 : size;
        }
        const totalLiquorVolume = item.quantity * liquorBottleSize;
        totalActualVolume += totalLiquorVolume;
        totalActualDrinks += Math.floor(totalLiquorVolume / STANDARD_CONTAINERS.liquor.size * STANDARD_CONTAINERS.liquor.drinksPerContainer);
        break;
      
      case 'cocktails':
        // Extract number of drinks from title/description
        const cocktailMatch = item.title.match(/(\d+)\s*(drink|cocktail|serve)/i) || 
                              packageSize.match(/(\d+)\s*(drink|cocktail|serve)/i);
        const drinksPerKit = cocktailMatch ? parseInt(cocktailMatch[1]) : 12; // default to 12
        totalActualDrinks += item.quantity * drinksPerKit;
        break;
    }
  });

  // Calculate equivalent standard containers
  let equivalentStandardContainers = 0;
  let standardUnit = '';

  switch (category) {
    case 'beer':
      equivalentStandardContainers = Math.ceil(totalActualDrinks / STANDARD_CONTAINERS.beer.size);
      standardUnit = `${STANDARD_CONTAINERS.beer.unit}${equivalentStandardContainers !== 1 ? 's' : ''}`;
      break;
    case 'wine':
      equivalentStandardContainers = Math.ceil(totalActualVolume / STANDARD_CONTAINERS.wine.size);
      standardUnit = `${STANDARD_CONTAINERS.wine.unit}${equivalentStandardContainers !== 1 ? 's' : ''}`;
      break;
    case 'liquor':
      equivalentStandardContainers = Math.ceil(totalActualVolume / STANDARD_CONTAINERS.liquor.size);
      standardUnit = `${STANDARD_CONTAINERS.liquor.unit}${equivalentStandardContainers !== 1 ? 's' : ''}`;
      break;
    case 'cocktails':
      equivalentStandardContainers = Math.ceil(totalActualDrinks / STANDARD_CONTAINERS.cocktails.drinksPerContainer);
      standardUnit = `${STANDARD_CONTAINERS.cocktails.unit}${equivalentStandardContainers !== 1 ? 's' : ''}`;
      break;
    default:
      equivalentStandardContainers = totalSelectedQuantity;
      standardUnit = 'items';
  }

  return {
    category,
    selectedQuantity: totalSelectedQuantity,
    standardUnit,
    actualDrinks: totalActualDrinks || undefined,
    actualVolume: totalActualVolume || undefined,
    equivalentStandardContainers
  };
}

/**
 * Format display text for recommendations
 */
export function formatRecommendationDisplay(rec: RecommendationResult): string {
  switch (rec.category) {
    case 'beer':
      return `${rec.recommendedQuantity} ${rec.standardUnit}${rec.recommendedQuantity !== 1 ? 's' : ''} (${rec.totalDrinks} Beers)`;
    case 'wine':
      return `${rec.recommendedQuantity} ${rec.standardUnit}${rec.recommendedQuantity !== 1 ? 's' : ''} (~${rec.totalDrinks} glasses)`;
    case 'liquor':
      return `${rec.recommendedQuantity} ${rec.standardUnit}${rec.recommendedQuantity !== 1 ? 's' : ''}`;
    case 'cocktails':
      return `${rec.recommendedQuantity} ${rec.standardUnit}${rec.recommendedQuantity !== 1 ? 's' : ''} (~${rec.totalDrinks} Cocktails)`;
    default:
      return `${rec.recommendedQuantity} ${rec.standardUnit}`;
  }
}

/**
 * Format display text for selections
 */
export function formatSelectionDisplay(summary: SelectionSummary): string {
  switch (summary.category) {
    case 'beer':
      return `${summary.equivalentStandardContainers} ${summary.standardUnit} (${summary.actualDrinks} Beers)`;
    case 'wine':
      return `${summary.equivalentStandardContainers} ${summary.standardUnit} (~${summary.actualDrinks} glasses)`;
    case 'liquor':
      return `${summary.equivalentStandardContainers} ${summary.standardUnit}`;
    case 'cocktails':
      return `${summary.equivalentStandardContainers} ${summary.standardUnit} (~${summary.actualDrinks} Cocktails)`;
    default:
      return `${summary.selectedQuantity} ${summary.standardUnit}`;
  }
}