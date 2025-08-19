import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { SimpleAddressInput } from '@/components/ui/SimpleAddressInput';
import { useAppConfig } from '@/hooks/useAppConfig';
import { MapPin, CheckCircle } from 'lucide-react';
import { AddressInfo } from '@/hooks/useCustomerInfo';

interface AddressStepProps {
  addressInfo: AddressInfo;
  setAddressInfo: (info: AddressInfo) => void;
  onConfirm: () => void;
  isConfirmed: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  addressInfo,
  setAddressInfo,
  onConfirm,
  isConfirmed
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { config } = useAppConfig();

  const handleAddressChange = (field: keyof AddressInfo, value: string) => {
    setAddressInfo({ ...addressInfo, [field]: value });
    
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
    
    setAddressInfo({
      ...addressInfo,
      street: fullStreet,
      city,
      state,
      zipCode
    });
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

  if (isConfirmed && isAddressComplete) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div>{addressInfo.street}</div>
              <div>{addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</div>
              {addressInfo.instructions && (
                <div className="text-muted-foreground mt-1">
                  Instructions: {addressInfo.instructions}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Autocomplete */}
        <div>
          <Label htmlFor="address-autocomplete">Address</Label>
          {config.googleMapsEnabled ? (
            <GooglePlacesAutocomplete
              value={addressInfo.street}
              onChange={(value) => handleAddressChange('street', value)}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Start typing your address..."
              className="w-full"
            />
          ) : (
            <SimpleAddressInput
              value={addressInfo.street}
              onChange={(value) => handleAddressChange('street', value)}
              placeholder="Enter your street address..."
              className="w-full"
            />
          )}
          {errors.street && <p className="text-sm text-red-500 mt-1">{errors.street}</p>}
        </div>

        {/* Manual Address Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={addressInfo.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="City"
            />
            {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={addressInfo.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="TX"
              maxLength={2}
            />
            {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={addressInfo.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="12345"
              maxLength={10}
            />
            {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            value={addressInfo.instructions || ''}
            onChange={(e) => handleAddressChange('instructions', e.target.value)}
            placeholder="Any special instructions for delivery..."
            rows={2}
          />
        </div>

        {isAddressComplete && (
          <Button onClick={handleConfirm} className="w-full">
            Confirm Address
          </Button>
        )}
      </CardContent>
    </Card>
  );
};