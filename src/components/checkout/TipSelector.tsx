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
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base">Driver Tip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {/* Mobile: Single compact row */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {tipPresets.map((percentage) => (
            <Button
              key={percentage}
              variant={tipPercentage === percentage ? "default" : "outline"}
              size="sm"
              onClick={() => onTipChange(percentage)}
              className="text-xs h-7 px-2 sm:text-sm sm:h-9 sm:px-3 flex-1 min-w-0"
            >
              {percentage === 0 ? 'No Tip' : `${percentage}%`}
            </Button>
          ))}
        </div>
        
        {/* Custom tip input - more compact on mobile */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Custom %"
            value={customTip ? tipPercentage : ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onTipChange(Math.max(0, Math.min(50, value))); // Cap at 50%
            }}
            className="flex-1 h-7 sm:h-9 text-xs sm:text-sm"
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