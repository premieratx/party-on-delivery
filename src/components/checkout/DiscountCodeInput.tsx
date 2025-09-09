import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Tag, X } from 'lucide-react';

interface DiscountCodeInputProps {
  subtotal: number;
  onDiscountApplied: (discount: {
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  }) => void;
  onDiscountRemoved: () => void;
  appliedDiscount?: {
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  } | null;
}

export const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  subtotal,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsValidating(true);
    try {
      console.log('🎫 Validating discount code:', discountCode);
      
      // Call our database function to validate the code
      const { data, error } = await supabase.rpc('validate_discount_code', {
        discount_code_param: discountCode.trim(),
        order_subtotal_param: subtotal
      });

      if (error) {
        console.error('❌ Error validating discount code:', error);
        toast.error('Failed to validate discount code');
        return;
      }

      const result = data[0]; // RPC returns array
      console.log('✅ Validation result:', result);

      if (!result.is_valid) {
        toast.error(result.error_message || 'Invalid discount code');
        return;
      }

      // Apply the discount
      const codeDetails = result.code_details as any;
      const discountInfo = {
        code: discountCode.trim(),
        amount: result.discount_amount,
        type: codeDetails?.value_type as 'fixed_amount' | 'percentage' || 'percentage',
        value: codeDetails?.value || '0'
      };

      onDiscountApplied(discountInfo);
      
      // Show success message
      const discountText = codeDetails?.value_type === 'percentage' 
        ? `${codeDetails.value}% off`
        : `$${result.discount_amount} off`;
      
      toast.success(`✅ Discount applied: ${discountText}`, {
        description: codeDetails?.title || discountCode
      });

      // Clear the input
      setDiscountCode('');

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Failed to validate discount code');
    } finally {
      setIsValidating(false);
    }
  };

  const removeDiscount = () => {
    onDiscountRemoved();
    toast.success('Discount code removed');
  };

  // If discount is already applied, show the applied state
  if (appliedDiscount) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{appliedDiscount.code}</p>
              <p className="text-sm text-green-600">
                {appliedDiscount.type === 'percentage' 
                  ? `${appliedDiscount.value}% off` 
                  : `$${appliedDiscount.amount} off`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeDiscount}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter discount code"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && validateDiscountCode()}
          disabled={isValidating}
          className="flex-1"
        />
        <Button 
          onClick={validateDiscountCode}
          disabled={isValidating || !discountCode.trim()}
          variant="outline"
          className="px-6"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Have a discount code? Enter it above to save on your order.
      </p>
    </div>
  );
};