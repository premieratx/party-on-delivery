import React, { useState } from 'react';
import { DeliveryAppNavigation } from '@/components/navigation/DeliveryAppNavigation';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';
import { DeliveryAppCreator } from '@/components/admin/DeliveryAppCreator';
import { CustomerFlowConnector } from '@/components/admin/CustomerFlowConnector';
import { Button } from '@/components/ui/button';

const DeliveryAppManager = () => {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <DeliveryAppCreator 
          open={showEditor} 
          onOpenChange={setShowEditor} 
          onSaved={() => setShowEditor(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Delivery App Manager</h1>
          <p className="text-muted-foreground">
            Manage and navigate between all delivery apps and ensure products are properly synced
          </p>
        </div>

        {/* Create/Edit Delivery Apps */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Delivery App Creator</h2>
            <Button onClick={() => setShowEditor(true)}>
              Create/Edit Delivery Apps
            </Button>
          </div>
          <p className="text-muted-foreground">
            Create new delivery apps or edit existing ones with full tab configuration, collection mapping, and styling options.
          </p>
        </div>

        {/* Force Sync Section */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Product Sync Management</h2>
          <ForceProductSync />
        </div>

        {/* Customer Flow Connector */}
        <div className="bg-card border rounded-lg p-6">
          <CustomerFlowConnector />
        </div>

        {/* Navigation Section */}
        <div className="bg-card border rounded-lg p-6">
          <DeliveryAppNavigation />
        </div>
      </div>
    </div>
  );
};

export default DeliveryAppManager;