import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';
import { parseProductTitle } from '@/utils/productUtils';

interface OptimizedProductCardProps {
  product: any;
  isSearchFocused: boolean;
  selectedCategory: number;
  isCocktailsTab: boolean;
  selectedVariant: any;
  cartQty: number;
  onProductClick: (product: any) => void;
  onAddToCart: (item: any) => void;
  onQuantityChange: (productId: string, variantId: string | undefined, delta: number) => void;
  onVariantChange: (productId: string, variantId: string) => void;
  applyMarkup: (price: number) => number;
}

// Memoized product card for better performance
export const OptimizedProductCard = memo<OptimizedProductCardProps>(({
  product,
  isSearchFocused,
  selectedCategory,
  isCocktailsTab,
  selectedVariant,
  cartQty,
  onProductClick,
  onAddToCart,
  onQuantityChange,
  onVariantChange,
  applyMarkup
}) => {
  const { cleanTitle, packageSize } = parseProductTitle(product.title);
  
  // Special handling for ice product
  let displayTitle = cleanTitle;
  let displayPackage = packageSize;
  
  if (product.title.toLowerCase().includes('bag of ice')) {
    displayTitle = product.title.replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*bs\s*$/gi, '').replace(/[.\u2026\u2022\u2023\u25E6\u00B7\u22C5\u02D9\u0387\u16EB\u2D4F]+\s*$/g, '').trim();
    displayPackage = '20 Lbs';
  }

  return (
    <div 
      className={`bg-card border rounded-lg transition-all duration-200 flex flex-col h-full ${
        isCocktailsTab ? 'cursor-pointer hover:border-primary/50' : ''
      } ${isSearchFocused ? 'p-1 sm:p-2' : 'p-2 sm:p-3'} hover:shadow-md`}
      onClick={() => onProductClick(product)}
    >
      {/* Product image - mobile optimized spacing */}
      <div className={`bg-muted rounded overflow-hidden w-full aspect-square ${
        isSearchFocused 
          ? 'mb-1' 
          : 'mb-1 sm:mb-2'
      }`}>
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      
      {/* Product info - mobile optimized */}
      <div className={`flex flex-col flex-1 justify-between ${
        isSearchFocused ? 'min-h-[4rem]' : 'min-h-[5rem] sm:min-h-[6rem]'
      }`}>
        <div className="flex-1 flex flex-col justify-start">
          {isCocktailsTab ? (
            <h4 className="font-bold leading-tight text-center text-xs sm:text-sm mb-1">
              {product.title}
            </h4>
          ) : (
            <>
              <h4 className={`font-bold leading-tight text-center line-clamp-2 ${
                isSearchFocused ? 'text-[10px] sm:text-xs mb-0.5' : 'text-xs sm:text-sm mb-1'
              }`}>
                {displayTitle}
              </h4>
              {displayPackage && (
                <p className={`text-foreground text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                  isSearchFocused ? 'text-[8px] sm:text-[10px] leading-2 mb-0.5' : 'text-[9px] sm:text-xs leading-3 mb-1'
                }`}>
                  {displayPackage}
                </p>
              )}
            </>
          )}

          {/* Variant selector for products with multiple variants */}
          {product.variants.length > 1 && (
            <div className="mb-1">
              <Select
                value={selectedVariant?.id}
                onValueChange={(variantId) => onVariantChange(product.id, variantId)}
              >
                <SelectTrigger className="w-full h-7 text-[10px] sm:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((variant: any) => (
                    <SelectItem key={variant.id} value={variant.id} className="text-[10px] sm:text-xs">
                      {variant.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cocktail drink count */}
          {isCocktailsTab && (() => {
            const drinkMatch = product.description.match(/(\d+)\s*(?:drinks?|servings?|cocktails?)/i);
            if (drinkMatch) {
              return (
                <p className="text-foreground text-center mb-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                  {drinkMatch[1]} drinks
                </p>
              );
            }
            return null;
          })()}
        </div>
        
        {/* Price and cart controls container - FIXED VERTICAL ALIGNMENT */}
        <div className="mt-auto pt-2 flex items-end justify-between min-h-[32px]">
          {/* Price aligned left and bottom */}
          <div className="flex items-end">
            <Badge variant="secondary" className="font-semibold text-xs">
              ${applyMarkup(selectedVariant?.price || 0).toFixed(2)}
            </Badge>
          </div>
            
          {/* Cart Controls aligned right and bottom */}
          <div className="flex items-end">
            {cartQty > 0 ? (
              <div 
                className="flex items-center bg-muted/80 rounded-md px-1 py-0.5 gap-1 border border-border/50" 
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-sm hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    const variantId = selectedVariant?.id || product.variants[0]?.id;
                    console.log('🛒 OptimizedProductCard: Decrement quantity for product:', String(product.id), 'variant:', variantId ? String(variantId) : 'default');
                    onQuantityChange(String(product.id), variantId ? String(variantId) : undefined, -1);
                  }}
                >
                  <Minus className="w-3 h-3" strokeWidth={2} />
                </Button>
                <span className="text-xs font-bold min-w-[16px] text-center">
                  {cartQty}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-sm hover:bg-primary/20 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    const variantId = selectedVariant?.id || product.variants[0]?.id;
                    console.log('🛒 OptimizedProductCard: Increment quantity for product:', String(product.id), 'variant:', variantId ? String(variantId) : 'default');
                    onQuantityChange(String(product.id), variantId ? String(variantId) : undefined, 1);
                  }}
                >
                  <Plus className="w-3 h-3" strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <button
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  const variant = selectedVariant || product.variants[0];
                  if (variant) {
                    console.log('🛒 OptimizedProductCard: Adding to cart - Product:', String(product.id), 'Variant:', String(variant.id));
                    onAddToCart({
                      id: String(product.id),
                      title: product.title,
                      name: product.title,
                      price: applyMarkup(variant.price),
                      image: product.image || '',
                      variant: String(variant.id)
                    });
                  }
                }}
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isSearchFocused === nextProps.isSearchFocused &&
    prevProps.selectedCategory === nextProps.selectedCategory &&
    prevProps.cartQty === nextProps.cartQty &&
    prevProps.selectedVariant?.id === nextProps.selectedVariant?.id
  );
});