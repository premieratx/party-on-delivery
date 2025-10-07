import { Navigation } from '@/components/concierge/Navigation';
import { Car } from 'lucide-react';

const TransportPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Car className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Transportation</h1>
        </div>
        <p className="text-muted-foreground">Arrange luxury vehicles for group transportation.</p>
      </div>
      <Navigation />
    </div>
  );
};

export default TransportPage;
