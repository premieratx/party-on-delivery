import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DiscountCodeInput } from './checkout/DiscountCodeInput';

interface DiscountCode {
  code: string;
  title: string;
  value: string;
  value_type: string;
  minimum_order_amount: number | null;
  usage_count: number | null;
  usage_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  once_per_customer: boolean;
  is_recomsale_code: boolean;
}

export const TestDiscountCodes: React.FC = () => {
  const [subtotal, setSubtotal] = useState(50.00);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  } | null>(null);
  const [allCodes, setAllCodes] = useState<DiscountCode[]>([]);
  const [recomSaleCodes, setRecomSaleCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load discount codes automatically on mount
  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Loading existing discount codes...');
      
      const { data, error } = await supabase.rpc('get_active_discount_codes');
      
      if (error) {
        console.error('❌ Failed to load discount codes:', error);
        toast.error('Failed to load discount codes');
        return;
      }

      console.log('✅ Loaded discount codes:', data);
      
      const codes = data || [];
      setAllCodes(codes);
      setRecomSaleCodes(codes.filter((code: DiscountCode) => code.is_recomsale_code));
      
      if (codes.length === 0) {
        toast.info('No discount codes found. Try syncing with Shopify first.');
      } else {
        toast.success(`Found ${codes.length} discount codes (${codes.filter((c: DiscountCode) => c.is_recomsale_code).length} RecomSale codes)`);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading codes:', error);
      toast.error('Failed to load discount codes');
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromShopify = async () => {
    try {
      console.log('🔄 Syncing from Shopify...');
      console.log('🧪 Testing Shopify discount sync...');
      
      const { data, error } = await supabase.functions.invoke('fetch-shopify-discounts', {
        body: { activeOnly: true, includeExpired: false }
      });

      if (error) {
        console.error('❌ Sync failed:', error);
        console.log('❌ Sync test failed:', error);
        toast.error('Failed to sync from Shopify: ' + error.message);
        return;
      }

      console.log('✅ Shopify sync result:', data);
      toast.success('Synced from Shopify successfully!');
      
      // Reload codes after sync
      loadDiscountCodes();
    } catch (error: any) {
      console.error('❌ Unexpected sync error:', error);
      console.log('❌ Sync test failed:', error);
      toast.error('Sync failed: ' + error.message);
    }
  };

  const seedSampleCodes = async () => {
    try {
      console.log('➕ Seeding sample discount codes...');
      const { data, error } = await supabase.functions.invoke('seed-discount-codes', {
        body: {}
      });
      if (error) {
        console.error('❌ Seed failed:', error);
        toast.error('Failed to add sample codes: ' + error.message);
        return;
      }
      console.log('✅ Seed result:', data);
      toast.success(`Added ${data?.count ?? 0} sample codes`);
      await loadDiscountCodes();
    } catch (err: any) {
      console.error('🚨 Unexpected seed error:', err);
      toast.error('Seed failed: ' + err.message);
    }
  };

  const handleDiscountApplied = (discount: {
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  }) => {
    setAppliedDiscount(discount);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
  };

  const finalTotal = subtotal - (appliedDiscount?.amount || 0);

  const formatDiscountValue = (value: string, valueType: string) => {
    if (valueType === 'percentage') {
      return `${value}%`;
    } else {
      return `$${parseFloat(value).toFixed(2)}`;
    }
  };

  const DiscountCodeCard = ({ code }: { code: DiscountCode }) => (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg">{code.code}</h4>
        <div className="flex gap-2">
          {code.is_recomsale_code && (
            <Badge variant="default">RecomSale</Badge>
          )}
          <Badge variant="outline">{formatDiscountValue(code.value, code.value_type)}</Badge>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-2">{code.title}</p>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {code.minimum_order_amount && (
          <div>Min order: ${code.minimum_order_amount}</div>
        )}
        {code.usage_limit && (
          <div>Usage: {code.usage_count || 0}/{code.usage_limit}</div>
        )}
        {code.ends_at && (
          <div>Expires: {new Date(code.ends_at).toLocaleDateString()}</div>
        )}
        {code.once_per_customer && (
          <div>Once per customer</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🎫 Test Shopify Discount Codes Integration</CardTitle>
          <CardDescription>
            Test the RecomSale discount codes integration with your Shopify store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading discount codes...</p>
            </div>
          ) : (
            <>
              {/* RecomSale Codes Section */}
              {recomSaleCodes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">🎯 RecomSale Discount Codes ({recomSaleCodes.length})</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {recomSaleCodes.map((code) => (
                      <DiscountCodeCard key={code.code} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Codes Section */}
              {allCodes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">📋 All Active Discount Codes ({allCodes.length})</h3>
                    <div className="flex gap-2">
                      <Button onClick={syncFromShopify} variant="outline" size="sm">
                        🔄 Sync from Shopify
                      </Button>
                      <Button onClick={seedSampleCodes} variant="secondary" size="sm">
                        ➕ Add sample codes
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allCodes.map((code) => (
                      <DiscountCodeCard key={code.code} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* No codes message */}
              {allCodes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No discount codes found in cache.</p>
                  <div className="flex flex-col items-center gap-2">
                    <Button onClick={syncFromShopify}>
                      📡 Sync Discount Codes from Shopify
                    </Button>
                    <Button onClick={seedSampleCodes} variant="outline">
                      ➕ Add sample discount codes
                    </Button>
                  </div>
                </div>
              )}

              {/* Test Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-2">🧪 Test Discount Code Application</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Try applying any discount code to see how it works in checkout.
                </p>
                
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  {/* Mock Cart Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedDiscount.code}):</span>
                        <span>-${appliedDiscount.amount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Discount Code Input */}
                  <DiscountCodeInput
                    subtotal={subtotal}
                    onDiscountApplied={handleDiscountApplied}
                    onDiscountRemoved={handleDiscountRemoved}
                    appliedDiscount={appliedDiscount}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};