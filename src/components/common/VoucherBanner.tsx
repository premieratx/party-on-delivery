import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Gift, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface VoucherBannerProps {
  voucher: {
    voucher_code: string;
    voucher_name: string;
    voucher_type: string;
    discount_value?: number;
    prepaid_amount?: number;
    minimum_spend: number;
    expires_at?: string;
    remaining_balance?: number;
  };
  onDismiss?: () => void;
}

export default function VoucherBanner({ voucher, onDismiss }: VoucherBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!voucher.expires_at) return;

    const checkExpiration = () => {
      const now = new Date();
      const expirationDate = new Date(voucher.expires_at!);
      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Show countdown if within 14 days
      if (daysDiff <= 14 && daysDiff > 0) {
        setShowCountdown(true);
        
        const days = Math.floor(timeDiff / (1000 * 3600 * 24));
        const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
        const minutes = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setShowCountdown(false);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [voucher.expires_at]);

  const getVoucherValue = () => {
    switch (voucher.voucher_type) {
      case 'percentage':
        return `${voucher.discount_value}% off`;
      case 'fixed_amount':
        return `${formatCurrency(voucher.discount_value || 0)} off`;
      case 'prepaid_credit':
        return `${formatCurrency(voucher.remaining_balance || voucher.prepaid_amount || 0)} left`;
      default:
        return '';
    }
  };

  const getBannerColor = () => {
    switch (voucher.voucher_type) {
      case 'percentage':
        return 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200';
      case 'fixed_amount':
        return 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200';
      case 'prepaid_credit':
        return 'bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200';
      default:
        return 'bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20';
    }
  };

  return (
    <Card className={`fixed top-4 right-4 z-50 w-80 p-4 shadow-lg ${getBannerColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{voucher.voucher_name}</h4>
              <Badge variant="secondary" className="text-xs">
                {voucher.voucher_code}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium text-primary">{getVoucherValue()}</span>
              </div>
              
              {voucher.minimum_spend > 0 && (
                <div className="text-xs text-muted-foreground">
                  Min. spend: {formatCurrency(voucher.minimum_spend)}
                </div>
              )}
              
              {showCountdown && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>Expires in {timeLeft}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-background/50"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}