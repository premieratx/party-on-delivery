import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSessionTracking } from '@/hooks/useSessionTracking';

const Success = () => {
  const { storeSessionId } = useSessionTracking();
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);
  const [orderStatus, setOrderStatus] = useState<{
    success: boolean;
    shopifyOrderId?: string;
    orderNumber?: string;
    error?: string;
  } | null>(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const createShopifyOrder = async () => {
      if (!sessionId) {
        setOrderStatus({ success: false, error: 'No session ID found' });
        setIsCreatingOrder(false);
        return;
      }

      // Store session ID for later linking when user logs in
      storeSessionId(sessionId);
      
      // Also store the payment intent ID from the session for more reliable linking
      localStorage.setItem('lastPaymentIntent', sessionId);

      try {
        const { data, error } = await supabase.functions.invoke('process-order-complete', {
          body: { session_id: sessionId }
        });

        if (error) {
          console.error('Error processing order:', error);
          setOrderStatus({ success: false, error: error.message });
        } else {
          setOrderStatus({
            success: true,
            shopifyOrderId: data.order?.id || data.shopifyOrderId,
            orderNumber: data.order?.order_number || data.orderNumber
          });
          
          // Update localStorage with completed order info immediately
          const existingOrder = JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}');
          const completedOrderInfo = {
            ...existingOrder,
            orderNumber: data.order?.order_number || data.orderNumber,
            orderId: data.order?.id || data.shopifyOrderId,
            recentpurchase: true,
            total: existingOrder.total || 0
          };
          localStorage.setItem('partyondelivery_last_order', JSON.stringify(completedOrderInfo));
          console.log('Completed order info saved to localStorage:', completedOrderInfo);
          
          // Send SMS notifications after successful processing
          try {
            await supabase.functions.invoke('send-order-sms', {
              body: {
                orderData: data,
                type: 'customer_confirmation'
              }
            });
            console.log('Customer SMS sent successfully');
          } catch (smsError) {
            console.warn('Failed to send customer SMS:', smsError);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setOrderStatus({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createShopifyOrder();
  }, [sessionId]);

  if (isCreatingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <h2 className="text-lg font-semibold text-center">Processing your order...</h2>
            <p className="text-muted-foreground text-center mt-2">
              We're creating your order in our system. This will just take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderStatus?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-center mb-2">Order Processing Issue</h2>
            <p className="text-muted-foreground text-center mb-4">
              Your payment was successful, but we encountered an issue creating your order. 
              Our team has been notified and will contact you shortly.
            </p>
            <p className="text-sm text-red-600 text-center mb-4">
              Error: {orderStatus?.error}
            </p>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700">Order Confirmed!</CardTitle>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been successfully placed and paid for.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                We'll prepare your order for delivery
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Track your order status in your dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Share with friends to add to your group order
              </li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-muted-foreground">
              Ready to manage your order or invite friends?
            </p>
            
            <Button asChild className="w-full" size="lg">
              <Link to="/customer/login">Login to Manage Order</Link>
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/?customer=true&discount=PREMIER2025">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;