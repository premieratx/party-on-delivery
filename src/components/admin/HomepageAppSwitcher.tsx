import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Home, RefreshCw } from 'lucide-react';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  is_homepage: boolean;
  is_active: boolean;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
    }>;
  };
}

export function HomepageAppSwitcher() {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading delivery apps for homepage switcher...');
      
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading delivery apps:', error);
        throw error;
      }

      console.log('✅ Loaded delivery apps:', data?.length || 0);
      
      // Process the data to match our interface
      const processedApps = (data || []).map(app => ({
        id: app.id,
        app_name: app.app_name,
        app_slug: app.app_slug,
        is_homepage: app.is_homepage || false,
        is_active: app.is_active || true,
        collections_config: {
          tab_count: (app.collections_config as any)?.tab_count || 0,
          tabs: (app.collections_config as any)?.tabs || []
        }
      }));
      
      setDeliveryApps(processedApps);
    } catch (error: any) {
      console.error('❌ Error loading delivery apps:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery apps: " + (error.message || error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setHomepageApp = async (appId: string) => {
    try {
      setUpdating(true);
      console.log('🔄 Setting homepage app:', appId);

      // First, clear all homepage flags
      const { error: clearError } = await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: false })
        .neq('id', appId);

      if (clearError) {
        console.error('❌ Error clearing homepage flags:', clearError);
        throw clearError;
      }

      // Set the new homepage app
      const { error: setError } = await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: true })
        .eq('id', appId);

      if (setError) {
        console.error('❌ Error setting homepage app:', setError);
        throw setError;
      }

      console.log('✅ Homepage app updated successfully');
      toast({
        title: "Success!",
        description: "Homepage app has been updated. Refresh the homepage to see changes.",
      });

      // Reload the apps to update the UI
      await loadDeliveryApps();
    } catch (error: any) {
      console.error('❌ Error updating homepage app:', error);
      toast({
        title: "Error",
        description: "Failed to update homepage app: " + (error.message || error),
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const currentHomepageApp = deliveryApps.find(app => app.is_homepage);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Homepage App Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading delivery apps...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Homepage App Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose which delivery app should be displayed on the homepage
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Homepage App */}
        {currentHomepageApp ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-green-800">
                    🏠 {currentHomepageApp.app_name}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    CURRENT HOMEPAGE
                  </Badge>
                </div>
                <p className="text-sm text-green-600">
                  This app is currently displayed on the homepage
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Slug: {currentHomepageApp.app_slug} | Tabs: {currentHomepageApp.collections_config.tab_count}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Live
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 font-medium mb-1">
              ⚠️ No Homepage App Set
            </div>
            <p className="text-sm text-yellow-700">
              No delivery app is currently set as the homepage. Choose one below to fix this.
            </p>
          </div>
        )}

        {/* App Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Set Homepage App
          </label>
          <Select
            onValueChange={setHomepageApp}
            disabled={updating || deliveryApps.length === 0}
            value={currentHomepageApp?.id || ''}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={deliveryApps.length === 0 ? "No apps available" : "Choose homepage app..."} 
              />
            </SelectTrigger>
            <SelectContent>
              {deliveryApps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  <div className="flex items-center gap-2">
                    <span>{app.app_name}</span>
                    {app.is_homepage && (
                      <Badge variant="secondary" className="text-xs">CURRENT</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Apps List */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Available Delivery Apps ({deliveryApps.length})
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {deliveryApps.map((app) => (
              <div 
                key={app.id} 
                className={`p-3 rounded border ${
                  app.is_homepage 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{app.app_name}</span>
                      {app.is_homepage && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          HOMEPAGE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      /{app.app_slug} • {app.collections_config.tab_count} tabs
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!app.is_homepage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHomepageApp(app.id)}
                        disabled={updating}
                      >
                        Set as Homepage
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 How it works:</strong> The homepage app determines which delivery app interface 
            visitors see when they go to your main domain. Choose the app that best represents your 
            default offering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}