import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CheckCircle } from 'lucide-react';
import { CustomerInfo } from '@/hooks/useCustomerInfo';
import { validateEmail, validatePhoneNumber, formatPhoneNumber, getEmailErrorMessage, getPhoneErrorMessage } from '@/utils/validation';

interface CustomerInfoStepProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: (info: CustomerInfo) => void;
  onConfirm: () => void;
  isConfirmed: boolean;
}

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  customerInfo,
  setCustomerInfo,
  onConfirm,
  isConfirmed
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInfoChange = (field: keyof CustomerInfo, value: string) => {
    let processedValue = value;
    
    // Auto-format phone number
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setCustomerInfo({ ...customerInfo, [field]: processedValue });
    
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div>{customerInfo.firstName} {customerInfo.lastName}</div>
            <div>{customerInfo.email}</div>
            <div>{customerInfo.phone}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={customerInfo.firstName}
              onChange={(e) => handleInfoChange('firstName', e.target.value)}
              placeholder="First name"
            />
            {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={customerInfo.lastName}
              onChange={(e) => handleInfoChange('lastName', e.target.value)}
              placeholder="Last name"
            />
            {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleInfoChange('email', e.target.value)}
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleInfoChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {isCustomerComplete && (
          <Button onClick={handleConfirm} className="w-full">
            Confirm Contact Information
          </Button>
        )}
      </CardContent>
    </Card>
  );
};