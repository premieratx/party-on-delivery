import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface GroupOrderDetails {
  order_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: any;
  total_amount: number;
  customer: {
    first_name?: string;
    last_name?: string;
    email: string;
  } | null;
}

interface GroupOrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: GroupOrderDetails | null;
  onJoinGroup: () => void;
  onStartNew: () => void;
  isLoading?: boolean;
}

export const GroupOrderConfirmationModal: React.FC<GroupOrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  orderDetails,
  onJoinGroup,
  onStartNew,
  isLoading = false
}) => {
  if (!orderDetails) return null;

  // Format delivery date properly - ensure we're in Central Time
  const deliveryDate = new Date(orderDetails.delivery_date);
  const formattedDate = format(
    toZonedTime(deliveryDate, 'America/Chicago'), 
    'EEEE, MMMM do, yyyy'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Join Group Order?
          </DialogTitle>
          <DialogDescription className="text-center">
            Someone shared their group order with you!
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {orderDetails.customer?.first_name || 'Customer'}'s Order
              </h3>
              <p className="text-sm text-muted-foreground">
                Order #{orderDetails.order_number}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">{orderDetails.delivery_time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {orderDetails.delivery_address.street}<br />
                    {orderDetails.delivery_address.city}, {orderDetails.delivery_address.state} {orderDetails.delivery_address.zipCode}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <Package className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-800">
                FREE DELIVERY when you join!
              </p>
              <p className="text-xs text-green-600">
                Split delivery costs with the group
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-3">
          <Button 
            onClick={() => {
              localStorage.setItem('groupOrderJoinDecision', 'yes');
              onJoinGroup();
            }} 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Yes, Add to This Delivery!'}
          </Button>
          
          <Button 
            onClick={() => {
              localStorage.setItem('groupOrderJoinDecision', 'no');
              onStartNew();
            }} 
            variant="outline" 
            className="w-full"
            disabled={isLoading}
          >
            No, Start New Order
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          By joining, your items will be delivered together with {orderDetails.customer?.first_name || 'the group'}'s order
        </p>
      </DialogContent>
    </Dialog>
  );
};