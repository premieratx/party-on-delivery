import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShareIcon, CopyIcon, MessageCircle, Facebook, Instagram, CheckCircle, Clock, Package, MapPin, Calendar, ExternalLink, Copy, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface OrderCompleteViewProps {
  orderNumber: string;
  customerName: string;
  orderItems: any[];
  totalAmount: number;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryAddress?: any;
  shareToken?: string;
  groupOrderName?: string;
  isLoading?: boolean;
  subtotal?: number;
  deliveryFee?: number;
  tipAmount?: number;
  salesTax?: number;
  appliedDiscount?: { code: string; type: string; value: number } | null;
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
  groupOrderName,
  isLoading = false,
  subtotal = 0,
  deliveryFee = 0,
  tipAmount = 0,
  salesTax = 0,
  appliedDiscount = null
}) => {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');

  // Generate share URL when shareToken is available
  useEffect(() => {
    if (shareToken) {
      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/join/${shareToken}`;
      setShareUrl(shareLink);
      console.log('🔗 Generated share link:', shareLink, 'with token:', shareToken);
    }
  }, [shareToken]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Group order link has been copied to your clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Please manually copy the link",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join ${groupOrderName || 'our group order'}!`);
    const body = encodeURIComponent(`Hey! I've started a group order and you're invited to add your items.\n\nJoin here: ${shareUrl}\n\nLet's party! 🎉`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(`Join ${groupOrderName || 'our group order'}! Add your items here: ${shareUrl} 🎉`);
    window.open(`sms:?body=${message}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaInstagram = () => {
    const message = `Join ${groupOrderName || 'our group order'}! Link: ${shareUrl} 🎉`;
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied!",
      description: "Share this message on Instagram to invite friends",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Loading Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">
                We're getting your order details ready...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Success Header */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-primary">Order Complete!</CardTitle>
            <p className="text-muted-foreground">
              Thank you, {customerName}! Your order has been confirmed.
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number:</span>
                <Badge variant="secondary">#{orderNumber}</Badge>
              </div>
              
              {deliveryDate && (
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Delivery Date:
                  </span>
                  <span>
                    {format(
                      toZonedTime(new Date(deliveryDate), 'America/Chicago'), 
                      'EEEE, MMMM do, yyyy'
                    )}
                  </span>
                </div>
              )}
              
              {deliveryTime && (
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Delivery Time:
                  </span>
                  <span>{deliveryTime}</span>
                </div>
              )}
              
              {deliveryAddress && (
                <div className="space-y-2">
                  <span className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address:
                  </span>
                  <p className="text-sm text-muted-foreground pl-6">{deliveryAddress}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Items ({orderItems?.length || 0}):</h4>
                {orderItems && orderItems.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {orderItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{item.name || item.title} × {item.quantity}</span>
                        <span>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <LoadingSpinner text="Loading order items..." />
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Order Total Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal ({orderItems?.length || 0} items):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount ({appliedDiscount.code}):</span>
                    <span>-${appliedDiscount.value.toFixed(2)}</span>
                  </div>
                )}
                
                {deliveryFee > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Delivery Fee:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                
                {tipAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Driver Tip:</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {salesTax > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Sales Tax:</span>
                    <span>${salesTax.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Order Sharing */}
          {shareToken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Share Group Order
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Invite friends to add their items to {groupOrderName || 'your order'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Share this link:</p>
                  <p className="text-sm font-mono break-all">{shareUrl}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={copyShareLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareViaEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareViaSMS}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareViaFacebook}>
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={shareViaInstagram}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Copy for Instagram
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => {
                // Check if this was a group order join
                const groupOrderJoinDecision = localStorage.getItem('groupOrderJoinDecision');
                const originalGroupOrderData = localStorage.getItem('originalGroupOrderData');
                
                if (groupOrderJoinDecision === 'yes' && originalGroupOrderData) {
                  // Route to group order dashboard
                  try {
                    const groupData = JSON.parse(originalGroupOrderData);
                    if (groupData.shareToken) {
                      // Clear localStorage after successful routing
                      localStorage.removeItem('groupOrderJoinDecision');
                      localStorage.removeItem('originalGroupOrderData');
                      window.location.href = `/order/${groupData.shareToken}`;
                      return;
                    }
                  } catch (error) {
                    console.error('Error parsing group order data:', error);
                  }
                }
                
                // Default to individual customer dashboard
                window.location.href = '/customer/login';
              }}
              variant="outline"
            >
              Manage Order
            </Button>
            
            {shareToken && (
              <>
                <Button 
                  onClick={copyShareLink}
                  className="bg-primary hover:bg-primary/90"
                >
                  Share Group Order Link
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  Friends can use this link to add items to your delivery and split costs!
                </p>
              </>
            )}
          </div>
          
          {/* Support Contact Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-sm text-blue-800 font-medium">
                Notice something wrong with your order?
              </p>
              <p className="text-xs text-blue-600 mt-1">
                We're here to help! Contact us immediately if any details look incorrect.
              </p>
            </div>
            
            <Button 
              onClick={() => {
                const subject = encodeURIComponent('My Order Details Are Wrong');
                const body = encodeURIComponent(
                  `Hi Party on Delivery Team,\n\n` +
                  `I just placed order #${orderNumber} and noticed something incorrect with my order details.\n\n` +
                  `Please help me resolve this issue.\n\n` +
                  `Customer: ${customerName}\n` +
                  `Order Total: $${totalAmount.toFixed(2)}\n` +
                  `Delivery Date: ${deliveryDate || 'Not set'}\n` +
                  `Delivery Time: ${deliveryTime || 'Not set'}\n\n` +
                  `Issue Description:\n` +
                  `[Please describe what looks wrong]\n\n` +
                  `Thank you!`
                );
                window.location.href = `mailto:info@partyondelivery.com?subject=${subject}&body=${body}`;
              }}
              variant="outline"
              size="sm"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              📧 Email Support About Order Issues
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};