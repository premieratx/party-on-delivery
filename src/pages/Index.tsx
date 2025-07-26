import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import TestSMS from '@/components/TestSMS';
import { QuickSyncTest } from '@/components/QuickSyncTest';
import { TestSheetsConnection } from '@/components/TestSheetsConnection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <TestSheetsConnection />
      <QuickSyncTest />
      <PartyPlanningButton />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
