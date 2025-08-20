import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PromoCodeInputProps {
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null;
  onDiscountApplied: (discount: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null) => void;
  cartSubtotal: number;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  appliedDiscount,
  onDiscountApplied,
  cartSubtotal
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // Call the validate-voucher edge function
      const { data, error } = await supabase.functions.invoke('validate-voucher', {
        body: {
          voucher_code: promoCode.trim().toUpperCase(),
          cart_subtotal: cartSubtotal
        }
      });

      if (error) {
        console.error('Voucher validation error:', error);
        toast({
          title: "Error",
          description: "Failed to validate promo code. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data.valid) {
        const discount = {
          code: promoCode.trim().toUpperCase(),
          type: data.voucher_type === 'percentage' ? 'percentage' as const : 'free_shipping' as const,
          value: data.discount_amount || data.discount_percentage || 0
        };

        onDiscountApplied(discount);
        setPromoCode('');
        
        toast({
          title: "Promo Code Applied!",
          description: `${discount.code} - ${discount.type === 'percentage' ? discount.value + '% off' : 'Free shipping'}`
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: data.error || "This promo code is not valid or has expired.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast({
        title: "Error",
        description: "Failed to validate promo code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeDiscount = () => {
    onDiscountApplied(null);
    toast({
      title: "Promo Code Removed",
      description: "The discount has been removed from your order."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validatePromoCode();
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {appliedDiscount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <Badge variant="outline" className="text-green-600 border-green-600">
                {appliedDiscount.code}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {appliedDiscount.type === 'percentage' 
                  ? `${appliedDiscount.value}% off` 
                  : 'Free shipping'
                }
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeDiscount}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="w-4 h-4" />
              <span>Have a promo code?</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={isValidating}
                className="flex-1"
              />
              <Button
                onClick={validatePromoCode}
                disabled={isValidating || !promoCode.trim()}
                size="sm"
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};