import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

const SimpleIndex = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice } = useUnifiedCart();

  const handleCheckout = () => {
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'premier-party-cruises',
      appName: 'Premier Party Cruises - Official Alcohol Delivery Service'
    }));
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigation />
      
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Premier Party Cruises
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Official Alcohol Delivery Service
            </p>
            <div className="mt-8">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                <p className="text-lg font-medium">Premium Alcohol Delivery for Your Austin Party</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Shop Our Collection</h2>
          <p className="text-lg text-muted-foreground">High-quality spirits, wines, and beers delivered directly to your party</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div 
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
            onClick={() => window.location.href = '/search?category=beer'}
          >
            <div className="text-4xl mb-3">🍺</div>
            <h3 className="font-semibold">Beer</h3>
            <p className="text-sm text-muted-foreground">Craft & Premium</p>
          </div>
          
          <div 
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
            onClick={() => window.location.href = '/search?category=wine'}
          >
            <div className="text-4xl mb-3">🍷</div>
            <h3 className="font-semibold">Wine</h3>
            <p className="text-sm text-muted-foreground">Red & White</p>
          </div>
          
          <div 
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
            onClick={() => window.location.href = '/search?category=spirits'}
          >
            <div className="text-4xl mb-3">🥃</div>
            <h3 className="font-semibold">Spirits</h3>
            <p className="text-sm text-muted-foreground">Premium Liquor</p>
          </div>
          
          <div 
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
            onClick={() => window.location.href = '/search?category=mixers'}
          >
            <div className="text-4xl mb-3">🥤</div>
            <h3 className="font-semibold">Mixers</h3>
            <p className="text-sm text-muted-foreground">Sodas & Juices</p>
          </div>
          
          <div 
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
            onClick={() => window.location.href = '/search'}
          >
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-semibold">All Products</h3>
            <p className="text-sm text-muted-foreground">Browse Everything</p>
          </div>
        </div>

        {/* Quick Browse Section */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.location.href = '/search'}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Browse All Products
          </button>
        </div>
      </div>

      {/* Bottom cart bar */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => {}}
        onCheckout={handleCheckout}
        shouldHide={false}
        showAdmin={true}
        currentAppSlug="premier-party-cruises"
      />
    </div>
  );
};

export default SimpleIndex;