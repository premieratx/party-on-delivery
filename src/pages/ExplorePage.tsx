import { Navigation } from '@/components/concierge/Navigation';
import { MapPin } from 'lucide-react';

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Explore Austin</h1>
        </div>
        <p className="text-muted-foreground">Discover the best activities and things to do in Austin.</p>
      </div>
      <Navigation />
    </div>
  );
};

export default ExplorePage;
