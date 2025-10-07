import { Navigation } from '@/components/concierge/Navigation';
import { Car } from 'lucide-react';

const TransportPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-lg">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Transportation</h1>
        </div>
        <p className="text-white/90 drop-shadow-lg">Arrange luxury vehicles for group transportation.</p>
      </div>
      <Navigation />
    </div>
  );
};

export default TransportPage;
