import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, MapPin, Package, Users, ShoppingCart, Copy } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface SharedOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address: any;
  special_instructions?: string;
  line_items: any;
  created_at: string;
  customer: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface Participant {
  participant_email: string;
  participant_name?: string;
  total_contribution: number;
  items_added: any;
  joined_at: string;
}

const SharedOrderView = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<SharedOrder | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groupOrders, setGroupOrders] = useState<SharedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadSharedOrder();
    checkCurrentUser();
  }, [shareToken]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadSharedOrder = async () => {
    try {
      if (!shareToken) {
        throw new Error('Invalid share link');
      }

      // Get order details using share token
      const { data: orderData, error: orderError } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer:customers(first_name, last_name, email)
        `)
        .eq('share_token', shareToken)
        .eq('is_shareable', true)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        throw new Error('Order not found or no longer shareable');
      }

      setOrder(orderData as SharedOrder);

      // Load ALL orders in this group (same share_token)
      const { data: allGroupOrders, error: groupError } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer:customers(first_name, last_name, email)
        `)
        .eq('share_token', shareToken);

      if (groupError) {
        console.error('Error loading group orders:', groupError);
      } else {
        setGroupOrders(allGroupOrders || []);
      }

      // Get participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('shared_order_participants')
        .select('*')
        .eq('order_id', orderData.id);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

    } catch (error) {
      console.error('Error loading shared order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrder = async () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/customer/login?return=${returnUrl}`);
      return;
    }

    try {
      // Check if user already joined
      const existingParticipant = participants.find(p => p.participant_email === currentUser.email);
      if (existingParticipant) {
        // Store group order token and navigate to add items to order with auto-applied discount
        localStorage.setItem('groupOrderToken', shareToken);
        navigate(`/?share=${shareToken}&customer=true`);
        return;
      }

      // Add user as participant
      const { error } = await supabase
        .from('shared_order_participants')
        .insert({
          order_id: order?.id,
          participant_email: currentUser.email,
          participant_name: currentUser.user_metadata?.first_name ? 
            `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name || ''}`.trim() : 
            currentUser.email
        });

      if (error) throw error;

      toast({
        title: "Joined Order!",
        description: "You can now add items to this delivery order.",
      });

      // Store group order token and navigate to shopping with share token and auto-apply discount
      localStorage.setItem('groupOrderToken', shareToken);
      navigate(`/?share=${shareToken}&customer=true`);

    } catch (error) {
      console.error('Error joining order:', error);
      toast({
        title: "Error",
        description: "Failed to join order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard!",
    });
  };

  const getDaysUntilDelivery = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    return differenceInDays(delivery, today);
  };

  const getTotalGroupContribution = () => {
    return participants.reduce((total, p) => total + Number(p.total_contribution), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This order link is invalid or no longer available for sharing.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const originalItems = Array.isArray(order.line_items) ? order.line_items : [];
  const daysUntilDelivery = order.delivery_date ? getDaysUntilDelivery(order.delivery_date) : null;
  const canStillJoin = daysUntilDelivery === null || daysUntilDelivery > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.customer.first_name}'s Group Order
              </h1>
              <p className="text-sm text-muted-foreground">Order #{order.order_number}</p>
            </div>
            <Button variant="outline" onClick={copyShareLink} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Delivery Info Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-muted-foreground">
                  {order.delivery_date && format(toZonedTime(new Date(order.delivery_date), 'America/Chicago'), 'EEEE, MMMM do, yyyy')}
                  {order.delivery_time && ` at ${order.delivery_time}`}
                </p>
                {daysUntilDelivery !== null && (
                  <Badge variant={daysUntilDelivery > 1 ? "secondary" : "destructive"} className="mt-1">
                    {daysUntilDelivery > 0 ? `${daysUntilDelivery} days to go` : 'Delivery today!'}
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </p>
                <p className="text-muted-foreground">
                  {order.delivery_address.street}<br />
                  {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zipCode}
                </p>
              </div>
            </div>
            {order.special_instructions && (
              <div>
                <p className="font-medium">Special Instructions</p>
                <p className="text-muted-foreground">{order.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Group Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Group Orders Summary
            </CardTitle>
            <CardDescription>
              All orders placed by {order.customer.first_name}'s group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupOrders.length > 0 ? groupOrders.map((groupOrder, orderIndex) => (
                <div key={groupOrder.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-medium">Order #{groupOrder.order_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {groupOrder.customer.first_name || groupOrder.customer.email}
                      </p>
                    </div>
                    <Badge variant="outline">${groupOrder.total_amount}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {Array.isArray(groupOrder.line_items) && groupOrder.line_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-1 text-sm">
                        <span>{item.quantity}x {item.title}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {orderIndex < groupOrders.length - 1 && <Separator className="mt-3" />}
                </div>
              )) : (
                <div className="space-y-3">
                  {originalItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Group Total</span>
                <span>${groupOrders.length > 0 ? 
                  groupOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2) : 
                  order.total_amount
                }</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Group Participants */}
        {participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{participant.participant_name || participant.participant_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {format(new Date(participant.joined_at), 'MMM do, h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${participant.total_contribution}</p>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(participant.items_added) ? participant.items_added.length : 0} items
                      </p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Group Total Added</span>
                  <span>${getTotalGroupContribution().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            {canStillJoin ? (
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Join This Delivery Order</h3>
                  <p className="text-muted-foreground">
                    Add your items to this order and get them delivered together!
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Free Delivery with group order!
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleJoinOrder} size="lg" className="w-full md:w-auto">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {currentUser ? 'Add Items to Order' : 'Login & Join Order'}
                </Button>
                {!currentUser && (
                  <p className="text-sm text-muted-foreground">
                    You'll need to sign in with Google to join this order
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground">Order Closed</h3>
                <p className="text-muted-foreground">
                  This order is no longer accepting new items as the delivery date has passed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedOrderView;