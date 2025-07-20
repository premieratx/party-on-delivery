import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  const [showTexasWarning, setShowTexasWarning] = React.useState(false);

  useEffect(() => {
    if (!inputRef.current) return;

    // Load Google Maps script if not already loaded
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBGKhZQOUGCqYP0A6QPi7VgTZBIWUf5TsY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    } else {
      initializeAutocomplete();
    }

    function initializeAutocomplete() {
      if (!inputRef.current) return;

      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'address_components', 'geometry']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
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
        }
      });
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, onPlaceSelect]);

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