import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataFlowTracking } from '@/hooks/useDataFlowTracking';
import { CheckCircle, AlertTriangle, Package, Clock, DollarSign } from 'lucide-react';

interface PostCheckoutDataFlowProps {
  orderData?: {
    order_id?: string;
    customer_email?: string;
    delivery_date?: string;
    delivery_time?: string;
    subtotal?: number;
    total_amount?: number;
    line_items?: any[];
  };
}

export const PostCheckoutDataFlow: React.FC<PostCheckoutDataFlowProps> = ({ orderData }) => {
  const { flowData, events, trackOrderComplete, getFlowSummary } = useDataFlowTracking();
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  const [flowSummary, setFlowSummary] = useState<any>(null);

  // Track order completion when component mounts with order data
  useEffect(() => {
    if (orderData && !hasTrackedCompletion) {
      trackOrderComplete(orderData);
      setHasTrackedCompletion(true);
    }
  }, [orderData, hasTrackedCompletion, trackOrderComplete]);

  // Update flow summary regularly
  useEffect(() => {
    const updateSummary = () => {
      setFlowSummary(getFlowSummary());
    };

    updateSummary();
    const interval = setInterval(updateSummary, 1000);
    return () => clearInterval(interval);
  }, [getFlowSummary]);

  // Get data from various storage sources
  const getStoredData = () => {
    try {
      return {
        deliveryInfo: JSON.parse(sessionStorage.getItem('delivery.prefill') || '{}'),
        markupPercent: Number(sessionStorage.getItem('pricing.markupPercent') || '0'),
        markupDollar: Number(sessionStorage.getItem('pricing.markupDollar') || '0'),
        freeShipping: sessionStorage.getItem('delivery.freeShipping') === 'true',
        customerInfo: JSON.parse(localStorage.getItem('partyondelivery_customer') || '{}'),
        lastOrder: JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}')
      };
    } catch (error) {
      console.warn('Failed to parse stored data:', error);
      return {};
    }
  };

  const storedData = getStoredData();

  const getDataStatus = (value: any) => {
    if (value === null || value === undefined || value === '') return 'missing';
    if (typeof value === 'string' && value.trim() === '') return 'missing';
    if (typeof value === 'object' && Object.keys(value).length === 0) return 'missing';
    if (Array.isArray(value) && value.length === 0) return 'missing';
    return 'present';
  };

  const renderDataStatus = (label: string, value: any, expectedSource?: string) => {
    const status = getDataStatus(value);
    const isPresent = status === 'present';

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          {isPresent ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          )}
          <div>
            <div className="font-medium text-sm">{label}</div>
            {expectedSource && (
              <div className="text-xs text-muted-foreground">Source: {expectedSource}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge variant={isPresent ? "default" : "outline"} className="text-xs">
            {isPresent ? "✓" : "Missing"}
          </Badge>
          {isPresent && (
            <div className="text-xs text-muted-foreground mt-1 max-w-32 truncate">
              {typeof value === 'object' ? JSON.stringify(value).substring(0, 20) + '...' : String(value)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Data Flow Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {flowData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Flow Information</h4>
                <div className="space-y-1 text-sm">
                  {flowData.coverPageSlug && (
                    <div>Cover Page: <span className="font-mono">{flowData.coverPageSlug}</span></div>
                  )}
                  {flowData.deliveryAppSlug && (
                    <div>Delivery App: <span className="font-mono">{flowData.deliveryAppSlug}</span></div>
                  )}
                  {flowData.affiliateCode && (
                    <div>Affiliate: <span className="font-mono">{flowData.affiliateCode}</span></div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Pricing Data</h4>
                <div className="space-y-1 text-sm">
                  {flowData.markupPercentage && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Markup: {flowData.markupPercentage}%
                    </div>
                  )}
                  {flowData.markupDollarAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Markup: ${flowData.markupDollarAmount}
                    </div>
                  )}
                  {flowData.freeShipping && (
                    <div className="text-green-600">Free Shipping Applied</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {flowSummary && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-4 text-sm">
                <Badge variant={flowSummary.isComplete ? "default" : "outline"} className="bg-green-500 text-white">
                  {flowSummary.isComplete ? "Complete" : "In Progress"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Duration: {Math.round(flowSummary.duration / 1000)}s
                </div>
                <div>Events: {events.length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Data Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Data Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderDataStatus("Order ID", orderData?.order_id, "Order completion")}
          {renderDataStatus("Customer Email", orderData?.customer_email, "Order completion")}
          {renderDataStatus("Delivery Date", orderData?.delivery_date, "Checkout form")}
          {renderDataStatus("Delivery Time", orderData?.delivery_time, "Checkout form")}
          {renderDataStatus("Order Total", orderData?.total_amount, "Cart calculation")}
          {renderDataStatus("Line Items", orderData?.line_items, "Cart data")}
        </CardContent>
      </Card>

      {/* Session Data Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Data Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderDataStatus("Markup Percentage", storedData.markupPercent, "Button click tracking")}
          {renderDataStatus("Markup Dollar Amount", storedData.markupDollar, "Button click tracking")}
          {renderDataStatus("Free Shipping", storedData.freeShipping, "Special action tracking")}
          {renderDataStatus("Prefill Data", storedData.deliveryInfo, "Cover page prefill")}
          {renderDataStatus("Customer Info", storedData.customerInfo, "Checkout form")}
          {renderDataStatus("Last Order", storedData.lastOrder, "Order persistence")}
        </CardContent>
      </Card>

      {/* Affiliate Tracking Status */}
      {flowData?.affiliateCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">
              ✅ Affiliate Tracking Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div>Affiliate Code: <span className="font-mono">{flowData.affiliateCode}</span></div>
              <div>Expected Commission: {
                flowData.markupPercentage ? `${flowData.markupPercentage}%` :
                flowData.markupDollarAmount ? `$${flowData.markupDollarAmount}` :
                'Standard rate'
              }</div>
              {orderData?.subtotal && flowData.markupPercentage && (
                <div>Commission Amount: <span className="font-semibold">
                  ${((orderData.subtotal * flowData.markupPercentage) / 100).toFixed(2)}
                </span></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <details className="text-xs">
            <summary className="cursor-pointer mb-2">View Raw Data</summary>
            <pre className="bg-background p-2 rounded border text-xs overflow-auto max-h-40">
              {JSON.stringify({ flowData, orderData, storedData, events: events.slice(-3) }, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};