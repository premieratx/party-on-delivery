import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Users, Calendar, MapPin, Package, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { formatDeliveryDate } from '@/utils/deliveryInfoManager';

interface GroupOrderParticipant {
  email: string;
  name: string;
  subtotal: number;
  items: any[];
  joined_at: string;
}

interface GroupOrderDetails {
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
  share_token: string;
  created_at: string;
  customer_id: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const GroupOrderDashboard = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groupOrder, setGroupOrder] = useState<GroupOrderDetails | null>(null);
  const [allGroupOrders, setAllGroupOrders] = useState<GroupOrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (shareToken) {
      loadGroupOrderData();
    }
    checkCurrentUser();
  }, [shareToken]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadGroupOrderData = async () => {
    try {
      // Skip loading if shareToken is not a valid UUID format
      if (!shareToken || shareToken === 'continuation' || shareToken.length < 30) {
        console.log('Invalid share token, skipping group order load:', shareToken);
        return;
      }

      // Load the main group order
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
          title: "Group Order Not Found",
          description: "The group order link is invalid or expired.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setGroupOrder(orderData as any);

      // Load all orders with the same share_token (entire group)
      const { data: allOrders, error: allOrdersError } = await supabase
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
        .order('created_at', { ascending: false });

      if (allOrdersError) {
        console.error('Error loading all group orders:', allOrdersError);
      } else {
        setAllGroupOrders((allOrders || []) as any[]);
      }

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

  const handleShareOrder = () => {
    // Create a proper group order join URL that ensures free shipping and proper flow
    const shareUrl = `${window.location.origin}/?share=${shareToken}&customer=true&checkout=true`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join my Party On Delivery group order - FREE SHIPPING!`,
        text: `Join my group delivery order for ${groupOrder?.delivery_date} at ${groupOrder?.delivery_time}. Get FREE SHIPPING when you add to our order!`,
        url: shareUrl,
      }).then(() => {
        console.log('✅ Group order link shared successfully');
      }).catch((error) => {
        console.log('Share dialog was dismissed or failed:', error);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Group Order Link Copied! 🎉",
        description: "Share this link with friends to join your group order and get FREE SHIPPING!",
      });
      console.log('✅ Group order link copied to clipboard');
    }
  };

  const handleAddMoreItems = () => {
    localStorage.setItem('groupOrderToken', shareToken || '');
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    navigate(`/?checkout=true&share=${shareToken}&customer=true`);
  };

  const getTotalGroupValue = () => {
    return allGroupOrders.reduce((total, order) => total + order.total_amount, 0);
  };

  const getTotalParticipants = () => {
    const uniqueEmails = new Set();
    allGroupOrders.forEach(order => {
      if (order.customers?.email) {
        uniqueEmails.add(order.customers.email);
      }
      if (order.group_participants) {
        order.group_participants.forEach((participant: any) => {
          if (participant.email) {
            uniqueEmails.add(participant.email);
          }
        });
      }
    });
    return uniqueEmails.size;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!groupOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Group Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This group order link is invalid or expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deliveryDate = formatDeliveryDate(groupOrder.delivery_date, 'EEEE, MMMM do, yyyy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Button onClick={handleShareOrder} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Group Order
          </Button>
        </div>

        <Card className="shadow-floating mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Group Order Dashboard</CardTitle>
            </div>
            <p className="text-lg font-semibold">#{groupOrder.order_number}</p>
            <p className="text-muted-foreground">
              Started by {groupOrder.customers?.first_name} {groupOrder.customers?.last_name}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Group Stats */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <h3 className="font-semibold text-green-800 text-lg">
                    {getTotalParticipants()}
                  </h3>
                  <p className="text-green-600 text-sm">People in Group</p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 text-lg">
                    ${getTotalGroupValue().toFixed(2)}
                  </h3>
                  <p className="text-green-600 text-sm">Total Group Value</p>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Delivery Date & Time</h3>
                  </div>
                  <p>{deliveryDate}</p>
                  <p className="text-muted-foreground">{groupOrder.delivery_time}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Delivery Address</h3>
                  </div>
                  <p>{groupOrder.delivery_address?.street}</p>
                  <p className="text-muted-foreground">
                    {groupOrder.delivery_address?.city}, {groupOrder.delivery_address?.state} {groupOrder.delivery_address?.zipCode}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* All Group Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Group Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allGroupOrders.map((order, index) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium">Order #{order.order_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {order.customers?.first_name} {order.customers?.last_name}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {format(new Date(order.created_at), 'MMM do, h:mm a')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {Array.isArray(order.line_items) ? order.line_items.map((item: any, itemIndex: number) => (
                          <div key={itemIndex} className="flex justify-between items-center py-1 text-sm">
                            <span>{item.quantity}x {item.title}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">No items</p>
                        )}
                      </div>
                      
                      {index < allGroupOrders.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAddMoreItems}
                size="lg"
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Add More Items
              </Button>
              
              {currentUser && (
                <Button 
                  onClick={() => navigate('/customer/dashboard')}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  View My Orders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrderDashboard;