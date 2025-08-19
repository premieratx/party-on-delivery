import React from 'react';
import { Input } from '@/components/ui/input';

interface SimpleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleAddressInput: React.FC<SimpleAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your address",
  className
}) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};