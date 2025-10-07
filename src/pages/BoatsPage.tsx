import { Navigation } from '@/components/concierge/Navigation';
import { Ship } from 'lucide-react';

const BoatsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Ship className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Boat Rentals</h1>
        </div>
        <p className="text-muted-foreground">Reserve boats for Austin lake adventures.</p>
      </div>
      <Navigation />
    </div>
  );
};

export default BoatsPage;
