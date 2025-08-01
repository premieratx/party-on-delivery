import React from 'react';
import { GroupOrderFlowTest } from '@/components/GroupOrderFlowTest';
import { GroupOrderQuickTest } from '@/components/GroupOrderQuickTest';

const TestGroupOrders = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Group Order Testing</h1>
        
        <GroupOrderQuickTest />
        <GroupOrderFlowTest />
        
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Manual Testing URLs:</h2>
          <div className="grid gap-4">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-medium">1. Test Group Order Share Link</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Add this to the URL: <code>?share=YOUR_SHARE_TOKEN</code>
              </p>
              <p className="text-sm">Should show the group order confirmation modal</p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-medium">2. Test Shared Order View</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Visit: <code>/shared-order/YOUR_SHARE_TOKEN</code>
              </p>
              <p className="text-sm">Should show the full shared order details page</p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-medium">3. Test Group Order Joining</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Click "Yes, Add to This Delivery!" in the modal
              </p>
              <p className="text-sm">Should apply free shipping and start the group order flow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestGroupOrders;