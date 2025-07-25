import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import TestSMS from '@/components/TestSMS';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <PartyPlanningButton />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
