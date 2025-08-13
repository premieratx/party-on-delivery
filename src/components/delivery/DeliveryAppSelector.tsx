import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Store, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config: any;
}

interface DeliveryAppSelectorProps {
  currentAppSlug?: string;
  className?: string;
}

export const DeliveryAppSelector: React.FC<DeliveryAppSelectorProps> = ({
  currentAppSlug,
  className = ""
}) => {
  const [apps, setApps] = useState<DeliveryApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | undefined>(currentAppSlug);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  useEffect(() => {
    setSelectedApp(currentAppSlug);
  }, [currentAppSlug]);

  const loadDeliveryApps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug, logo_url, collections_config')
        .eq('is_active', true)
        .order('app_name');

      if (!error && data) {
        setApps(data);
      }
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (appSlug: string) => {
    setSelectedApp(appSlug);
    navigate(`/app/${appSlug}`);
  };

  const currentApp = apps.find(app => app.app_slug === selectedApp);

  if (loading || apps.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Store className="w-4 h-4 text-muted-foreground" />
      <Select value={selectedApp} onValueChange={handleAppChange}>
        <SelectTrigger className="w-auto min-w-[200px] bg-background/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-2">
            {currentApp?.logo_url && (
              <img
                src={currentApp.logo_url}
                alt={currentApp.app_name}
                className="w-5 h-5 rounded object-cover"
              />
            )}
            <SelectValue placeholder="Select delivery app">
              {currentApp?.app_name}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {apps.map((app) => (
            <SelectItem key={app.id} value={app.app_slug}>
              <div className="flex items-center gap-2 py-1">
                {app.logo_url && (
                  <img
                    src={app.logo_url}
                    alt={app.app_name}
                    className="w-5 h-5 rounded object-cover"
                  />
                )}
                <span>{app.app_name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {app.collections_config?.tab_count || 5} tabs
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};