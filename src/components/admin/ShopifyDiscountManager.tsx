import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Tag, Calendar, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface DiscountCode {
  code: string;
  title: string;
  value: string;
  value_type: 'fixed_amount' | 'percentage';
  usage_count: number;
  usage_limit?: number;
  minimum_order_amount?: number;
  starts_at?: string;
  ends_at?: string;
  once_per_customer: boolean;
  is_recomsale_code: boolean;
}

export const ShopifyDiscountManager: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [recomSaleCodes, setRecomSaleCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchDiscountCodes = async () => {
    setIsLoading(true);
    try {
      console.log('🎫 Fetching Shopify discount codes...');
      
      // Call the edge function to fetch and cache discount codes
      const { data, error } = await supabase.functions.invoke('fetch-shopify-discounts', {
        body: {
          activeOnly: true,
          includeExpired: false
        }
      });

      if (error) {
        console.error('❌ Error fetching discount codes:', error);
        toast.error('Failed to fetch discount codes from Shopify');
        return;
      }

      console.log('✅ Fetched discount codes:', data);
      
      if (data.success) {
        setDiscountCodes(data.discount_codes || []);
        setRecomSaleCodes(data.recomsale_discount_codes || []);
        setLastFetched(new Date().toISOString());
        
        toast.success(`📥 Fetched ${data.total_codes} discount codes`, {
          description: `${data.recomsale_codes} RecomSale codes found`
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Failed to fetch discount codes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedCodes = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_discount_codes', {
        recomsale_only: false
      });

      if (error) {
        console.error('Error loading cached codes:', error);
        return;
      }

      const allCodes = (data || []).map((code: any) => ({
        ...code,
        value_type: code.value_type as 'fixed_amount' | 'percentage'
      })) as DiscountCode[];
      
      const recomSaleOnly = allCodes.filter((code: DiscountCode) => code.is_recomsale_code);
      
      setDiscountCodes(allCodes);
      setRecomSaleCodes(recomSaleOnly);
    } catch (error) {
      console.error('Error loading cached codes:', error);
    }
  };

  useEffect(() => {
    loadCachedCodes();
  }, []);

  const formatDiscountValue = (value: string, valueType: 'fixed_amount' | 'percentage') => {
    if (valueType === 'percentage') {
      return `${value}% OFF`;
    } else {
      return `$${value} OFF`;
    }
  };

  const isExpiringSoon = (endsAt?: string) => {
    if (!endsAt) return false;
    const endDate = new Date(endsAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return endDate <= sevenDaysFromNow;
  };

  const DiscountCodeCard = ({ code }: { code: DiscountCode }) => (
    <Card key={code.code} className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
            {code.title && (
              <CardDescription className="mt-1">{code.title}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={code.is_recomsale_code ? "default" : "secondary"}>
              {formatDiscountValue(code.value, code.value_type)}
            </Badge>
            {code.is_recomsale_code && (
              <Badge variant="outline" className="text-xs">RecomSale</Badge>
            )}
            {code.ends_at && isExpiringSoon(code.ends_at) && (
              <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          {code.minimum_order_amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              <span>Min order: ${code.minimum_order_amount}</span>
            </div>
          )}
          
          {code.usage_limit && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Usage: {code.usage_count}/{code.usage_limit}</span>
            </div>
          )}
          
          {code.ends_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Expires: {format(new Date(code.ends_at), 'MMM dd, yyyy')}</span>
            </div>
          )}
          
          {code.once_per_customer && (
            <Badge variant="outline" className="text-xs">
              One per customer
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shopify Discount Codes</h2>
          <p className="text-muted-foreground">
            Manage discount codes from your Shopify store and RecomSale app
          </p>
        </div>
        
        <Button 
          onClick={fetchDiscountCodes}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync from Shopify'}
        </Button>
      </div>

      {lastFetched && (
        <p className="text-sm text-muted-foreground">
          Last synced: {format(new Date(lastFetched), 'PPpp')}
        </p>
      )}

      {/* RecomSale Codes Section */}
      {recomSaleCodes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5" />
            <h3 className="text-lg font-semibold">RecomSale Discount Codes</h3>
            <Badge>{recomSaleCodes.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recomSaleCodes.map((code) => (
              <DiscountCodeCard key={code.code} code={code} />
            ))}
          </div>
        </div>
      )}

      {/* All Codes Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5" />
          <h3 className="text-lg font-semibold">All Active Discount Codes</h3>
          <Badge>{discountCodes.length}</Badge>
        </div>
        
        {discountCodes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No discount codes found</h3>
              <p className="text-muted-foreground mb-4">
                Click "Sync from Shopify" to fetch discount codes from your store.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discountCodes.map((code) => (
              <DiscountCodeCard key={code.code} code={code} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};