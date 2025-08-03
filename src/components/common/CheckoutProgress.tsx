import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';

interface CheckoutStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  className?: string;
}

export const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ 
  steps, 
  className 
}) => {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Processing Order</h3>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : step.status === 'active' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${
                  step.status === 'completed' 
                    ? 'text-green-600' 
                    : step.status === 'active' 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
                <Badge 
                  variant={
                    step.status === 'completed' 
                      ? 'default' 
                      : step.status === 'active' 
                        ? 'secondary' 
                        : 'outline'
                  }
                  className="text-xs"
                >
                  {step.status === 'completed' ? 'Done' : 
                   step.status === 'active' ? 'Processing' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export const useCheckoutProgress = () => {
  const [steps, setSteps] = React.useState<CheckoutStep[]>([
    { id: 'validate', label: 'Validating cart', status: 'pending' },
    { id: 'payment', label: 'Processing payment', status: 'pending' },
    { id: 'order', label: 'Creating order', status: 'pending' }
  ]);

  const updateStep = (stepId: string, status: CheckoutStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
  };

  return { steps, updateStep, resetSteps };
};