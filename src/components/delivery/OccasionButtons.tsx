import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  // Don't show when scrolled down on mobile
  if (isScrollingDown) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="h-16 flex flex-col justify-center text-sm font-bold text-black leading-tight hidden sm:block px-2">
        <div className="text-lg">What's the</div>
        <div className="text-lg">Occasion?</div>
      </div>
      
      {/* Occasion buttons - dynamic based on delivery apps */}
      <div className="flex flex-col gap-2 flex-1 max-w-2xl">
        {isMobile ? (
          <>
            {/* Mobile: Two rows of compact buttons */}
            <div className="flex gap-1">
              {deliveryApps.slice(0, 4).map((app) => (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-2 h-10 flex flex-col items-center justify-center gap-0 flex-1"
                  onClick={() => handleOccasionClick(app.app_slug)}
                >
                  <div className="text-xs">{getIcon(app.app_name)}</div>
                  <div className="text-[8px] leading-none">{getShortName(app.app_name)}</div>
                </Button>
              ))}
            </div>
            {deliveryApps.length > 4 && (
              <div className="flex gap-1">
                {deliveryApps.slice(4, 8).map((app) => (
                  <Button
                    key={app.id}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-2 h-10 flex flex-col items-center justify-center gap-0 flex-1"
                    onClick={() => handleOccasionClick(app.app_slug)}
                  >
                    <div className="text-xs">{getIcon(app.app_name)}</div>
                    <div className="text-[8px] leading-none">{getShortName(app.app_name)}</div>
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Desktop: Two rows of larger buttons */}
            <div className="flex gap-3">
              {deliveryApps.slice(0, 4).map((app) => (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  className="text-xs px-4 py-2 h-10 font-bold text-black flex-1 min-w-0"
                  onClick={() => handleOccasionClick(app.app_slug)}
                >
                  {getIcon(app.app_name)} {app.app_name}
                </Button>
              ))}
            </div>
            
            {deliveryApps.length > 4 && (
              <div className="flex gap-3">
                {deliveryApps.slice(4, 8).map((app) => (
                  <Button
                    key={app.id}
                    variant="outline"
                    size="sm"
                    className="text-xs px-4 py-2 h-10 font-bold text-black flex-1 min-w-0"
                    onClick={() => handleOccasionClick(app.app_slug)}
                  >
                    {getIcon(app.app_name)} {app.app_name}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};