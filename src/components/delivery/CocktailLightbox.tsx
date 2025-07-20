import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface CocktailLightboxProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: { id: string; title: string; price: number; available: boolean }) => void;
}

export const CocktailLightbox: React.FC<CocktailLightboxProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const variant = selectedVariant || (product.variants && product.variants[0]);
  const formatPrice = (price: number) => {
    return isNaN(price) ? 0 : price;
  };

  const price = variant ? formatPrice(variant.price) : formatPrice(product.price);

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
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image Carousel */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                <img
                  src={allImages[currentImageIndex] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                
                {/* Image Navigation */}
                {hasMultipleImages && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentImageIndex === index 
                              ? 'bg-white' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {hasMultipleImages && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-primary' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={image || '/placeholder.svg'}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-3">
                  {product.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz')}
                </h2>
                <Badge variant="secondary" className="text-xl font-bold">
                  ${price.toFixed(2)}
                </Badge>
              </div>
              
              {/* Product Description */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <div 
                    className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
              
              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Options</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                          (selectedVariant?.id || product.variants?.[0]?.id) === v.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{v.title}</span>
                          <span className="text-primary font-bold text-lg">
                            ${formatPrice(v.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add to Cart */}
              <Button
                onClick={() => onAddToCart(product, variant)}
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-lg py-6"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart - ${price.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CocktailLightbox;