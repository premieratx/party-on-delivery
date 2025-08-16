import React, { useEffect, useState } from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { QuickSync } from '@/components/QuickSync';
import { ManualSync } from '@/components/ManualSync';
import { CoverPageLoader } from '@/components/cover-page/CoverPageLoader';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  console.log('🏠 Index: Component rendering - ManualSync should be visible');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCoverPage, setShowCoverPage] = useState(false);
  const navigate = useNavigate();
  const { cartItems } = useUnifiedCart();
  const [searchParams] = useSearchParams();
  const affiliateCode = searchParams.get('ref');

  useEffect(() => {
    const loadDefaultDeliveryApp = async () => {
      try {
        console.log('🏠 Index: Loading default delivery app config...');
        
        // Get the homepage delivery app or first active app
        const { data: apps, error: appsError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .order('is_homepage', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1);

        if (appsError) {
          console.error('Error fetching delivery apps:', appsError);
          throw appsError;
        }

        if (!apps || apps.length === 0) {
          throw new Error('No delivery apps found - please create one in admin dashboard');
        } 

        // Always use the real delivery app from database
        setAppConfig(apps[0]);
        console.log('🏠 Index: Loaded delivery app:', apps[0].app_name);
        
        // Show cover page for main app after loading
        setShowCoverPage(true);
        
      } catch (err) {
        console.error('Error loading delivery app:', err);
        setError('Failed to load delivery app: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultDeliveryApp();
  }, []);

  const handleCheckout = (items: any[]) => {
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: appConfig?.app_slug || 'party-on-delivery',
      appName: appConfig?.app_name || "Austin's Premier Party Supply Delivery"
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading Main Delivery App</h3>
            <p className="text-muted-foreground">Setting up your party experience...</p>
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
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <QuickSync />
      <ManualSync />
      
      {/* Cover Page Modal */}
      {showCoverPage && (
        <CoverPageLoader
          appSlug="main-delivery-app"
          affiliateCode={affiliateCode}
          onClose={() => setShowCoverPage(false)}
        />
      )}
      
      <ProductCategories
        appName={appConfig?.app_name || "Austin's Premier Party Supply Delivery"}
        heroHeading={appConfig?.main_app_config?.hero_heading || "Austin's Premier Party Supply Delivery"}
        heroSubheading={appConfig?.main_app_config?.hero_subheading || "Satisfaction Guaranteed, On-Time Delivery"}
        heroScrollingText={appConfig?.main_app_config?.hero_scrolling_text || "Let's Get It"}
        logoUrl={appConfig?.logo_url}
        collectionsConfig={appConfig?.collections_config}
        cartItemCount={cartItems.length}
      />
    </>
  );
};

export default Index;