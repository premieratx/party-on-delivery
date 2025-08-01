import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, X, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const GroupOrderInvite = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('🎯 GroupOrderInvite - Simple page loaded with token:', shareToken);

  const handleJoinGroupOrder = async () => {
    console.log('🎯 User chose to JOIN group order');
    
    try {
      // First fetch the group order details to get delivery info
      const { data, error } = await supabase.functions.invoke('get-group-order', {
        body: { shareToken }
      });
      
      if (data?.success && data.originalOrder) {
        // Store group order data with delivery details
        localStorage.setItem('groupOrderToken', shareToken || '');
        localStorage.setItem('partyondelivery_add_to_order', 'true');
        localStorage.setItem('groupOrderJoinDecision', 'yes');
        
        // CRITICAL: Store group order delivery details with highest priority
        localStorage.setItem('groupOrderDeliveryInfo', JSON.stringify({
          date: data.originalOrder.delivery_date,
          timeSlot: data.originalOrder.delivery_time,
          address: data.originalOrder.delivery_address,
          priority: 'group_order' // Highest priority flag
        }));
        
        // Generate group discount
        localStorage.setItem('partyondelivery_applied_discount', JSON.stringify({
          code: 'GROUP-SHIPPING-FREE',
          type: 'free_shipping',
          value: 0
        }));
        
        toast({
          title: "Joining Group Order!",
          description: "You'll get FREE DELIVERY with the group order.",
        });
        
        // Navigate to main page to start shopping
        navigate(`/?checkout=true&share=${shareToken}&customer=true`);
      } else {
        throw new Error('Failed to load group order details');
      }
    } catch (error) {
      console.error('Error joining group order:', error);
      toast({
        title: "Error",
        description: "Failed to join group order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewOrder = () => {
    console.log('🎯 User chose to CREATE individual order');
    
    // Clear any group order data
    localStorage.removeItem('groupOrderToken');
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('groupOrderJoinDecision');
    localStorage.setItem('groupOrderJoinDecision', 'no');
    
    toast({
      title: "Starting Individual Order",
      description: "You can create your own delivery order.",
    });
    
    // Navigate to main page for individual order
    navigate('/');
  };

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground mb-4">
              This invitation link is not valid.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Join a Group Delivery Order
            </p>
            <p className="text-muted-foreground">
              Someone invited you to join their alcohol delivery order
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Benefits of Joining:
                </h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>FREE delivery fee</strong> (normally $9.99)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Delivered together at the same time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Same great selection of drinks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Decision Buttons */}
            <Card className="text-center">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  What would you like to do?
                </h3>
                <p className="text-muted-foreground mb-6">
                  You can join the group order for free delivery, or create your own individual order.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleJoinGroupOrder}
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Join Group Order (FREE Delivery!)
                  </Button>
                  
                  <Button 
                    onClick={handleCreateNewOrder}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Create Individual Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                This is a secure invitation link. Your items will be delivered safely and on time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrderInvite;