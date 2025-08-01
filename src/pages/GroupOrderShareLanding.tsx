import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Clock, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface GroupOrder {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: any;
  subtotal: number;
  total_amount: number;
  group_participants: any;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const GroupOrderShareLanding = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<GroupOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('🔥 GroupOrderShareLanding mounted with shareToken:', shareToken);
  console.log('🔥 Current URL:', window.location.href);
  console.log('🔥 URL pathname:', window.location.pathname);
  console.log('🔥 URL search params:', window.location.search);
  console.log('🔥 useParams result:', useParams());

  useEffect(() => {
    console.log('🔥 useEffect triggered, shareToken:', shareToken);
    console.log('🔥 shareToken type:', typeof shareToken);
    console.log('🔥 shareToken length:', shareToken?.length);
    
    if (shareToken) {
      console.log('🔥 Loading group order for token:', shareToken);
      loadGroupOrder();
    } else {
      console.error('🔥 No shareToken found in URL params');
      console.error('🔥 This means the route parameter extraction failed');
      setIsLoading(false);
    }
  }, [shareToken]);

  const loadGroupOrder = async () => {
    try {
      console.log('🔍 Starting loadGroupOrder with token:', shareToken);
      
      // First, try a simple query to see if the token exists at all
      const { data: simpleCheck, error: simpleError } = await supabase
        .from('customer_orders')
        .select('id, order_number, share_token')
        .eq('share_token', shareToken);
      
      console.log('📊 Simple token check result:', { simpleCheck, simpleError });
      
      if (simpleError) {
        console.error('❌ Simple query failed:', simpleError);
      }
      
      // Now do the full query
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
        .maybeSingle();

      console.log('📋 Full query result:', { orderData, error });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (!orderData) {
        console.log('❌ No order found for token:', shareToken);
        toast({
          title: "Order Not Found",
          description: "The shared order link is invalid or expired.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      console.log('✅ Successfully loaded order:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('💥 Error loading group order:', error);
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
    // Store detailed group order information for exact matching
    localStorage.setItem('groupOrderToken', shareToken || '');
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    localStorage.setItem('groupOrderJoinDecision', 'yes');
    
    // Store original order details for exact matching in CST
    const originalOrderData = {
      deliveryDate: order?.delivery_date,
      deliveryTime: order?.delivery_time,
      deliveryAddress: order?.delivery_address,
      customerName: `${order?.customers?.first_name || ''} ${order?.customers?.last_name || ''}`.trim(),
      orderNumber: order?.order_number,
      shareToken: shareToken
    };
    
    // Store for prefilling delivery info - use the same date handling as everywhere else
    localStorage.setItem('prefillDeliveryInfo', JSON.stringify({
      date: toZonedTime(new Date(order?.delivery_date), 'America/Chicago'),
      timeSlot: order?.delivery_time,
      address: order?.delivery_address
    }));
    localStorage.setItem('originalGroupOrderData', JSON.stringify(originalOrderData));
    
    // Generate and store group discount code
    if (order?.customers?.last_name) {
      const groupDiscountCode = `GROUP-SHIPPING-${order.customers.last_name.toUpperCase()}`;
      localStorage.setItem('partyondelivery_applied_discount', JSON.stringify({
        code: groupDiscountCode,
        type: 'free_shipping',
        value: 0
      }));
    }
    
    toast({
      title: "Joining Group Order!",
      description: "You'll be added to the group delivery with free shipping.",
    });
    
    // Navigate to main page with checkout parameters
    navigate(`/?checkout=true&share=${shareToken}&customer=true`);
  };

  const handleDeclineOrder = () => {
    // Clear any stored group order data
    localStorage.removeItem('groupOrderToken');
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('groupOrderJoinDecision');
    localStorage.removeItem('originalGroupOrderData');
    localStorage.setItem('groupOrderJoinDecision', 'no');
    
    toast({
      title: "Starting New Order",
      description: "You can create your own delivery order.",
    });
    
    // Navigate to main page for individual order
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-muted-foreground">Loading group order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This order link is invalid or expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the same date formatting as everywhere else in the app
  const deliveryDate = format(
    toZonedTime(new Date(order.delivery_date), 'America/Chicago'), 
    'EEEE, MMMM do, yyyy'
  );

  const customerFullName = `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim();
  const totalParticipants = 1 + (order.group_participants?.length || 0);

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
              Join {customerFullName}'s Group Delivery Order
            </p>
            <p className="text-muted-foreground">
              Add your items and get FREE DELIVERY!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Delivery Details Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{deliveryDate}</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_time} (CST)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.delivery_address?.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery_address?.city}, {order.delivery_address?.state} {order.delivery_address?.zipCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Benefits of Joining This Group Order:
                </h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>FREE delivery fee (normally $9.99)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Your items delivered together on {deliveryDate}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Join {totalParticipants} other{totalParticipants !== 1 ? 's' : ''} in this order</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Confirmation Question */}
            <Card className="text-center">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Do you want to join {customerFullName}'s Group Delivery Order?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Your items will be delivered together on {deliveryDate} at {order.delivery_time} to the address above.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleJoinOrder}
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, Join Group Order
                  </Button>
                  
                  <Button 
                    onClick={handleDeclineOrder}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    No, Start New Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By clicking "Yes, Join Group Order", you agree to have your items delivered 
                at the same time and location as {customerFullName}'s order.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrderShareLanding;