import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, getTotalItems } = useUnifiedCart();

  const handleBack = () => {
    const referrer = localStorage.getItem('deliveryAppReferrer') || '/';
    navigate(referrer);
  };

  const handleAddToCart = (item: any) => {
    console.log('🛒 Adding to cart from search:', item);
    addToCart(item);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Search Products</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart ({getTotalItems()})
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search All Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search for products, brands, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Search Results Placeholder */}
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Search Functionality</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `Searching for: "${searchQuery}"` 
                : 'Enter a search term to find products across all delivery apps.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SearchPage;