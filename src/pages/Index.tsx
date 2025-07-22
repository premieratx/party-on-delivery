import { DeliveryWidget } from "@/components/DeliveryWidget";
import { AddressPersistenceTest } from "@/components/AddressPersistenceTest";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showTest, setShowTest] = useState(false);
  
  if (showTest) {
    return (
      <div>
        <div className="p-4">
          <Button onClick={() => setShowTest(false)} variant="outline">
            Back to App
          </Button>
        </div>
        <AddressPersistenceTest />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={() => setShowTest(true)} variant="outline" size="sm">
          Test Address
        </Button>
      </div>
      <DeliveryWidget />
    </div>
  );
};

export default Index;
