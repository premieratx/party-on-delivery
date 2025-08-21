import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, MapPin, Copy, Mail, MessageSquare, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import { formatInAppTimezone } from '@/utils/timezoneManager';

interface OrderCompleteViewProps {
  order: any;
  deliveryInfo?: any;
  onManageOrder?: () => void;
  onBackToShopping?: () => void;
}

export const OrderCompleteView: React.FC<OrderCompleteViewProps> = ({
  order,
  deliveryInfo,
  onManageOrder,
  onBackToShopping
}) => {
  const { toast } = useToast();

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number || order.id);
    toast({
      title: "Copied!",
      description: "Order number has been copied to your clipboard",
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Order Confirmation - ${order.order_number || order.id}`);
    const body = encodeURIComponent(`Your order ${order.order_number || order.id} has been confirmed!\n\nDelivery Date: ${deliveryInfo?.date || 'TBD'}\nDelivery Time: ${deliveryInfo?.time || 'TBD'}\nTotal: ${formatCurrency(order.total_amount || 0)}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSMSShare = () => {
    const message = encodeURIComponent(`Order ${order.order_number || order.id} confirmed! Delivery: ${deliveryInfo?.date || 'TBD'} at ${deliveryInfo?.time || 'TBD'}. Total: ${formatCurrency(order.total_amount || 0)}`);
    window.open(`sms:?body=${message}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-600">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We'll get everything ready for delivery.
          </p>
        </div>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order #{order.order_number || order.id}</span>
            <Button variant="outline" size="sm" onClick={handleCopyOrderNumber}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delivery Information */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>Delivery: {deliveryInfo?.date || 'TBD'} at {deliveryInfo?.time || 'TBD'}</span>
            </div>
            <div className="flex items-start text-sm">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
              <span>
                {deliveryInfo?.address ? (
                  <>
                    {deliveryInfo.address.street}, {deliveryInfo.address.city}, {deliveryInfo.address.state} {deliveryInfo.address.zipCode}
                  </>
                ) : (
                  'Address to be confirmed'
                )}
              </span>
            </div>
          </div>

          {/* Order Items */}
          {order.line_items && order.line_items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Items Ordered:</h4>
              <div className="space-y-1">
                {order.line_items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.title}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Order Confirmed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {onManageOrder && (
          <Button onClick={onManageOrder} className="w-full">
            <Package className="w-4 h-4 mr-2" />
            Manage My Order
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleEmailShare}>
            <Mail className="w-4 h-4 mr-2" />
            Email Details
          </Button>
          <Button variant="outline" onClick={handleSMSShare}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Text Details
          </Button>
        </div>
        
        {onBackToShopping && (
          <Button variant="outline" onClick={onBackToShopping} className="w-full">
            Continue Shopping
          </Button>
        )}
      </div>
    </div>
  );
};