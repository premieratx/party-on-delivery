import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, ExternalLink, Users, Package } from 'lucide-react';

export const GroupOrderQuickTest: React.FC = () => {
  const { toast } = useToast();
  const [testOrderId, setTestOrderId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createTestOrder = async () => {
    setIsCreating(true);
    try {
      // Create a test order with share functionality
      const testOrder = {
        order_number: `TEST-${Date.now()}`,
        customer_id: '00000000-0000-0000-0000-000000000000',
        subtotal: 49.99,
        total_amount: 59.99,
        delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        delivery_time: '2:00 PM - 3:00 PM',
        delivery_address: {
          street: '123 Test Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        line_items: [
          {
            title: 'Test Party Supplies',
            quantity: 2,
            price: 24.99,
            image: '/placeholder.svg'
          }
        ],
        status: 'pending',
        is_shareable: true,
        group_order_name: `Test User's ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`
      };

      const { data: order, error } = await supabase
        .from('customer_orders')
        .insert(testOrder)
        .select()
        .single();

      if (error) throw error;

      setTestOrderId(order.id);
      setShareToken(order.share_token);

      toast({
        title: "Test Order Created! ✅",
        description: "You can now test the group order functionality",
      });

    } catch (error: any) {
      console.error('Failed to create test order:', error);
      toast({
        title: "Creation Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}/?share=${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied! 📋",
      description: "Open this in a new incognito window to test",
    });
  };

  const openSharedView = () => {
    if (!shareToken) return;
    const sharedUrl = `${window.location.origin}/shared-order/${shareToken}`;
    window.open(sharedUrl, '_blank');
  };

  const openGroupModal = () => {
    if (!shareToken) return;
    const modalUrl = `${window.location.origin}/?share=${shareToken}`;
    window.open(modalUrl, '_blank');
  };

  const cleanupTestOrder = async () => {
    if (!testOrderId) return;
    
    try {
      await supabase
        .from('customer_orders')
        .delete()
        .eq('id', testOrderId);

      setTestOrderId(null);
      setShareToken(null);

      toast({
        title: "Test Order Cleaned Up ✅",
        description: "Test data removed from database",
      });
    } catch (error: any) {
      toast({
        title: "Cleanup Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Quick Group Order Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!testOrderId ? (
          <Button 
            onClick={createTestOrder} 
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            <Package className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating Test Order...' : 'Create Test Order'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Test order created!</p>
              <p className="text-xs text-green-600">Share Token: {shareToken?.substring(0, 8)}...</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={copyShareLink}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Group Order Link
              </Button>

              <Button 
                onClick={openGroupModal}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Group Modal
              </Button>

              <Button 
                onClick={openSharedView}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Shared View
              </Button>
            </div>

            <Button 
              onClick={cleanupTestOrder}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Clean Up Test Order
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Test Steps:</strong></p>
          <p>1. Create a test order</p>
          <p>2. Copy the group order link</p>
          <p>3. Open in incognito/new window</p>
          <p>4. Check if group modal appears</p>
          <p>5. Test "Join Group" functionality</p>
        </div>
      </CardContent>
    </Card>
  );
};