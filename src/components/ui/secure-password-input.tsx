import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import { checkPasswordStrength } from '@/utils/passwordSecurity';

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter password",
  showStrengthIndicator = true,
  onValidationChange,
  className = '',
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    onChange(newPassword);
    
    if (onValidationChange) {
      const result = checkPasswordStrength(newPassword);
      onValidationChange(result.isValid);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`pr-10 ${className}`}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      
      {showStrengthIndicator && (
        <PasswordStrengthIndicator password={value} />
      )}
    </div>
  );
};