import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter your address",
  className
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [showTexasWarning, setShowTexasWarning] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Fetch Google Maps API key securely
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        setApiKey(data.apiKey);
      } catch (error) {
        console.error('Failed to fetch Google Maps API key:', error);
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!inputRef.current || !apiKey) return;

    // Load Google Maps script if not already loaded
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Please check your API key.');
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initializeAutocomplete();
    }

    function initializeAutocomplete() {
      if (!inputRef.current || !window.google) return;

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components', 'geometry']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            // Use the full formatted address in the input field
            onChange(place.formatted_address);
            
            // Check if address is in Texas
            const isInTexas = place.address_components?.some(component => 
              component.types.includes('administrative_area_level_1') && 
              (component.short_name === 'TX' || component.long_name === 'Texas')
            );
            
            if (!isInTexas) {
              setShowTexasWarning(true);
            } else {
              setShowTexasWarning(false);
            }
            
            if (onPlaceSelect) {
              onPlaceSelect(place);
            }
            
            // Trigger blur to improve mobile experience
            if (inputRef.current) {
              inputRef.current.blur();
            }
          }
        });
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey, onChange, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // Hide warning when user starts typing manually
    if (showTexasWarning) {
      setShowTexasWarning(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        onFocus={() => {
          // Clear any existing warnings when user focuses
          setShowTexasWarning(false);
        }}
      />
      
      {showTexasWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This address appears to be outside of Texas. Please double-check that this is your correct delivery address. 
            We only deliver within Texas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};