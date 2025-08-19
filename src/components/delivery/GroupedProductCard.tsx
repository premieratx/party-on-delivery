import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';

interface ProductVariant {
  id: string;
  price: number;
  size: string;
  originalProduct: any;
}

interface GroupedProduct {
  id: string;
  baseTitle: string;
  image: string;
  variants: ProductVariant[];
  originalProducts: any[];
}

interface GroupedProductCardProps {
  groupedProduct: GroupedProduct;
  getCartItemQuantity: (productId: string, variantId: string | undefined) => number;
  onAddToCart: (product: any) => void;
  onQuantityChange: (productId: string, variantId: string | undefined, delta: number) => void;
  onProductClick?: (product: any) => void;
}

export const GroupedProductCard: React.FC<GroupedProductCardProps> = ({
  groupedProduct,
  getCartItemQuantity,
  onAddToCart,
  onQuantityChange,
  onProductClick
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  
  const selectedVariant = groupedProduct.variants[selectedVariantIndex];
  const selectedProduct = selectedVariant.originalProduct;
  const quantity = getCartItemQuantity(selectedProduct.id, selectedVariant.id);
  
  const { cleanTitle } = parseProductTitle(groupedProduct.baseTitle);

  const handleAddToCart = () => {
    onAddToCart(selectedProduct);
  };

  const handleQuantityChange = (delta: number) => {
    onQuantityChange(selectedProduct.id, selectedVariant.id, delta);
  };

  return (
    <div 
      className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col h-full cursor-pointer"
      onClick={() => onProductClick?.(selectedProduct)}
    >
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden">
        <OptimizedImage
          src={groupedProduct.image}
          alt={cleanTitle}
          className="w-full h-full object-cover hover-scale"
        />
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1 justify-between space-y-3">
        {/* Title */}
        <div className="text-center">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-2">
            {cleanTitle}
          </h3>
        </div>

        {/* Variant Selection - Only show if multiple variants */}
        {groupedProduct.variants.length > 1 && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 gap-1">
              {groupedProduct.variants.map((variant, index) => (
                <label key={variant.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`variant-${groupedProduct.id}`}
                    checked={selectedVariantIndex === index}
                    onChange={() => setSelectedVariantIndex(index)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs flex-1">
                    {variant.size} - ${variant.price.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Single variant info */}
        {groupedProduct.variants.length === 1 && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {selectedVariant.size}
            </p>
          </div>
        )}

        {/* Price and Cart Controls */}
        <div className="flex flex-col items-center space-y-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <span className="font-bold text-primary text-lg">
              ${selectedVariant.price.toFixed(2)}
            </span>
            {quantity > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {quantity}
              </Badge>
            )}
          </div>
          
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-muted rounded-md p-1 w-full max-w-[120px]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuantityChange(-1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-medium px-2">{quantity}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuantityChange(1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};