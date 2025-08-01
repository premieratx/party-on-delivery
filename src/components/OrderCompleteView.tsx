import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareIcon, CopyIcon, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OrderCompleteViewProps {
  orderNumber: string;
  customerName: string;
  orderItems: any[];
  totalAmount: number;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: any;
  shareToken: string;
  groupOrderName?: string;
}

export const OrderCompleteView: React.FC<OrderCompleteViewProps> = ({
  orderNumber,
  customerName,
  orderItems,
  totalAmount,
  deliveryDate,
  deliveryTime,
  deliveryAddress,
  shareToken,
  groupOrderName
}) => {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const url = `${window.location.origin}/shared-order/${shareToken}`;
    setShareUrl(url);
  }, [shareToken]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Group order link copied to clipboard",
    });
  };

  const shareViaEmail = () => {
    const subject = `Join my ${groupOrderName || 'Party On Delivery'} group order!`;
    const body = `Hey! I just placed an order for delivery on ${format(new Date(deliveryDate), 'EEEE, MMMM do')} at ${deliveryTime}.\n\nJoin my group order and get FREE DELIVERY! Your items will be delivered with mine to ${deliveryAddress.street}, ${deliveryAddress.city}.\n\nClick here to add your items: ${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSMS = () => {
    const message = `Join my ${groupOrderName || 'Party On Delivery'} group order for FREE DELIVERY! Delivering ${format(new Date(deliveryDate), 'M/d')} at ${deliveryTime}. Add your items: ${shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaInstagram = () => {
    // Instagram doesn't support direct link sharing, so copy to clipboard for user to paste
    navigator.clipboard.writeText(`Join my ${groupOrderName || 'Party On Delivery'} group order! ${shareUrl}`);
    toast({
      title: "Text Copied!",
      description: "Share this text on Instagram Stories",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-white shadow-floating">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-800">
              Your Order is Complete!
            </CardTitle>
            <CardDescription className="text-green-600">
              Order #{orderNumber} has been successfully processed
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-800">Delivery Details</p>
              <p className="text-sm text-blue-600">
                {format(new Date(deliveryDate), 'EEEE, MMMM do, yyyy')} at {deliveryTime}
              </p>
              <p className="text-sm text-blue-600">
                {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Group Order */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShareIcon className="h-5 w-5" />
              Share Your Group Order
            </CardTitle>
            <CardDescription>
              Invite friends to add items and split delivery costs!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-sm font-medium mb-2">Group Order Name:</p>
              <p className="text-lg font-semibold text-primary">
                {groupOrderName || `${customerName}'s Party Order`}
              </p>
            </div>

            {/* Copy Link Button */}
            <Button onClick={copyShareLink} className="w-full" size="lg">
              <CopyIcon className="h-4 w-4 mr-2" />
              Copy Group Order Link
            </Button>

            {/* Share Buttons Row */}
            <div className="grid grid-cols-4 gap-2">
              <Button 
                onClick={shareViaEmail} 
                variant="outline" 
                size="sm"
                className="flex flex-col items-center p-3 h-auto"
              >
                <svg className="h-5 w-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-xs">Email</span>
              </Button>

              <Button 
                onClick={shareViaSMS} 
                variant="outline" 
                size="sm"
                className="flex flex-col items-center p-3 h-auto"
              >
                <MessageCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">SMS</span>
              </Button>

              <Button 
                onClick={shareViaFacebook} 
                variant="outline" 
                size="sm"
                className="flex flex-col items-center p-3 h-auto"
              >
                <Facebook className="h-5 w-5 mb-1" />
                <span className="text-xs">Facebook</span>
              </Button>

              <Button 
                onClick={shareViaInstagram} 
                variant="outline" 
                size="sm"
                className="flex flex-col items-center p-3 h-auto"
              >
                <Instagram className="h-5 w-5 mb-1" />
                <span className="text-xs">Instagram</span>
              </Button>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Friends get FREE DELIVERY when they join!
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Button */}
        <Card>
          <CardContent className="p-6 text-center">
            <Button 
              onClick={() => window.location.href = '/customer/dashboard'}
              variant="outline" 
              size="lg"
              className="w-full"
            >
              View My Orders Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};