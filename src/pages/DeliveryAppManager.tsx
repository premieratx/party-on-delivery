import React, { useState } from 'react';
import { UnifiedFlowCreatorDashboard } from '@/components/admin/UnifiedFlowCreatorDashboard';
import { EnhancedCustomerFlowCreator } from '@/components/admin/EnhancedCustomerFlowCreator';
import { DeliveryAppNavigation } from '@/components/navigation/DeliveryAppNavigation';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';
import { CustomerFlowConnector } from '@/components/admin/CustomerFlowConnector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const DeliveryAppManager = () => {
  const [showFlowCreator, setShowFlowCreator] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Customer Flow Creator */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Enhanced Customer Flows</h2>
            <Button onClick={() => setShowFlowCreator(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Customer Flow
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Create customer flows with pre-filled delivery info, multiple affiliate assignments, and tracking.
          </p>
        </div>

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

      <EnhancedCustomerFlowCreator
        open={showFlowCreator}
        onOpenChange={setShowFlowCreator}
        onSaved={() => {
          setShowFlowCreator(false);
          // Refresh data if needed
        }}
      />
    </div>
  );
};

export default DeliveryAppManager;