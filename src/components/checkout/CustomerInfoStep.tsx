import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CheckCircle, Edit2 } from 'lucide-react';
import { CustomerInfo } from '@/hooks/useCustomerInfo';
import { validateEmail, validatePhoneNumber, formatPhoneNumber, getEmailErrorMessage, getPhoneErrorMessage } from '@/utils/validation';

interface CustomerInfoStepProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: (info: CustomerInfo) => void;
  onConfirm: () => void;
  onEdit?: () => void;
  isConfirmed: boolean;
}

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  customerInfo,
  setCustomerInfo,
  onConfirm,
  onEdit,
  isConfirmed
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInfoChange = (field: keyof CustomerInfo, value: string) => {
    let processedValue = value;
    
    // Auto-format phone number
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    const updatedInfo = { ...customerInfo, [field]: processedValue };
    setCustomerInfo(updatedInfo);
    
    // Auto-save to localStorage immediately
    try {
      localStorage.setItem('partyondelivery_customer', JSON.stringify(updatedInfo));
    } catch (error) {
      console.warn('Failed to auto-save customer info:', error);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateCustomerInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!customerInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customerInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!validateEmail(customerInfo.email)) {
      newErrors.email = getEmailErrorMessage(customerInfo.email);
    }
    
    if (!validatePhoneNumber(customerInfo.phone)) {
      newErrors.phone = getPhoneErrorMessage(customerInfo.phone);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateCustomerInfo()) {
      onConfirm();
    }
  };

  const isCustomerComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone;

  if (isConfirmed && isCustomerComplete) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            Contact Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onEdit?.();
            }}
            className="flex items-center gap-2 h-7 sm:h-8 text-xs sm:text-sm"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</div>
            <div className="text-muted-foreground">{customerInfo.email}</div>
            <div className="text-muted-foreground">{customerInfo.phone}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium">First Name</Label>
            <Input
              id="firstName"
              value={customerInfo.firstName}
              onChange={(e) => handleInfoChange('firstName', e.target.value)}
              placeholder="First name"
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium">Last Name</Label>
            <Input
              id="lastName"
              value={customerInfo.lastName}
              onChange={(e) => handleInfoChange('lastName', e.target.value)}
              placeholder="Last name"
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleInfoChange('email', e.target.value)}
            placeholder="your@email.com"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleInfoChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {isCustomerComplete && (
          <Button 
            onClick={handleConfirm} 
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            type="button"
          >
            Confirm Contact Information
          </Button>
        )}
      </CardContent>
    </Card>
  );
};