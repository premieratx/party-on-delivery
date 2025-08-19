import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PaymentStepFallbackProps {
  total: number;
  onPaymentSuccess: (paymentIntentId?: string) => void;
}

export const PaymentStepFallback: React.FC<PaymentStepFallbackProps> = ({
  total,
  onPaymentSuccess
}) => {
  const handleManualPayment = () => {
    // Simulate successful payment for testing/demo purposes
    const mockPaymentIntentId = `pi_mock_${Date.now()}`;
    onPaymentSuccess(mockPaymentIntentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Payment System Unavailable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 mb-2">
            The payment system is currently not configured or unavailable.
          </p>
          <p className="text-xs text-orange-600">
            This is normal for demo/testing environments. In production, please configure Stripe integration.
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-2">Order Total</h4>
          <div className="text-2xl font-bold">${total.toFixed(2)}</div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleManualPayment}
            className="w-full h-12 text-lg font-semibold"
          >
            Continue with Demo Order
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Note: No actual payment will be processed in demo mode
        </div>
      </CardContent>
    </Card>
  );
};