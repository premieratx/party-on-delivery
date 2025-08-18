import React from 'react';
import { DeliveryAppNavigation } from '@/components/navigation/DeliveryAppNavigation';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';

const DeliveryAppManager = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Delivery App Manager</h1>
          <p className="text-muted-foreground">
            Manage and navigate between all delivery apps and ensure products are properly synced
          </p>
        </div>

        {/* Force Sync Section */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Product Sync Management</h2>
          <ForceProductSync />
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