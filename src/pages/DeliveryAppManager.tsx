import React from 'react';
import { UnifiedFlowCreatorDashboard } from '@/components/admin/UnifiedFlowCreatorDashboard';
import { DeliveryAppNavigation } from '@/components/navigation/DeliveryAppNavigation';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';
import { CustomerFlowConnector } from '@/components/admin/CustomerFlowConnector';

const DeliveryAppManager = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main Unified Creator */}
        <UnifiedFlowCreatorDashboard />

        {/* Additional Management Tools */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Force Sync Section */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Product Sync Management</h2>
            <ForceProductSync />
          </div>

          {/* Customer Flow Connector */}
          <div className="bg-card border rounded-lg p-6">
            <CustomerFlowConnector />
          </div>
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