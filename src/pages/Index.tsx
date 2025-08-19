import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const navigate = useNavigate();
  const { cartItems, getTotalItems } = useUnifiedCart();
  const [searchParams] = useSearchParams();
  const affiliateCode = searchParams.get('ref');

  useEffect(() => {
    const loadDefaultDeliveryApp = async () => {
      try {
        console.log('🏠 Index: Loading homepage delivery app...');
        
        // Get the homepage delivery app
        const { data: homepageApp, error: homepageError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .eq('is_homepage', true)
          .single();

        if (homepageError || !homepageApp) {
          console.log('❌ No homepage app found, falling back to first active app');
          
          const { data: fallbackApps, error: fallbackError } = await supabase
            .from('delivery_app_variations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (fallbackError || !fallbackApps?.length) {
            throw new Error('No delivery apps found');
          }
          
          setAppConfig(fallbackApps[0]);
          console.log('🏠 Index: Using fallback app:', fallbackApps[0].app_name);
        } else {
          setAppConfig(homepageApp);
          console.log('🏠 Index: Loaded homepage app:', homepageApp.app_name);
        }
        
      } catch (err) {
        console.error('❌ Error loading delivery app:', err);
        setError('Failed to load delivery app: ' + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    loadDefaultDeliveryApp();
  }, []);

  const handleCheckout = () => {
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: appConfig?.app_slug || 'main-delivery-app',
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
    console.error('🚨 Index: App configuration error:', error);
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

  // Simple, direct approach - redirect to the delivery app
  window.location.href = `/app/${appConfig.app_slug}`;
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <div>
          <h3 className="text-lg font-semibold">Redirecting to {appConfig.app_name}</h3>
          <p className="text-muted-foreground">Taking you to your party supply store...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;