import React, { useEffect, useState } from 'react';
import { DirectDeliveryApp } from '@/components/delivery/DirectDeliveryApp';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const Index = () => {
  console.log('🏠 HOMEPAGE: Loading default delivery app - NO COMPLEX PROCESSING');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultApp = async () => {
      try {
        console.log('🏠 HOMEPAGE: Fetching default delivery app configuration...');
        
        // Get the homepage delivery app - SIMPLE QUERY
        const { data: homepageApp, error: homepageError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .eq('is_homepage', true)
          .single();

        if (homepageError || !homepageApp) {
          console.log('🏠 HOMEPAGE: No homepage app found, using first active app');
          
          // Fallback to first active app
          const { data: fallbackApp, error: fallbackError } = await supabase
            .from('delivery_app_variations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (fallbackError || !fallbackApp?.length) {
            throw new Error('No active delivery apps found. Please create one in the admin panel.');
          }
          
          setAppConfig(fallbackApp[0]);
          console.log('✅ HOMEPAGE: Using fallback app:', fallbackApp[0].app_name);
        } else {
          setAppConfig(homepageApp);
          console.log('✅ HOMEPAGE: Using homepage app:', homepageApp.app_name);
        }
        
      } catch (err: any) {
        console.error('❌ HOMEPAGE: Fatal error loading app config:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultApp();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading Party Supply Store</h3>
            <p className="text-muted-foreground">Setting up your delivery experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-lg font-semibold text-destructive">Store Configuration Error</h3>
          <p className="text-muted-foreground">{error || 'No store configuration found'}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/admin'} 
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
            >
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - Render the simple delivery app
  console.log('✅ HOMEPAGE: Rendering DirectDeliveryApp with configuration');
  
  return <DirectDeliveryApp appConfig={appConfig} />;
};

export default Index;