import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Beer, Martini, Package, Plus } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';

interface ProductCategoriesProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
}

type Category = 'beer' | 'liquor' | 'cocktails' | 'party-supplies';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: Category;
  description?: string;
  variants?: string[];
}

// Mock products - in real app, these would come from Shopify
const mockProducts: Product[] = [
  {
    id: 'beer-1',
    title: 'Craft IPA 6-Pack',
    price: 12.99,
    image: '/api/placeholder/300/300',
    category: 'beer',
    description: 'Fresh hoppy IPA with citrus notes'
  },
  {
    id: 'beer-2',
    title: 'Light Beer 12-Pack',
    price: 18.99,
    image: '/api/placeholder/300/300',
    category: 'beer',
    description: 'Crisp and refreshing light beer'
  },
  {
    id: 'liquor-1',
    title: 'Premium Vodka',
    price: 29.99,
    image: '/api/placeholder/300/300',
    category: 'liquor',
    description: 'Smooth premium vodka',
    variants: ['750ml', '1L']
  },
  {
    id: 'liquor-2',
    title: 'Whiskey Bottle',
    price: 45.99,
    image: '/api/placeholder/300/300',
    category: 'liquor',
    description: 'Rich bourbon whiskey'
  },
  {
    id: 'cocktail-1',
    title: 'Margarita Mix',
    price: 8.99,
    image: '/api/placeholder/300/300',
    category: 'cocktails',
    description: 'Ready-to-drink margarita'
  },
  {
    id: 'party-1',
    title: 'Party Cups (50ct)',
    price: 5.99,
    image: '/api/placeholder/300/300',
    category: 'party-supplies',
    description: 'Disposable party cups'
  }
];

const categories = [
  { id: 'beer' as Category, name: 'Beer', icon: Beer, color: 'bg-amber-500' },
  { id: 'liquor' as Category, name: 'Liquor', icon: Martini, color: 'bg-blue-500' },
  { id: 'cocktails' as Category, name: 'Cocktails', icon: Martini, color: 'bg-pink-500' },
  { id: 'party-supplies' as Category, name: 'Party Supplies', icon: Package, color: 'bg-purple-500' }
];

export const ProductCategories: React.FC<ProductCategoriesProps> = ({ 
  onAddToCart, 
  cartItemCount, 
  onOpenCart 
}) => {
  const [activeCategory, setActiveCategory] = useState<Category>('beer');

  const filteredProducts = mockProducts.filter(product => product.category === activeCategory);

  const handleAddToCart = (product: Product, variant?: string) => {
    onAddToCart({
      id: product.id,
      title: variant ? `${product.title} (${variant})` : product.title,
      price: product.price,
      image: product.image,
      variant
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header with Cart */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Choose Your Products
            </h1>
            
            <Button 
              variant="cart" 
              size="lg"
              onClick={onOpenCart}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground min-w-[20px] h-5 rounded-full text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Category Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "step-active" : "step"}
                  size="lg"
                  onClick={() => setActiveCategory(category.id)}
                  className="h-20 flex-col gap-2"
                >
                  <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-card transition-all duration-300 animate-fade-in">
              <div className="aspect-square bg-muted relative">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                  <p className="text-xl font-bold text-primary mt-2">${product.price}</p>
                </div>

                {product.variants ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Size:</p>
                    <div className="flex gap-2">
                      {product.variants.map((variant) => (
                        <Button
                          key={variant}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCart(product, variant)}
                          className="flex-1"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {variant}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="default" 
                    size="lg"
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No products found in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};