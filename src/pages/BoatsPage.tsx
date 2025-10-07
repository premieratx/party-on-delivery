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
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Ship className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Boat Rentals</h1>
        </div>
        <p className="text-muted-foreground mb-6">Reserve boats for Austin lake adventures.</p>
        
        <div 
          className="w-full bg-card rounded-lg overflow-hidden shadow-lg"
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
