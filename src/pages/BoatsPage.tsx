import { Navigation } from '@/components/concierge/Navigation';
import { Ship, CalendarHeart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useScrollToHideNav } from '@/hooks/useScrollToHideNav';
import { BoatGalleryModal, boats } from '@/components/concierge/BoatGalleryModal';
import { BoatSaveTheDateModal } from '@/components/concierge/BoatSaveTheDateModal';
import { Button } from '@/components/ui/button';

const BoatsPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);
  const [selectedBoat, setSelectedBoat] = useState<typeof boats[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveDateModalOpen, setIsSaveDateModalOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://booking.premierpartycruises.com') return;
      
      if (event.data?.type === 'quote-builder-resize' && event.data?.height) {
        const newHeight = event.data.height;
        setIframeHeight(newHeight);
        if (iframeRef.current) {
          iframeRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      iframeRef.current.style.height = '800px';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-lg">
            <Ship className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Boat Rentals</h1>
        </div>
        <p className="text-white/90 mb-4 drop-shadow-lg">Reserve boats for Austin lake adventures.</p>
        
        {/* Save the Date Button */}
        <Button
          onClick={() => setIsSaveDateModalOpen(true)}
          className="mb-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 text-lg"
        >
          <CalendarHeart className="w-5 h-5 mr-2" />
          Save the Date - Party Cruise
        </Button>
        
        <div
          className="w-full bg-white/10 backdrop-blur-md rounded-lg overflow-hidden shadow-2xl border border-white/20"
          style={{ minHeight: `${iframeHeight}px` }}
        >
          <iframe
            ref={iframeRef}
            src="https://booking.premierpartycruises.com/"
            className="w-full border-0"
            style={{ height: `${iframeHeight}px` }}
            onLoad={handleIframeLoad}
            title="Boat Quote Builder"
          />
        </div>

        {/* Boat Gallery Section */}
        <div className="mt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-2xl">Our Fleet</h2>
          <p className="text-white/90 mb-6 drop-shadow-lg">Click to view photos and details of each boat</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boats.map((boat, index) => (
              <Button
                key={index}
                onClick={() => {
                  setSelectedBoat(boat);
                  setIsModalOpen(true);
                }}
                variant="outline"
                className="h-auto p-0 overflow-hidden border-2 border-white/30 hover:border-white hover:shadow-2xl transition-all bg-white/10 backdrop-blur-md"
              >
                <div className="w-full">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={boat.images[0]} 
                      alt={boat.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 text-left bg-gradient-to-br from-purple-900/90 to-pink-900/90">
                    <h3 className="text-xl font-bold text-white mb-1">{boat.name}</h3>
                    <p className="text-white/90 font-semibold">{boat.capacity}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <BoatGalleryModal 
        boat={selectedBoat}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBoat(null);
        }}
      />
      <BoatSaveTheDateModal
        isOpen={isSaveDateModalOpen}
        onClose={() => setIsSaveDateModalOpen(false)}
      />
      <Navigation hideOnScroll={true} />
    </div>
  );
};

export default BoatsPage;
