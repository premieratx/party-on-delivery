import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, Users, Package, ExternalLink, RefreshCw } from 'lucide-react';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  is_active: boolean;
  is_homepage: boolean;
  created_at: string;
}

export const DeliveryAppNavigation: React.FC = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState<number>(0);

  useEffect(() => {
    loadApps();
    checkProductCount();
  }, []);

  const loadApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true)
        .order('is_homepage', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProductCount = async () => {
    try {
      const { count } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error checking product count:', error);
    }
  };

  const getAppUrl = (app: DeliveryApp) => {
    if (app.is_homepage) {
      return '/';
    }
    return `/app/${app.app_slug}`;
  };

  const getAppDescription = (appName: string) => {
    const descriptions: Record<string, string> = {
      'Main Delivery App': 'Default homepage experience with full product catalog',
      'Airbnb Concierge Service': 'Premium delivery service for vacation rentals',
      'Premier Party Cruises - Official Alcohol Delivery Service': 'Specialized delivery for cruise events',
      'Let\'s Roll ATX': 'Austin party supply delivery service',
      'Bachelorette': 'Curated selection for bachelorette parties',
      'Chick Trips': 'Perfect for girls\' trip celebrations'
    };
    return descriptions[appName] || 'Specialized delivery experience';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Delivery App Navigation</h2>
        <p className="text-muted-foreground">
          All available delivery apps and navigation options
        </p>
        <div className="flex items-center justify-center gap-2">
          <Package className="h-4 w-4" />
          <span className="text-sm">
            Products in cache: <strong>{productCount}</strong>
          </span>
        </div>
      </div>

      {productCount < 100 && (
        <Alert variant="destructive">
          <Package className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Only {productCount} products in cache. Expected 1000+. 
            Products may not load properly across delivery apps.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Card key={app.id} className={`${app.is_homepage ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{app.app_name}</CardTitle>
                  {app.is_homepage && (
                    <Badge variant="default">Homepage</Badge>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                {getAppDescription(app.app_name)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <code>{getAppUrl(app)}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => window.open(getAppUrl(app), '_blank')}
                className="w-full"
                variant={app.is_homepage ? 'default' : 'outline'}
              >
                {app.is_homepage ? 'View Homepage' : 'Open App'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Additional Navigation Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search & Product Pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => window.open('/product-search', '_blank')}
                variant="outline"
                className="w-full justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                Product Search Page
              </Button>
              <Button 
                onClick={() => window.open('/optimized-search', '_blank')}
                variant="outline"
                className="w-full justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                Optimized Search Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin & Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => navigate('/admin')}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};