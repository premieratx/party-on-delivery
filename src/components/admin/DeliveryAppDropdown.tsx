import React, { useState, useEffect } from 'react';
import { ChevronDown, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryApp {
  id: string;
  name: string;
  handle: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export const DeliveryAppDropdown: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);

  // Default main delivery app
  const mainDeliveryApp = {
    id: 'main',
    name: 'Main Delivery',
    handle: 'main-delivery-app',
    is_active: true,
    is_default: true,
    created_at: new Date().toISOString()
  };

  useEffect(() => {
    fetchDeliveryApps();
  }, []);

  const fetchDeliveryApps = async () => {
    try {
      setLoading(true);
      
      // For now, we'll use predefined delivery apps
      // Later this can be connected to a database table
      const predefinedApps = [
        {
          id: 'boat-delivery',
          name: 'Boat Delivery',
          handle: 'party-on-delivery---concierge-',
          is_active: true,
          is_default: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'airbnb-delivery',
          name: 'Airbnb Concierge',
          handle: 'airbnb-concierge-service',
          is_active: true,
          is_default: false,
          created_at: new Date().toISOString()
        }
      ];

      setDeliveryApps(predefinedApps);
    } catch (error) {
      console.error('Error fetching delivery apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentApp = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/main-delivery-app') {
      return mainDeliveryApp;
    }
    
    // Check for custom delivery apps
    if (currentPath.includes('airbnb-concierge-service')) {
      return deliveryApps.find(app => app.handle === 'airbnb-concierge-service') || mainDeliveryApp;
    }
    
    if (currentPath.includes('party-on-delivery---concierge-')) {
      return deliveryApps.find(app => app.handle === 'party-on-delivery---concierge-') || mainDeliveryApp;
    }
    
    return mainDeliveryApp;
  };

  const currentApp = getCurrentApp();
  const allApps = [mainDeliveryApp, ...deliveryApps];

  const handleAppSelect = (app: DeliveryApp) => {
    if (app.id === 'main') {
      navigate('/main-delivery-app');
    } else {
      // Open custom delivery apps in new window for independent operation
      const baseUrl = window.location.origin;
      let targetUrl = '';
      
      if (app.handle === 'airbnb-concierge-service') {
        targetUrl = `${baseUrl}/app/airbnb-concierge-service/tabs`;
      } else if (app.handle === 'party-on-delivery---concierge-') {
        targetUrl = `${baseUrl}/app/party-on-delivery---concierge-/tabs`;
      } else {
        targetUrl = `${baseUrl}/app/${app.handle}/tabs`;
      }
      
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCreateNew = () => {
    navigate('/admin/delivery-app-manager');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-auto p-2">
          <Package className="h-4 w-4" />
          <span className="font-medium">{currentApp.name}</span>
          {currentApp.is_default && (
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56 bg-popover/95 backdrop-blur-sm border border-border/50">
        <DropdownMenuLabel>Delivery Apps</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allApps.map((app) => (
          <DropdownMenuItem
            key={app.id}
            onClick={() => handleAppSelect(app)}
            className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{app.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {app.is_default && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
              {app.is_active && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleCreateNew}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New App
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};