import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, CheckCircle, X, Gift, Calendar, MapPin } from 'lucide-react';
import { storeGroupOrderInfo, formatDeliveryDate } from '@/utils/deliveryInfoManager';

interface GroupOrderJoinFlowProps {
  shareToken: string;
  onJoinConfirmed: () => void;
  onJoinDeclined: () => void;
}

interface GroupOrderData {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: any;
  subtotal: number;
  total_amount: number;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  group_participants?: any;
}

export const GroupOrderJoinFlow: React.FC<GroupOrderJoinFlowProps> = ({
  shareToken,
  onJoinConfirmed,
  onJoinDeclined
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<GroupOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadGroupOrderData();
  }, [shareToken]);

  const loadGroupOrderData = async () => {
    try {
      console.log('🔗 Loading group order data for token:', shareToken);
      
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .eq('share_token', shareToken)
        .maybeSingle();

      if (error) {
        console.error('🔗 Database error:', error);
        throw error;
      }

      if (!data) {
        console.log('🔗 No group order found for token:', shareToken);
        toast({
          title: "Group Order Not Found",
          description: "This group order link is invalid or expired.",
          variant: "destructive",
        });
        onJoinDeclined();
        return;
      }

      console.log('🔗 Group order loaded successfully:', data.order_number);
      setOrderData(data as unknown as GroupOrderData);
    } catch (error) {
      console.error('🔗 Error loading group order:', error);
      toast({
        title: "Error Loading Group Order",
        description: "Could not load the group order details. Please try again.",
        variant: "destructive",
      });
      onJoinDeclined();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!orderData) return;
    
    setIsJoining(true);
    
    try {
      console.log('🔗 User confirmed joining group order');
      
      // Store group order information with single source of truth
      storeGroupOrderInfo(orderData, shareToken);
      
      toast({
        title: "Joining Group Order!",
        description: "You'll get FREE delivery with this group order.",
      });
      
      onJoinConfirmed();
    } catch (error) {
      console.error('🔗 Error joining group order:', error);
      toast({
        title: "Error Joining Group",
        description: "Could not join the group order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeclineGroup = () => {
    console.log('🔗 User declined to join group order');
    
    // Clear any existing group order data
    localStorage.removeItem('groupOrderToken');
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('groupOrderJoinDecision');
    localStorage.removeItem('groupOrderDeliveryInfo');
    localStorage.setItem('groupOrderJoinDecision', 'no');
    
    toast({
      title: "Starting Individual Order",
      description: "You can create your own delivery order.",
    });
    
    onJoinDeclined();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderData) {
    return null; // Error handling is done in loadGroupOrderData
  }

  const totalParticipants = 1 + (Array.isArray(orderData.group_participants) ? orderData.group_participants.length : 0);
  const deliveryDate = formatDeliveryDate(orderData.delivery_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-floating">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl">You're Invited!</CardTitle>
            </div>
            <p className="text-xl font-semibold text-primary">
              Join a Group Delivery Order
            </p>
            <Badge variant="outline" className="mt-2">
              Order #{orderData.order_number}
            </Badge>
            <p className="text-muted-foreground mt-2">
              Started by {orderData.customers?.first_name} {orderData.customers?.last_name}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Details */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 mb-3">
                  Delivery Details:
                </h3>
                <div className="space-y-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{deliveryDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ml-6">{orderData.delivery_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{orderData.delivery_address?.street}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ml-6">
                      {orderData.delivery_address?.city}, {orderData.delivery_address?.state} {orderData.delivery_address?.zipCode}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Benefits of Joining:
                </h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>FREE delivery fee</strong> (normally $9.99)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Delivered together at {orderData.delivery_time}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>{totalParticipants} {totalParticipants === 1 ? 'person' : 'people'} already in this order</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Decision Question */}
            <Card className="text-center">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Would you like to join this group order?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join now to get free delivery and have your items delivered with the group, or create your own individual order.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isJoining ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Yes, Join Group Order
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleDeclineGroup}
                    disabled={isJoining}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    No, Create Individual Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                This is a secure invitation link. Your payment and delivery are completely separate and secure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrderJoinFlow;