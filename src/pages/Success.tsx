import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const Success = () => {
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

      try {
        const { data, error } = await supabase.functions.invoke('create-shopify-order', {
          body: { sessionId }
        });

        if (error) {
          console.error('Error creating Shopify order:', error);
          setOrderStatus({ success: false, error: error.message });
        } else {
          setOrderStatus({
            success: true,
            shopifyOrderId: data.shopifyOrderId,
            orderNumber: data.orderNumber
          });
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
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-lg mb-2">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Order Number:</span>
                <span className="font-medium">#{orderStatus.orderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="font-medium text-green-600">Confirmed</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                You'll receive an order confirmation email shortly
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                We'll prepare your order for delivery
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                You'll receive updates about your delivery
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to={`/order-tracking?order=${orderStatus.orderNumber}`}>
                Track Order
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;