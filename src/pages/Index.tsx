import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import TestSMS from '@/components/TestSMS';
import { QuickSyncTest } from '@/components/QuickSyncTest';
import { TestSheetsConnection } from '@/components/TestSheetsConnection';
import { TestGHLConnection } from '@/components/TestGHLConnection';
import { DirectSyncNow } from '@/components/DirectSyncNow';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <TestSheetsConnection />
      <TestGHLConnection />
      <DirectSyncNow />
      <QuickSyncTest />
      <PartyPlanningButton />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
