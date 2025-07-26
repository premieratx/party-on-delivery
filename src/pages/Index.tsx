import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import TestSMS from '@/components/TestSMS';
import { QuickSyncTest } from '@/components/QuickSyncTest';
import { TestSheetsConnection } from '@/components/TestSheetsConnection';
import { TestGHLConnection } from '@/components/TestGHLConnection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <TestSheetsConnection />
      <TestGHLConnection />
      <QuickSyncTest />
      <PartyPlanningButton />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
