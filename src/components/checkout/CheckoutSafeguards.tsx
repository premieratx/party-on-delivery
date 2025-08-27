import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface CheckoutSafeguardsProps {
  onResetCheckout: () => void;
  onClearAllData: () => void;
}

export const CheckoutSafeguards: React.FC<CheckoutSafeguardsProps> = ({
  onResetCheckout,
  onClearAllData
}) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
          <Shield className="w-4 h-4" />
          Checkout Safeguards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-orange-600">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Having trouble editing fields?</p>
              <p className="mt-1">Use these options to restore full editability:</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔄 User resetting checkout flow');
              onResetCheckout();
            }}
            className="w-full text-xs h-8"
          >
            Reset Checkout Flow
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🧹 User clearing all checkout data');
              if (confirm('Clear all saved checkout data? You can re-enter your information.')) {
                onClearAllData();
              }
            }}
            className="w-full text-xs h-8"
          >
            Clear All Saved Data
          </Button>
        </div>
        
        <p className="text-xs text-orange-600">
          ✅ All fields remain editable at all times
        </p>
      </CardContent>
    </Card>
  );
};