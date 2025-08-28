import React from 'react';
import { CheckCircle, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepsProps {
  currentStep: 'datetime' | 'address' | 'payment';
  // REMOVED: confirmation states - they caused input lockouts
}

const steps = [
  { id: 'datetime', label: 'Date & Time', icon: Calendar },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'customer', label: 'Contact', icon: User },
  { id: 'payment', label: 'Payment', icon: CreditCard }
];

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({
  currentStep
}) => {
  const getStepStatus = (stepId: string) => {
    // SIMPLIFIED: Just show current step, no lockout states
    if (stepId === 'datetime') return currentStep === 'datetime' ? 'current' : 'pending';
    if (stepId === 'address') return currentStep === 'address' ? 'current' : 'pending';  
    if (stepId === 'customer') return currentStep === 'address' ? 'current' : 'pending';
    if (stepId === 'payment') return currentStep === 'payment' ? 'current' : 'pending';
    return 'pending';
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                status === 'current' && "bg-primary border-primary text-primary-foreground",
                status === 'pending' && "bg-background border-muted-foreground/30 text-muted-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <span className={cn(
                "ml-2 text-sm font-medium",
                status === 'current' && "text-primary",
                status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </span>
              
              {index < steps.length - 1 && (
                <div className="mx-4 w-8 h-0.5 bg-muted-foreground/20 transition-colors" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* UNIVERSAL ACCESS MESSAGE */}
      <div className="mt-3 text-center">
        <p className="text-xs text-green-600 font-medium">✅ All steps remain editable always - no lockouts</p>
      </div>
    </div>
  );
};