import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderData {
  id: string;
  order_number: string;
  total_amount: number;
  delivery_date: string;
  delivery_time: string;
  delivery_address: any;
  line_items: any[];
  share_token: string;
  group_order_name?: string;
  customer: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

const OrderComplete = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    const orderNumber = urlParams.get('order_number');
    
    const loadData = async () => {
      if (sessionId || orderNumber) {
        try {
          const { data: order, error } = sessionId 
            ? await supabase
                .from('customer_orders')
                .select(`
                  id,
                  order_number,
                  total_amount,
                  delivery_date,
                  delivery_time,
                  delivery_address,
                  line_items,
                  share_token,
                  group_order_name,
                  customer:customers(first_name, last_name, email)
                `)
                .eq('stripe_session_id', sessionId)
                .single()
            : await supabase
                .from('customer_orders')
                .select(`
                  id,
                  order_number,
                  total_amount,
                  delivery_date,
                  delivery_time,
                  delivery_address,
                  line_items,
                  share_token,
                  group_order_name,
                  customer:customers(first_name, last_name, email)
                `)
                .eq('order_number', orderNumber!)
                .single();

          if (error) throw error;

          if (order) {
            setOrderData(order as OrderData);
            
            // Generate group order name if not exists
            if (!order.group_order_name) {
              const groupName = `${order.customer?.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
              
              await supabase
                .from('customer_orders')
                .update({ group_order_name: groupName })
                .eq('id', order.id);
                
              setOrderData(prevData => prevData ? { ...prevData, group_order_name: groupName } : null);
            }
          } else {
            toast({
              title: "Order Not Found",
              description: "Could not find order details.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          toast({
            title: "Error",
            description: "Failed to load order details.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        toast({
          title: "Order Not Found",
          description: "No order information found.",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, [location.search]);

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