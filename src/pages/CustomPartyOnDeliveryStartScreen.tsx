import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoBackground } from "@/components/common/VideoBackground";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/party-on-delivery-logo.svg';
import customLogo from '/lovable-uploads/d5d7d4eb-b4e8-4a16-bbf6-2e8551550bd4.png';

interface AppConfig {
  app_name: string;
  app_slug: string;
  start_screen_config?: {
    title?: string;
    subtitle?: string;
    logo_url?: string;
  };
}

const CustomPartyOnDeliveryStartScreen = () => {
  const navigate = useNavigate();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('app_name, app_slug, start_screen_config')
          .eq('app_slug', 'party-on-delivery---concierge-')
          .single();

        if (error) {
          console.error('Error loading app config:', error);
          // Use default config if not found
          setAppConfig({
            app_name: 'Party On Delivery & Concierge',
            app_slug: 'party-on-delivery---concierge-',
            start_screen_config: {
              title: 'Party On Delivery & Concierge',
              subtitle: 'Premium party supplies and alcohol delivered to your door'
            }
          });
        } else {
          setAppConfig({
            ...data,
            start_screen_config: data.start_screen_config as { title?: string; subtitle?: string; logo_url?: string } | undefined
          });
        }
      } catch (err) {
        console.error('Error:', err);
        // Use default config on error
        setAppConfig({
          app_name: 'Party On Delivery & Concierge',
          app_slug: 'party-on-delivery---concierge-',
          start_screen_config: {
            title: 'Party On Delivery & Concierge',
            subtitle: 'Premium party supplies and alcohol delivered to your door'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppConfig();
  }, []);

  const handleStartOrder = () => {
    // Store app context for checkout
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'party-on-delivery---concierge-',
      appName: appConfig?.app_name || 'Party On Delivery & Concierge'
    }));
    
    // Navigate to the custom app tabs page
    navigate('/app/party-on-delivery---concierge-/tabs');
  };

  return (
    <VideoBackground>
      {/* Performance Monitor (only shows in debug mode) */}
      <PerformanceMonitor />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <div className="p-8 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={customLogo} 
                alt="Party On Delivery & Concierge"
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {loading ? 'Loading...' : (appConfig?.start_screen_config?.title || appConfig?.app_name || 'Party On Delivery & Concierge')}
              </h1>
              <p className="text-gray-600">
                {loading ? 'Please wait...' : (appConfig?.start_screen_config?.subtitle || 'Premium party supplies and alcohol delivered to your door')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleStartOrder}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300"
              >
                Start New Order
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full h-12"
              >
                Back to Main App
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </VideoBackground>
  );
};

export default CustomPartyOnDeliveryStartScreen;