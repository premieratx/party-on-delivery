import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TipSelectorProps {
  tipPercentage: number;
  subtotal: number;
  onTipChange: (percentage: number) => void;
}

export const TipSelector: React.FC<TipSelectorProps> = ({
  tipPercentage,
  subtotal,
  onTipChange
}) => {
  const tipPresets = [0, 10, 15, 20, 25];
  const customTip = !tipPresets.includes(tipPercentage);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Driver Tip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {tipPresets.map((percentage) => (
            <Button
              key={percentage}
              variant={tipPercentage === percentage ? "default" : "outline"}
              size="sm"
              onClick={() => onTipChange(percentage)}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              {percentage === 0 ? 'No Tip' : `${percentage}%`}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Custom %"
            value={customTip ? tipPercentage : ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onTipChange(Math.max(0, Math.min(50, value))); // Cap at 50%
            }}
            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
            min="0"
            max="50"
          />
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            ${(subtotal * (tipPercentage / 100)).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};