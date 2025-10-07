import { Navigation } from '@/components/concierge/Navigation';
import { MapPin } from 'lucide-react';

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Explore Austin</h1>
        </div>
        <p className="text-white/90 drop-shadow-lg">Discover the best activities and things to do in Austin.</p>
      </div>
      <Navigation />
    </div>
  );
};

export default ExplorePage;
