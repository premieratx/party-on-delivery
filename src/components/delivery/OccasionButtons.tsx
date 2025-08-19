import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  is_active: boolean;
}

interface OccasionButtonsProps {
  isMobile: boolean;
  isScrollingDown: boolean;
}

export const OccasionButtons: React.FC<OccasionButtonsProps> = ({ isMobile, isScrollingDown }) => {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug, logo_url, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8); // Limit to 8 apps for display

      if (!error && data) {
        setDeliveryApps(data);
      }
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOccasionClick = (appSlug: string) => {
    console.log(`🎉 OccasionButtons: Navigating to delivery app: ${appSlug}`);
    console.log(`🔄 Current URL will change to: /app/${appSlug}`);
    // Use the correct route format 
    navigate(`/app/${appSlug}`);
  };

  const getIcon = (appName: string) => {
    const name = appName.toLowerCase();
    if (name.includes('boat')) return '🛥️';
    if (name.includes('lake') || name.includes('water')) return '🌊';
    if (name.includes('wedding')) return '💒';
    if (name.includes('birthday')) return '🎂';
    if (name.includes('graduation')) return '🎓';
    if (name.includes('corporate')) return '🏢';
    if (name.includes('bbq') || name.includes('barbecue')) return '🔥';
    if (name.includes('beach')) return '🏖️';
    if (name.includes('pool')) return '🏊';
    if (name.includes('airbnb')) return '🏠';
    return '🎉'; // Default party icon
  };

  const getShortName = (appName: string) => {
    // Shorten long names for mobile display
    if (appName.length > 12) {
      const words = appName.split(' ');
      if (words.length > 1) {
        return words[0]; // Take first word
      }
      return appName.substring(0, 8) + '...'; // Truncate if single long word
    }
    return appName;
  };

  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">What's the Occasion?</h3>
        <p className="text-sm text-muted-foreground">Choose your perfect party delivery experience</p>
      </div>
      
      {/* Mobile: Dropdown Selector */}
      {isMobile ? (
        <div className="w-full">
          <Select onValueChange={(value) => handleOccasionClick(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose your event..." />
            </SelectTrigger>
            <SelectContent>
              {deliveryApps.map((app) => (
                <SelectItem key={app.id} value={app.app_slug}>
                  <div className="flex items-center gap-2">
                    <span>{getIcon(app.app_name)}</span>
                    <span>{app.app_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        /* Desktop: Button Grid */
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {deliveryApps.slice(0, 4).map((app) => (
              <Button
                key={app.id}
                variant="outline"
                size="sm"
                className="text-sm px-4 py-3 h-auto font-medium text-foreground flex-1 min-w-0"
                onClick={() => handleOccasionClick(app.app_slug)}
              >
                <div className="flex items-center gap-2">
                  <span>{getIcon(app.app_name)}</span>
                  <span>{app.app_name}</span>
                </div>
              </Button>
            ))}
          </div>
          
          {deliveryApps.length > 4 && (
            <div className="grid grid-cols-2 gap-3">
              {deliveryApps.slice(4, 8).map((app) => (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  className="text-sm px-4 py-3 h-auto font-medium text-foreground flex-1 min-w-0"
                  onClick={() => handleOccasionClick(app.app_slug)}
                >
                  <div className="flex items-center gap-2">
                    <span>{getIcon(app.app_name)}</span>
                    <span>{app.app_name}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};