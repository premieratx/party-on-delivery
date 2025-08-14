import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3X3, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config: any;
}

interface CustomDeliveryAppsGridProps {
  onAppSelect: (appSlug: string) => void;
  onBack: () => void;
}

export const CustomDeliveryAppsGrid: React.FC<CustomDeliveryAppsGridProps> = ({
  onAppSelect,
  onBack
}) => {
  const [apps, setApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApps(data);
      }
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Choose Your Delivery App
          </h1>
        </div>

        {/* Apps Grid */}
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
        }`}>
          {apps.map((app) => (
            <Card
              key={app.id}
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
              onClick={() => onAppSelect(app.app_slug)}
            >
              <CardContent className="p-4 text-center">
                {app.logo_url ? (
                  <img
                    src={app.logo_url}
                    alt={app.app_name}
                    className="w-12 h-12 mx-auto mb-3 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-white/20 flex items-center justify-center">
                    <Grid3X3 className="w-6 h-6 text-white" />
                  </div>
                )}
                <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                  {app.app_name}
                </h3>
                <div className="text-white/70 text-xs">
                  {app.collections_config?.tab_count || 5} Categories
                </div>
                <ExternalLink className="w-4 h-4 text-white/50 mx-auto mt-2 group-hover:text-white transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        {apps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">
              No delivery apps available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};