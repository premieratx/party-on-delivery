import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';

const CustomAppView = ({ isHomepage = false }: { isHomepage?: boolean }) => {
  const { appSlug } = useParams<{ appSlug: string }>();
  const navigate = useNavigate();
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, updateQuantity, getTotalItems } = useUnifiedCart();
  const { openCart } = useGlobalCart();

  useEffect(() => {
    const loadDeliveryApp = async () => {
      try {
        let targetSlug = appSlug;
        
        // If this is homepage, find the default delivery app
        if (isHomepage) {
          console.log('🏠 Loading homepage - finding default delivery app...');
          const { data: homepageApp, error: homepageError } = await supabase
            .from('delivery_app_variations')
            .select('app_slug')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (homepageError) {
            console.error('Error finding homepage app:', homepageError);
            throw homepageError;
          }
          
          if (homepageApp && homepageApp.length > 0) {
            targetSlug = homepageApp[0].app_slug;
            console.log(`🏠 Using default delivery app: ${targetSlug}`);
          } else {
            throw new Error('No active delivery apps found');
          }
        }

        if (!targetSlug) {
          setError('No app specified');
          setLoading(false);
          return;
        }

        console.log(`🚀 Loading custom delivery app: ${targetSlug}`);
        
        const { data: apps, error: appsError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', targetSlug)
          .eq('is_active', true)
          .limit(1);

        if (appsError) {
          console.error('Error fetching delivery app:', appsError);
          throw appsError;
        }

        if (!apps || apps.length === 0) {
          console.warn(`No delivery app found for slug: ${targetSlug}`);
          setError(`Delivery app "${targetSlug}" not found`);
          setLoading(false);
          return;
        }

        const app = apps[0];
        console.log(`✅ Loaded delivery app: ${app.app_name}`);
        setAppConfig(app);
        
      } catch (err) {
        console.error('Error loading delivery app:', err);
        setError('Failed to load delivery app: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryApp();
  }, [appSlug, isHomepage]);

  const handleCheckout = () => {
    // Enhanced referrer tracking for proper "Back to Cart" functionality
    const currentUrl = isHomepage ? '/' : `/app/${appSlug}`;
    try {
      localStorage.setItem('last-delivery-app-url', currentUrl);
      localStorage.setItem('deliveryAppReferrer', currentUrl);
      localStorage.setItem('app-context', JSON.stringify({
        appSlug: appConfig?.app_slug || appSlug,
        appName: appConfig?.app_name || appSlug
      }));
      console.log('Stored delivery app referrer:', currentUrl);
    } catch (error) {
      console.warn('Failed to store delivery app referrer:', error);
    }
    navigate('/checkout');
  };

  const handleAddToCart = (item: any) => {
    console.log('🛒 Adding to cart from custom app:', item);
    addToCart(item);
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    console.log('🛒 Updating quantity in custom app:', { id, variant, quantity });
    updateQuantity(id, variant, quantity);
  };

  const handleOpenCart = () => {
    console.log('🛒 Opening cart from custom app');
    openCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading {isHomepage ? 'Homepage' : appSlug}</h3>
            <p className="text-muted-foreground">Setting up your custom experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Failed to Load App</h3>
          <p className="text-muted-foreground">{error || 'App configuration not found'}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductCategories
      appName={appConfig.app_name}
      heroHeading={appConfig.main_app_config?.hero_heading || appConfig.app_name}
      heroSubheading={appConfig.main_app_config?.hero_subheading || appConfig.description || "Premium Curated Experience"}
      logoUrl={appConfig.logo_url}
      appConfig={appConfig}
      collectionsConfig={appConfig.collections_config}
      cartItemCount={getTotalItems()}
      cartItems={cartItems}
      onAddToCart={handleAddToCart}
      onUpdateQuantity={handleUpdateQuantity}
      onOpenCart={handleOpenCart}
      onProceedToCheckout={handleCheckout}
      customSiteSlug={appConfig.app_slug}
      maxProducts={50}
      forceRefresh={true}
      onCheckout={handleCheckout}
    />
  );
};

export default CustomAppView;