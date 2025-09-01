import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Tag, 
  RefreshCw,
  Settings,
  Check,
  X
} from 'lucide-react';

interface DeliveryFeeRule {
  base_fee: number;
  free_shipping_threshold: number;
  minimum_order: number;
  percentage_rate: number;
  percentage_threshold: number;
  rush_delivery_fee: number;
}

interface PromoCode {
  voucher_code: string;
  voucher_name: string;
  voucher_type: string;
  discount_value: number;
  minimum_spend: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string;
}

export function DeliveryFeeSummary() {
  const [deliveryRules, setDeliveryRules] = useState<DeliveryFeeRule | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load delivery settings
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('setting_key', 'delivery_fees')
        .eq('is_active', true)
        .single();

      if (deliveryError) {
        console.error('Failed to load delivery settings:', deliveryError);
      } else {
        setDeliveryRules(deliveryData?.setting_value as unknown as DeliveryFeeRule);
      }

      // Load active promo codes
      const { data: promoData, error: promoError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (promoError) {
        console.error('Failed to load promo codes:', promoError);
      } else {
        setPromoCodes(promoData || []);
      }

    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (rate: number) => `${(rate * 100).toFixed(0)}%`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Pricing Configuration...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delivery Fee Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Fee Structure
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadData}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveryRules ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Base Fee</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(deliveryRules.base_fee)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Standard delivery charge
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Free Shipping</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(deliveryRules.free_shipping_threshold)}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Orders over this amount
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Percentage Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercent(deliveryRules.percentage_rate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  On orders ${deliveryRules.percentage_threshold}+
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Minimum Order</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(deliveryRules.minimum_order)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Required for delivery
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Rush Delivery</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  +{formatCurrency(deliveryRules.rush_delivery_fee)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Additional rush fee
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No delivery fee configuration found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promo Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Active Promo Codes ({promoCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length > 0 ? (
            <div className="space-y-4">
              {promoCodes.map((promo) => (
                <div key={promo.voucher_code} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {promo.is_active ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.voucher_code}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">{promo.voucher_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {promo.voucher_type === 'percentage' 
                          ? `${promo.discount_value}% off` 
                          : promo.discount_value >= 9999 
                            ? 'Free shipping'
                            : `$${promo.discount_value} off`
                        }
                        {promo.minimum_spend > 0 && ` • Min spend: $${promo.minimum_spend}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {promo.current_uses}/{promo.max_uses} uses
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires: {new Date(promo.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No active promo codes found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Logic Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Delivery Logic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Orders under $200:</strong> ${deliveryRules?.base_fee || 20} flat delivery fee
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <strong>Orders $200-$499:</strong> {formatPercent(deliveryRules?.percentage_rate || 0.1)} of order total
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Orders $500+:</strong> Free delivery
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <strong>Minimum order:</strong> ${deliveryRules?.minimum_order || 50} required for any delivery
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}