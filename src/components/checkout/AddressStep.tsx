import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { SimpleAddressInput } from '@/components/ui/SimpleAddressInput';
import { useAppConfig } from '@/hooks/useAppConfig';
import { MapPin, CheckCircle, Edit2 } from 'lucide-react';
import { AddressInfo } from '@/hooks/useCustomerInfo';

interface AddressStepProps {
  addressInfo: AddressInfo;
  setAddressInfo: (info: AddressInfo) => void;
  onConfirm: () => void;
  onEdit?: () => void;
  isConfirmed: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  addressInfo,
  setAddressInfo,
  onConfirm,
  onEdit,
  isConfirmed
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { config } = useAppConfig();

  const handleAddressChange = (field: keyof AddressInfo, value: string) => {
    const updatedAddress = { ...addressInfo, [field]: value };
    setAddressInfo(updatedAddress);
    
    // Auto-save to localStorage immediately
    try {
      localStorage.setItem('partyondelivery_address', JSON.stringify(updatedAddress));
    } catch (error) {
      console.warn('Failed to auto-save address info:', error);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    const components = place.address_components || [];
    
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';

    components.forEach((component) => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });

    const fullStreet = `${streetNumber} ${route}`.trim();
    
    const updatedAddress = {
      ...addressInfo,
      street: fullStreet,
      city,
      state,
      zipCode
    };
    
    setAddressInfo(updatedAddress);
    
    // Auto-save to localStorage immediately
    try {
      localStorage.setItem('partyondelivery_address', JSON.stringify(updatedAddress));
    } catch (error) {
      console.warn('Failed to auto-save address info:', error);
    }
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    
    if (!addressInfo.street.trim()) newErrors.street = 'Street address is required';
    if (!addressInfo.city.trim()) newErrors.city = 'City is required';
    if (!addressInfo.state.trim()) newErrors.state = 'State is required';
    if (!addressInfo.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateAddress()) {
      onConfirm();
    }
  };

  const isAddressComplete = addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode;

  // Confirmed (collapsed) view
  if (isConfirmed && isAddressComplete) {
    const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">{fullAddress}</p>
                {addressInfo.instructions && (
                  <p className="text-xs text-muted-foreground">Note: {addressInfo.instructions}</p>
                )}
                <p className="text-xs text-muted-foreground">Delivery address confirmed</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full edit view

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Delivery Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        {/* Address Autocomplete */}
        <div>
          <Label htmlFor="address-autocomplete" className="text-xs sm:text-sm font-medium">Address</Label>
          {config.googleMapsEnabled ? (
            <GooglePlacesAutocomplete
              value={addressInfo.street}
              onChange={(value) => handleAddressChange('street', value)}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Start typing your address..."
              className="w-full h-8 sm:h-10"
            />
          ) : (
            <SimpleAddressInput
              value={addressInfo.street}
              onChange={(value) => handleAddressChange('street', value)}
              placeholder="Enter your street address..."
              className="w-full h-8 sm:h-10"
            />
          )}
          {errors.street && <p className="text-xs text-destructive mt-1">{errors.street}</p>}
        </div>

        {/* Manual Address Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="city" className="text-xs sm:text-sm font-medium">City</Label>
            <Input
              id="city"
              value={addressInfo.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="City"
              className="h-10 text-base touch-manipulation select-text"
              autoComplete="address-level2"
              inputMode="text"
              autoCapitalize="words"
              autoCorrect="on"
            />
            {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="state" className="text-xs sm:text-sm font-medium">State</Label>
            <Input
              id="state"
              value={addressInfo.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="TX"
              maxLength={2}
              className="h-10 text-base touch-manipulation select-text"
              autoComplete="address-level1"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
            />
            {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="zipCode" className="text-xs sm:text-sm font-medium">ZIP Code</Label>
            <Input
              id="zipCode"
              value={addressInfo.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="12345"
              maxLength={10}
              className="h-10 text-base touch-manipulation select-text"
              autoComplete="postal-code"
              inputMode="numeric"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {errors.zipCode && <p className="text-xs text-destructive mt-1">{errors.zipCode}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="instructions" className="text-xs sm:text-sm font-medium">Delivery Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            value={addressInfo.instructions || ''}
            onChange={(e) => handleAddressChange('instructions', e.target.value)}
            placeholder="Any special instructions for delivery..."
            rows={2}
            className="resize-none text-xs sm:text-sm"
          />
        </div>

        {isAddressComplete && (
          <Button 
            onClick={handleConfirm} 
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            type="button"
          >
            Confirm Address
          </Button>
        )}
      </CardContent>
    </Card>
  );
};