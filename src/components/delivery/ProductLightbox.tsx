import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus } from 'lucide-react';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ProductLightboxProps {
  product: ShopifyProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ShopifyProduct, variant?: any) => void;
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  cartQuantity: number;
  selectedVariant?: any;
}

export const ProductLightbox: React.FC<ProductLightboxProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onUpdateQuantity,
  cartQuantity,
  selectedVariant
}) => {
  if (!product) return null;

  const variant = selectedVariant || product.variants[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-md"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="bg-muted p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain max-w-[300px] max-h-[300px]"
            />
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4">{product.title}</h2>
              
              {/* Price */}
              <Badge variant="secondary" className="text-lg font-semibold mb-4 px-3 py-1">
                ${variant?.price.toFixed(2)}
              </Badge>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div 
                    className="text-muted-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {/* Variant info if multiple variants */}
              {product.variants.length > 1 && variant && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Selected</h3>
                  <p className="text-sm text-muted-foreground">{variant.title}</p>
                </div>
              )}
            </div>

            {/* Add to Cart Controls */}
            <div className="flex items-center justify-between pt-4 border-t">
              {cartQuantity > 0 ? (
                <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onUpdateQuantity(product.id, variant?.id, Math.max(0, cartQuantity - 1))}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="text-lg font-medium px-4 min-w-[3rem] text-center">
                    {cartQuantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => onUpdateQuantity(product.id, variant?.id, cartQuantity + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  className="flex-1 text-base"
                  onClick={() => {
                    if (variant) {
                      onAddToCart(product, variant);
                    }
                  }}
                >
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};