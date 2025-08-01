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
      const errorParam = urlParams.get('error');
      
      console.log("🔥 ORDER COMPLETE PAGE LOADED:", {
        currentUrl: window.location.href,
        sessionId,
        orderNumber,
        errorParam,
        allParams: Object.fromEntries(urlParams.entries())
      });
      
      if (errorParam) {
        console.log("🔥 ERROR PARAMETER DETECTED:", errorParam);
        setIsLoading(false);
        toast({
          title: "Order Processing Error",
          description: "There was an issue creating your order. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      if (!sessionId && !orderNumber) {
        console.log("🔥 NO SESSION ID OR ORDER NUMBER - MISSING PARAMS");
        setIsLoading(false);
        toast({
          title: "Order Not Found",
          description: "No order information found.",
          variant: "destructive",
        });
        return;
      }

      // Extended retry logic with longer waits for database sync
      const maxRetries = 8; // Increased retries
      let retryCount = 0;
      let order = null;

      while (retryCount < maxRetries && !order) {
        try {
          const supabaseUrl = 'https://acmlfzfliqupwxwoefdq.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns';
          
          console.log(`🔥 [OrderComplete] Attempt ${retryCount + 1}/${maxRetries} - Looking for order with sessionId: ${sessionId}, orderNumber: ${orderNumber}`);
          
          // Try multiple search strategies
          const searchQueries = [];
          
          if (sessionId) {
            searchQueries.push(`session_id=eq.${sessionId}`);
          }
          if (orderNumber) {
            searchQueries.push(`order_number=eq.${orderNumber}`);
          }
          
          for (const query of searchQueries) {
            const url = `${supabaseUrl}/rest/v1/customer_orders?${query}&select=*&order=created_at.desc&limit=1`;
            console.log(`🔥 [OrderComplete] Searching with: ${query}`);
            
            const response = await fetch(url, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              console.error(`🔥 [OrderComplete] API Error: ${response.status} ${response.statusText}`);
              continue;
            }
            
            const orders = await response.json();
            console.log(`🔥 [OrderComplete] Query ${query} returned:`, orders.length > 0 ? 'Found order' : 'No orders', orders.length > 0 ? { id: orders[0].id, order_number: orders[0].order_number } : '');
            
            if (orders && orders.length > 0) {
              order = orders[0];
              break;
            }
          }

          if (!order) {
            retryCount++;
            // Longer wait times for later retries
            const waitTime = retryCount < 3 ? 1000 : retryCount < 6 ? 2000 : 3000;
            if (retryCount < maxRetries) {
              console.log(`🔥 [OrderComplete] Order not found, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (fetchError) {
          console.error(`🔥 [OrderComplete] Error on attempt ${retryCount + 1}:`, fetchError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!order) {
        console.error(`[OrderComplete] Failed to find order after ${maxRetries} attempts`);
        toast({
          title: "Order Not Found",
          description: "Could not find order details. Please check your order number or contact support.",
          variant: "destructive",
        });
        return;
      }

      console.log(`[OrderComplete] Order found successfully:`, order.order_number);

      try {
        // Get customer data
        const supabaseUrl = 'https://acmlfzfliqupwxwoefdq.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns';
        
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