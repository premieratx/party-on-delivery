// FIXED DELIVERY APP MODULE - Build: 2025_08_19_STABLE
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Truck, Search, MapPin, Clock } from 'lucide-react';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  business_name?: string;
  is_active: boolean;
  delivery_areas?: any;
  business_hours?: any;
  collections_config?: any;
  custom_post_checkout_config?: any;
  logo_url?: string;
  is_homepage?: boolean;
  created_at: string;
}

interface DeliveryAppModuleProps {
  onAppSelect?: (app: DeliveryApp) => void;
  selectedAppId?: string;
  showOnlyActive?: boolean;
}

export const DeliveryAppModule: React.FC<DeliveryAppModuleProps> = ({
  onAppSelect,
  selectedAppId,
  showOnlyActive = true
}) => {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadDeliveryApps = React.useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (showOnlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
      toast({ 
        title: 'Error loading delivery apps', 
        description: 'Please try again', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [showOnlyActive, toast]);

  useEffect(() => {
    loadDeliveryApps();
  }, [loadDeliveryApps]);

  const filteredApps = React.useMemo(() => 
    deliveryApps.filter(app =>
      app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.app_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.business_name && app.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [deliveryApps, searchTerm]
  );

  const handleAppClick = React.useCallback((app: DeliveryApp) => {
    onAppSelect?.(app);
  }, [onAppSelect]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Apps Module
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Independent delivery apps that can be integrated into any customer flow
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search delivery apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((app) => (
                <Card 
                  key={app.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAppId === app.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleAppClick(app)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{app.app_name}</h3>
                          <p className="text-sm text-muted-foreground">{app.business_name || 'No business name'}</p>
                        </div>
                        <Badge variant={app.is_active ? 'default' : 'secondary'}>
                          {app.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>/app/{app.app_slug}</span>
                        </div>
                        
                        {app.delivery_areas && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="w-3 h-3" />
                            <span>Delivery Areas: {Array.isArray(app.delivery_areas) ? app.delivery_areas.length : 'Configured'}</span>
                          </div>
                        )}
                        
                        {app.business_hours && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Business Hours Set</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredApps.length === 0 && (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No delivery apps match your search' : 'No delivery apps available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAppId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Delivery App</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const selectedApp = deliveryApps.find(a => a.id === selectedAppId);
              return selectedApp ? (
                <div className="space-y-2">
                  <p className="font-medium">{selectedApp.app_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedApp.business_name || 'No business name'}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">/app/{selectedApp.app_slug}</Badge>
                    <Badge variant={selectedApp.is_active ? 'default' : 'secondary'}>
                      {selectedApp.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">App not found</p>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};