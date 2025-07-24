import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'datetime' | 'address' | 'customer' | 'payment';

interface StepInfo {
  id: CheckoutStep;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  confirmedSteps: Set<CheckoutStep>;
  onStepClick: (step: CheckoutStep) => void;
  isStepComplete: (step: CheckoutStep) => boolean;
}

const steps: StepInfo[] = [
  {
    id: 'datetime',
    title: 'Date & Time',
    icon: <Calendar className="w-4 h-4" />,
    description: 'When do you want delivery?'
  },
  {
    id: 'address',
    title: 'Address',
    icon: <MapPin className="w-4 h-4" />,
    description: 'Where should we deliver?'
  },
  {
    id: 'customer',
    title: 'Contact Info',
    icon: <User className="w-4 h-4" />,
    description: 'How can we reach you?'
  },
  {
    id: 'payment',
    title: 'Payment',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Complete your order'
  }
];

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({
  currentStep,
  confirmedSteps,
  onStepClick,
  isStepComplete
}) => {
  const getStepStatus = (stepId: CheckoutStep) => {
    if (confirmedSteps.has(stepId)) return 'confirmed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Checkout Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isComplete = isStepComplete(step.id);
            const canClick = status === 'confirmed' || (index === 0 || confirmedSteps.has(steps[index - 1].id));
            
            return (
              <Button
                key={step.id}
                variant={status === 'current' ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start h-auto p-4 relative",
                  status === 'confirmed' && "bg-green-50 hover:bg-green-100 border-green-200",
                  !canClick && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    status === 'confirmed' && "bg-green-500 border-green-500 text-white",
                    status === 'current' && "border-primary bg-primary text-white",
                    status === 'pending' && "border-muted-foreground"
                  )}>
                    {status === 'confirmed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {status === 'confirmed' ? '✓ Complete' : step.description}
                    </div>
                  </div>
                  
                  {isComplete && status !== 'confirmed' && (
                    <div className="text-green-500 text-sm font-medium">
                      Ready to confirm
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};