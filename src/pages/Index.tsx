import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import TestSMS from '@/components/TestSMS';
import { QuickSyncTest } from '@/components/QuickSyncTest';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <QuickSyncTest />
      <PartyPlanningButton />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
