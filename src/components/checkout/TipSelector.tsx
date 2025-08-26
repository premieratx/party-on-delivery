import React, { useState } from 'react';
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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const tipPresets = [0, 7, 10, 15, 20];
  const customTip = !tipPresets.includes(tipPercentage);
  const isCustomSelected = customTip || showCustomInput;

  const handleCustomClick = () => {
    setShowCustomInput(true);
    setCustomValue(tipPercentage > 0 && customTip ? tipPercentage.toString() : '');
  };

  const handleCustomConfirm = () => {
    const value = parseFloat(customValue) || 0;
    const clampedValue = Math.max(0, Math.min(50, value));
    onTipChange(clampedValue);
    setShowCustomInput(false);
  };

  const handleCustomCancel = () => {
    setShowCustomInput(false);
    setCustomValue('');
    // Keep current tip percentage unchanged
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base">Driver Tip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {!showCustomInput ? (
          <>
            {/* Tip preset buttons */}
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tipPresets.map((percentage) => (
                <Button
                  key={percentage}
                  variant={tipPercentage === percentage && !isCustomSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTipChange(percentage)}
                  className="text-xs h-7 px-2 sm:text-sm sm:h-9 sm:px-3 flex-1 min-w-0"
                >
                  {percentage === 0 ? 'No Tip' : `${percentage}%`}
                </Button>
              ))}
              <Button
                variant={isCustomSelected ? "default" : "outline"}
                size="sm"
                onClick={handleCustomClick}
                className="text-xs h-7 px-2 sm:text-sm sm:h-9 sm:px-3 flex-1 min-w-0"
              >
                Custom
              </Button>
            </div>
            
            {/* Display current tip amount */}
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Tip Amount: ${(subtotal * (tipPercentage / 100)).toFixed(2)}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Custom tip input with confirm/cancel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Enter tip %"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="flex-1 h-9 text-sm"
                  min="0"
                  max="50"
                  autoFocus
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  ${(subtotal * (parseFloat(customValue) || 0) / 100).toFixed(2)}
                </div>
              </div>
              
              {/* Confirm/Cancel buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomConfirm}
                  size="sm"
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  onClick={handleCustomCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
