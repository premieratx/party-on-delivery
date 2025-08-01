import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const OrderComplete = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      const orderNumber = urlParams.get('order_number');
      
      if (!sessionId && !orderNumber) {
        setIsLoading(false);
        toast({
          title: "Order Not Found",
          description: "No order information found.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Use fetch instead of Supabase client to avoid type recursion
        const supabaseUrl = 'https://acmlfzfliqupwxwoefdq.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns';
        
        // Try multiple ways to find the order
        let order = null;
        
        if (sessionId) {
          // First try with stripe_session_id
          const sessionUrl = `${supabaseUrl}/rest/v1/customer_orders?stripe_session_id=eq.${sessionId}&select=*`;
          const sessionResponse = await fetch(sessionUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
          const sessionOrders = await sessionResponse.json();
          order = sessionOrders[0];
          
          // If not found, try with order_number from URL params
          if (!order && orderNumber) {
            const orderUrl = `${supabaseUrl}/rest/v1/customer_orders?order_number=eq.${orderNumber}&select=*`;
            const orderResponse = await fetch(orderUrl, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            });
            const orders = await orderResponse.json();
            order = orders[0];
          }
        } else if (orderNumber) {
          // Try with order_number
          const orderUrl = `${supabaseUrl}/rest/v1/customer_orders?order_number=eq.${orderNumber}&select=*`;
          const orderResponse = await fetch(orderUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
          const orders = await orderResponse.json();
          order = orders[0];
        }

        if (!order) {
          toast({
            title: "Order Not Found",
            description: "Could not find order details.",
            variant: "destructive",
          });
          return;
        }

        // Get customer data
        const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?id=eq.${order.customer_id}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const customers = await customerResponse.json();
        const customer = customers[0];

        // Generate group order name if not exists
        if (!order.group_order_name && customer) {
          const groupName = `${customer.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
          
          await fetch(`${supabaseUrl}/rest/v1/customer_orders?id=eq.${order.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ group_order_name: groupName }),
          });
          
          order.group_order_name = groupName;
        }

        // Combine data
        setOrderData({ ...order, customer });

        // Send confirmation email
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderNumber: order.order_number,
              stripeSessionId: sessionId,
              customerEmail: customer?.email,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't block the order completion for email failures
        }

      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrderData();
  }, [location.search, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground">We couldn't find your order details.</p>
        </div>
      </div>
    );
  }

  return (
    <OrderCompleteView
      orderNumber={orderData.order_number}
      customerName={orderData.customer?.first_name || 'Customer'}
      orderItems={orderData.line_items || []}
      totalAmount={orderData.total_amount}
      deliveryDate={orderData.delivery_date}
      deliveryTime={orderData.delivery_time}
      deliveryAddress={orderData.delivery_address}
      shareToken={orderData.share_token}
      groupOrderName={orderData.group_order_name}
    />
  );
};

export default OrderComplete;