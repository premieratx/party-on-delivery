import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required = false,
  className,
  disabled = false
}) => {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const inputProps = {
    id: fieldId,
    value,
    onChange: handleChange,
    placeholder,
    disabled,
    className: cn(
      error && "border-destructive focus:border-destructive",
      className
    )
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {type === 'textarea' ? (
        <Textarea {...inputProps} rows={3} />
      ) : (
        <Input {...inputProps} type={type} />
      )}
      
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};