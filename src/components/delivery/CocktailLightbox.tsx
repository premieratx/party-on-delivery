import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: string;
  image: {
    url: string;
  };
  variants?: Array<{
    id: string;
    title: string;
    price: string;
  }>;
}

interface CocktailLightboxProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: { id: string; title: string; price: string }) => void;
}

export const CocktailLightbox: React.FC<CocktailLightboxProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  if (!product) return null;

  const variant = selectedVariant || (product.variants && product.variants[0]);
  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return isNaN(price) ? 0 : price;
  };

  const price = variant ? formatPrice(variant.price) : formatPrice(product.price);

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={product.image?.url || '/placeholder.svg'}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            
            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {product.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz')}
                </h2>
                <Badge variant="secondary" className="text-xl font-bold">
                  ${price.toFixed(2)}
                </Badge>
              </div>
              
              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Options:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 border rounded-lg text-left transition-all ${
                          (selectedVariant?.id || product.variants?.[0]?.id) === v.id
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{v.title}</span>
                          <span className="text-primary font-bold">
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
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
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