import { DeliveryWidget } from "@/components/DeliveryWidget";
import TestSMS from '@/components/TestSMS';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TestSMS />
      <DeliveryWidget />
    </div>
  );
};

export default Index;
