import React, { useState, useEffect } from 'react';
import { ChevronDown, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config: any;
  is_homepage?: boolean;
}

export const DeliveryAppDropdown: React.FC = () => {
  const [apps, setApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { appSlug } = useParams();

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug, logo_url, collections_config, is_homepage')
        .eq('is_active', true)
        .order('is_homepage', { ascending: false })
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

  const handleAppChange = (targetAppSlug: string) => {
    const app = apps.find(a => a.app_slug === targetAppSlug);
    if (!app) return;

    if (app.is_homepage) {
      navigate('/');
    } else {
      navigate(`/app/${targetAppSlug}`);
    }
  };

  const getCurrentApp = () => {
    if (!appSlug) {
      return apps.find(app => app.is_homepage) || apps[0];
    }
    return apps.find(app => app.app_slug === appSlug) || apps[0];
  };

  const currentApp = getCurrentApp();

  if (loading || apps.length === 0) {
    return (
      <Button variant="outline" disabled className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <Store className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            {currentApp?.logo_url && (
              <img
                src={currentApp.logo_url}
                alt={currentApp.app_name}
                className="w-5 h-5 rounded object-cover"
              />
            )}
            <span className="max-w-[150px] truncate">
              {currentApp?.app_name || 'Select App'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-background backdrop-blur-sm border border-border/50 z-50">
        {apps.map((app) => (
          <DropdownMenuItem
            key={app.id}
            onClick={() => handleAppChange(app.app_slug)}
            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent/50"
          >
            {app.logo_url && (
              <img
                src={app.logo_url}
                alt={app.app_name}
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{app.app_name}</div>
              <div className="text-xs text-muted-foreground">
                {app.is_homepage ? 'Homepage' : app.app_slug}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {app.collections_config?.tab_count || 5}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};