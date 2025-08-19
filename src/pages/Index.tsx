import React, { useEffect, useState } from 'react';
import { SimpleDeliveryApp } from '@/components/simple/SimpleDeliveryApp';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const Index = () => {
  console.log('🏠 Index: BULLETPROOF VERSION - Loading Main Delivery App');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('🏠 Index: Loading delivery app config...');
        
        const { data, error: dbError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .eq('is_homepage', true)
          .single();

        if (dbError || !data) {
          console.log('🏠 Index: No homepage app, using fallback...');
          
          const { data: fallback, error: fallbackError } = await supabase
            .from('delivery_app_variations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (fallbackError || !fallback?.length) {
            throw new Error('No delivery apps found');
          }
          
          setAppConfig(fallback[0]);
        } else {
          setAppConfig(data);
        }
        
        console.log('✅ Index: App config loaded successfully');
      } catch (err: any) {
        console.error('❌ Index: Critical error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <h3 className="text-lg font-semibold">Loading Party Supply Store</h3>
          <p className="text-muted-foreground">Getting everything ready...</p>
        </div>
      </div>
    );
  }

  if (error || !appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Failed to Load Store</h3>
          <p className="text-muted-foreground">{error || 'Configuration not found'}</p>
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

  console.log('✅ Index: Rendering SimpleDeliveryApp with config:', appConfig.app_name);

  return (
    <SimpleDeliveryApp
      appName={appConfig.app_name}
      heroHeading={appConfig.main_app_config?.hero_heading || appConfig.app_name}
      heroSubheading={appConfig.main_app_config?.hero_subheading || "Satisfaction Guaranteed, On-Time Delivery"}
      logoUrl={appConfig.logo_url}
      collectionsConfig={appConfig.collections_config}
    />
  );
};

export default Index;