import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Users, Calendar, MapPin, Share2 } from 'lucide-react';

interface GroupOrder {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: any;
  line_items: any;
  subtotal: number;
  total_amount: number;
  status: string;
  is_group_order: boolean;
  group_participants: any;
  created_at: string;
  customer_id: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const GroupOrderView = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<GroupOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (shareToken) {
      loadGroupOrder();
    }
    checkCurrentUser();
  }, [shareToken]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadGroupOrder = async () => {
    try {
      const { data: orderData, error } = await supabase
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
        .single();

      if (error) {
        throw error;
      }

      if (!orderData) {
        toast({
          title: "Order Not Found",
          description: "The shared order link is invalid or expired.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error loading group order:', error);
      toast({
        title: "Error",
        description: "Failed to load the group order. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrder = () => {
    // Store detailed group order information
    localStorage.setItem('groupOrderToken', shareToken || '');
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    localStorage.setItem('groupOrderJoinDecision', 'yes');
    
    // Store original order details for exact matching
    const originalOrderData = {
      deliveryDate: order?.delivery_date,
      deliveryTime: order?.delivery_time,
      deliveryAddress: order?.delivery_address,
      customerName: `${order?.customers?.first_name || ''} ${order?.customers?.last_name || ''}`.trim(),
      orderNumber: order?.order_number,
      shareToken: shareToken
    };
    localStorage.setItem('originalGroupOrderData', JSON.stringify(originalOrderData));
    
    // Generate and store group discount code based on original buyer's last name
    if (order?.customers?.last_name) {
      const groupDiscountCode = `GROUP-SHIPPING-${order.customers.last_name.toUpperCase()}`;
      localStorage.setItem('partyondelivery_applied_discount', JSON.stringify({
        code: groupDiscountCode,
        type: 'free_shipping',
        value: 0
      }));
      console.log('Auto-applied group discount:', groupDiscountCode);
    }
    
    // Navigate to checkout directly
    navigate(`/?checkout=true&share=${shareToken}&customer=true`);
  };

  const handleLogin = () => {
    navigate('/customer/login');
  };

  const handleShareOrder = () => {
    const orderUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Join my Party On Delivery order!`,
        text: `Join my group order and save on delivery fees!`,
        url: orderUrl,
      });
    } else {
      navigator.clipboard.writeText(orderUrl);
      toast({
        title: "Link Copied!",
        description: "Order link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This order link is invalid or expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deliveryDate = new Date(order.delivery_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalParticipants = 1 + (order.group_participants?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-floating">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Group Order</CardTitle>
            </div>
            <p className="text-lg font-semibold">#{order.order_number}</p>
            <p className="text-muted-foreground">
              Started by {order.customers?.first_name} {order.customers?.last_name}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Status Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">
                    🎉 {totalParticipants} {totalParticipants === 1 ? 'Person' : 'People'} in this order
                  </h3>
                  <p className="text-green-600">Join now and save on delivery fees!</p>
                </div>
                <Button onClick={handleShareOrder} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Delivery Date & Time</h3>
                  </div>
                  <p>{deliveryDate}</p>
                  <p className="text-muted-foreground">{order.delivery_time}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Delivery Address</h3>
                  </div>
                  <p>{order.delivery_address?.street}</p>
                  <p className="text-muted-foreground">
                    {order.delivery_address?.city}, {order.delivery_address?.state} {order.delivery_address?.zipCode}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Group Participants */}
            {order.group_participants && order.group_participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Group Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <div>
                        <p className="font-medium">{order.customers?.first_name} {order.customers?.last_name}</p>
                        <p className="text-sm text-muted-foreground">Order Creator</p>
                      </div>
                      <p className="font-semibold">$0.00</p>
                    </div>
                    {order.group_participants.map((participant: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(participant.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold">${participant.subtotal?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleJoinOrder}
                size="lg"
                className="flex-1"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add Items to This Order
              </Button>
              
              {!currentUser && (
                <Button 
                  onClick={handleLogin}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Login to Manage Orders
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>By joining this group order, you'll share the delivery fee and get your items delivered together!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrderView;