import { Navigation } from '@/components/concierge/Navigation';
import { Ship } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const BoatsPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

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
        <p className="text-white/90 mb-6 drop-shadow-lg">Reserve boats for Austin lake adventures.</p>
        
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
      </div>
      <Navigation />
    </div>
  );
};

export default BoatsPage;
