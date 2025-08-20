import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { Monitor, Smartphone, Tablet, ShoppingCart } from 'lucide-react';

interface DeliveryAppPreviewProps {
  appConfig: {
    app_name: string;
    app_slug: string;
    main_app_config: {
      hero_heading: string;
      hero_subheading: string;
    };
    logo_url?: string;
    collections_config: {
      tab_count: number;
      tabs: Array<{
        name: string;
        collection_handle: string;
        icon?: string;
      }>;
    };
    is_active: boolean;
    is_homepage: boolean;
  };
  device: 'desktop' | 'tablet' | 'mobile';
  className?: string;
}

const DEVICE_CONFIGS = {
  desktop: { width: 1200, height: 800, className: 'w-full max-w-4xl' },
  tablet: { width: 768, height: 1024, className: 'w-[460px] h-[614px] rounded-xl' },
  mobile: { width: 393, height: 852, className: 'w-[320px] h-[600px] rounded-[2rem]' }
};

export const DeliveryAppWorkingPreview: React.FC<DeliveryAppPreviewProps> = ({
  appConfig,
  device,
  className = ''
}) => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { getTotalItems } = useUnifiedCart();
  
  const deviceConfig = DEVICE_CONFIGS[device];
  const totalItems = getTotalItems();

  const handleAddToCart = (item: any) => {
    console.log('Preview: Adding to cart:', item);
    setCartItems(prev => [...prev, item]);
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    console.log('Preview: Updating quantity:', { id, variant, quantity });
    // Mock update for preview
  };

  const handleCheckout = () => {
    console.log('Preview: Proceeding to checkout');
    // Mock checkout for preview
  };

  return (
    <div className={`${deviceConfig.className} mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Preview Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {device === 'desktop' && <Monitor className="w-4 h-4" />}
              {device === 'tablet' && <Tablet className="w-4 h-4" />}
              {device === 'mobile' && <Smartphone className="w-4 h-4" />}
              <span className="text-sm font-medium">{device}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {deviceConfig.width}×{deviceConfig.height}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={appConfig.is_active ? 'default' : 'secondary'}>
              {appConfig.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {appConfig.is_homepage && (
              <Badge variant="outline" className="text-primary">
                Homepage
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Preview URL: /app/{appConfig.app_slug}
        </div>
      </div>

      {/* Working App Preview */}
      <div className="relative h-full bg-background overflow-hidden">
        <ScrollArea className="h-full">
          <ProductCategories
            appName={appConfig.app_name}
            heroHeading={appConfig.main_app_config.hero_heading}
            heroSubheading={appConfig.main_app_config.hero_subheading}
            logoUrl={appConfig.logo_url}
            collectionsConfig={appConfig.collections_config}
            onAddToCart={handleAddToCart}
            cartItemCount={totalItems}
            onOpenCart={() => setShowCart(true)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={handleCheckout}
            showSearch={true}
            maxProducts={20} // Limit for preview performance
          />
        </ScrollArea>

        {/* Cart Preview Indicator */}
        {totalItems > 0 && (
          <div className="absolute bottom-4 right-4">
            <Button 
              size="sm" 
              onClick={() => setShowCart(true)}
              className="gap-2 shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems} items
            </Button>
          </div>
        )}

        {/* Preview Overlay for Mobile */}
        {device === 'mobile' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black/20 rounded-full mt-2"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAppWorkingPreview;