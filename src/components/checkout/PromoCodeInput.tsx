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
        title: "Invalid Input",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    try {
      console.log('🎫 Validating promo code:', promoCode.trim().toUpperCase());
      console.log('🎫 Cart subtotal for validation:', cartSubtotal);
      
      // Call the actual Supabase validation function
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: {
          code: promoCode.trim().toUpperCase(),
          orderAmount: cartSubtotal
        }
      });

      console.log('🎫 Promo validation response:', { data, error });

      if (error) {
        console.error('🎫 Promo validation error:', error);
        toast({
          title: "Validation Error",
          description: "Unable to validate promo code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.valid) {
        console.log('🎫 Valid promo code detected:', data);
        
        // Convert backend response to frontend format
        const discount = {
          code: data.code,
          type: (data.discount_type === 'fixed_amount' && data.discount_value === 0) || data.is_free_shipping
            ? 'free_shipping' as const
            : data.discount_type === 'percentage' 
              ? 'percentage' as const
              : 'free_shipping' as const,
          value: data.discount_type === 'percentage' ? data.discount_value : 0
        };
        
        console.log('🎫 Converted discount object:', discount);
        
        onDiscountApplied(discount);
        setPromoCode('');
        toast({
          title: "Promo Code Applied!",
          description: data.message || `${discount.code} applied successfully!`
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: data.error || "This promo code is not valid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🎫 Promo code validation failed:', error);
      toast({
        title: "Validation Failed",
        description: "Unable to validate promo code. Please try again later.",
        variant: "destructive",
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validatePromoCode();
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {appliedDiscount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                {appliedDiscount.code}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
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
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Have a promo code?</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                disabled={isValidating}
                className="flex-1 h-8 sm:h-10 text-xs sm:text-sm touch-manipulation select-text"
                autoComplete="off"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                type="text"
              />
              <Button
                onClick={validatePromoCode}
                disabled={isValidating || !promoCode.trim()}
                size="sm"
                className="h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
              >
                {isValidating ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
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