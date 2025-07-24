import React from 'react';
import { Progress } from '@/components/ui/progress';
import { checkPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/utils/passwordSecurity';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const result = checkPasswordStrength(password);
  const progressValue = (result.score / 4) * 100;
  const strengthLabel = getPasswordStrengthLabel(result.score);
  const strengthColor = getPasswordStrengthColor(result.score);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>
          {strengthLabel}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
      />
      
      {result.feedback.length > 0 && (
        <div className="space-y-1">
          {result.feedback.map((feedback, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3 text-warning" />
              {feedback}
            </div>
          ))}
        </div>
      )}
      
      {result.isValid && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle className="w-3 h-3" />
          Password meets security requirements
        </div>
      )}
    </div>
  );
};