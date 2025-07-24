import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, Package } from 'lucide-react';

interface PostCheckoutSharedOrderProps {
  orderNumber?: string;
  shareToken?: string;
  onContinueShopping: () => void;
  onGoToDashboard: () => void;
}

const PostCheckoutSharedOrder: React.FC<PostCheckoutSharedOrderProps> = ({
  orderNumber,
  shareToken,
  onContinueShopping,
  onGoToDashboard,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-green-700">Items Added to Group Order!</CardTitle>
        <p className="text-muted-foreground">
          Your items have been successfully added to the shared delivery order.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Group Order Details
          </h3>
          <div className="space-y-2">
            {orderNumber && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Order Number:</span>
                <span className="font-medium">#{orderNumber}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Your items will be delivered together with the group order at the scheduled time and address.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              View your shared order details in your dashboard
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Track the group delivery status
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Add more items to the order if needed
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onGoToDashboard} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            View Shared Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={onContinueShopping}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Add More Items
            </Button>
            {shareToken && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/order/${shareToken}`)}
                className="flex-1"
              >
                View Group Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCheckoutSharedOrder;