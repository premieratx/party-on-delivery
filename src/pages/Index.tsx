import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Beer, Wine, Package, Star } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(0);

  // Mock categories and products for testing
  const categories = [
    { title: 'Wine & Champagne', icon: Wine, products: mockWineProducts },
    { title: 'Beer & Seltzers', icon: Beer, products: mockBeerProducts },
    { title: 'Spirits', icon: Package, products: mockSpiritsProducts },
    { title: 'Party Supplies', icon: Package, products: mockSuppliesProducts }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Party On Delivery</h1>
          <p className="text-muted-foreground mb-8">Loading your party essentials...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const currentCategory = categories[selectedCategory];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">🎉 Party On Delivery</h1>
        <p className="text-lg opacity-90">Austin's fastest party supply delivery</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm">4.9 • Over 1000+ happy customers</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex overflow-x-auto p-2 gap-2 max-w-4xl mx-auto">
          {categories.map((category, index) => {
            const isActive = selectedCategory === index;
            const IconComponent = category.icon;
            
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "outline"}
                onClick={() => setSelectedCategory(index)}
                className="flex-shrink-0 flex items-center gap-2 min-w-max"
              >
                <IconComponent className="w-4 h-4" />
                {category.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{currentCategory.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentCategory.products.map((product, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-muted">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">
                  {product.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">
                    ${product.price}
                  </span>
                  <Button size="sm" className="h-8 w-8 p-0">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mock product data for testing
const mockWineProducts = [
  { title: "Dom Pérignon Champagne", price: "199.99", image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=400&h=400&fit=crop" },
  { title: "Kendall-Jackson Chardonnay", price: "24.99", image: "https://images.unsplash.com/photo-1506377247951-c7d0e1b2a9d8?w=400&h=400&fit=crop" },
  { title: "Silver Oak Cabernet", price: "89.99", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=400&fit=crop" },
  { title: "Veuve Clicquot Rosé", price: "79.99", image: "https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=400&h=400&fit=crop" }
];

const mockBeerProducts = [
  { title: "Corona Extra 12-pack", price: "16.99", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop" },
  { title: "Stella Artois 6-pack", price: "12.99", image: "https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=400&h=400&fit=crop" },
  { title: "White Claw Variety Pack", price: "18.99", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { title: "Heineken 12-pack", price: "19.99", image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" }
];

const mockSpiritsProducts = [
  { title: "Grey Goose Vodka", price: "49.99", image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { title: "Macallan 18 Year", price: "649.99", image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop" },
  { title: "Patron Silver Tequila", price: "54.99", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop" },
  { title: "Hendricks Gin", price: "34.99", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" }
];

const mockSuppliesProducts = [
  { title: "Party Cups 50-pack", price: "8.99", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop" },
  { title: "Ice Bucket & Tongs", price: "24.99", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { title: "Party Balloons Set", price: "12.99", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop" },
  { title: "Cocktail Napkins", price: "5.99", image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop" }
];

export default Index;