import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'datetime' | 'address' | 'payment';

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
    title: 'Date & Contact',
    icon: <User className="w-4 h-4" />,
    description: 'When and who?'
  },
  {
    id: 'address',
    title: 'Address',
    icon: <MapPin className="w-4 h-4" />,
    description: 'Where should we deliver?'
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
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Checkout Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isComplete = isStepComplete(step.id);
            const canClick = status === 'confirmed' || (index === 0 || confirmedSteps.has(steps[index - 1].id));
            
            return (
              <Button
                key={step.id}
                variant={status === 'current' ? 'default' : 'ghost'}
                className={cn(
                  "flex-1 justify-center h-12 relative text-xs",
                  status === 'confirmed' && "bg-green-50 hover:bg-green-100 border-green-200",
                  !canClick && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2",
                    status === 'confirmed' && "bg-green-500 border-green-500 text-white",
                    status === 'current' && "border-primary bg-primary text-white",
                    status === 'pending' && "border-muted-foreground"
                  )}>
                    {status === 'confirmed' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      React.cloneElement(step.icon as React.ReactElement, { className: "w-3 h-3" })
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium text-xs">{step.title}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};