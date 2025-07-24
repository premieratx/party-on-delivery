import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, ArrowRight } from 'lucide-react';

const OrderContinuation = () => {
  const navigate = useNavigate();

  const handleLoginToDashboard = () => {
    navigate('/customer/login?redirect=dashboard');
  };

  const handleContinueShopping = () => {
    navigate('/?customer=true&discount=PREMIER2025');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700">Thanks for Your Order!</CardTitle>
          <p className="text-muted-foreground">
            Your order has been successfully placed and paid for.
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
            
            <Button onClick={handleLoginToDashboard} className="w-full" size="lg">
              Login to Manage Order
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button variant="outline" onClick={handleContinueShopping} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderContinuation;