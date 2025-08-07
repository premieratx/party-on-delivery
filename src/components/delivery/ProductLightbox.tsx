import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseProductTitle } from '@/utils/productUtils';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[]; // Add support for multiple images
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
  onProceedToCheckout?: () => void;
}

export const ProductLightbox: React.FC<ProductLightboxProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onUpdateQuantity,
  cartQuantity,
  selectedVariant,
  onProceedToCheckout
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when product changes or dialog opens
  React.useEffect(() => {
    if (isOpen && product) {
      setCurrentImageIndex(0);
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  const variant = selectedVariant || product.variants[0];
  
  // Create array of all available images (main image + additional images)
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const hasMultipleImages = allImages.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };


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
          {/* Product Image Carousel */}
          <div className="relative bg-muted p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {/* Main Image */}
            <img
              src={allImages[currentImageIndex]}
              alt={`${product.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain max-w-[300px] max-h-[300px] animate-fade-in"
            />
            
            {/* Navigation Arrows - only show if multiple images */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {/* Image Dots Indicator - only show if multiple images */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Image Counter - only show if multiple images */}
            {hasMultipleImages && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {(() => {
                const { cleanTitle, packageSize } = parseProductTitle(product.title);
                return (
                  <>
                    <h2 className="text-2xl font-bold mb-2">{cleanTitle}</h2>
                    {packageSize && (
                      <p className="text-lg text-muted-foreground mb-4">{packageSize}</p>
                    )}
                  </>
                );
              })()}
              
              {/* Price */}
              <Badge variant="secondary" className="text-lg font-semibold mb-4 px-3 py-1">
                ${(variant?.price || 0).toFixed(2)}
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

            {/* Add to Cart Controls - Always visible at bottom */}
            <div className="space-y-3 pt-4 border-t">
              {/* Add to Cart or Quantity Controls */}
              <div className="w-full">
                {cartQuantity > 0 ? (
                  <div className="flex items-center justify-center gap-2 bg-muted rounded-lg p-2">
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
                    className="w-full text-base"
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
              
              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 text-base"
                  onClick={onClose}
                >
                  Keep Shopping
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1 text-base"
                  onClick={() => {
                    if (onProceedToCheckout) {
                      onProceedToCheckout();
                    }
                    onClose();
                  }}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};