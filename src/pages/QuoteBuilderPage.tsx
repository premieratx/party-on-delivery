import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const QuoteBuilderPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for resize messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://booking.premierpartycruises.com') return;
      
      if (event.data.type === 'quote-builder-resize') {
        const iframe = document.getElementById('quote-widget-iframe') as HTMLIFrameElement;
        const container = document.getElementById('quote-widget-container') as HTMLDivElement;
        if (iframe && event.data.height) {
          const newHeight = Math.max(event.data.height + 50, 1200);
          iframe.style.transition = 'height 0.3s ease-in-out';
          iframe.style.height = newHeight + 'px';
          if (container) {
            container.style.minHeight = newHeight + 'px';
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    const iframe = document.getElementById('quote-widget-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.style.height = '1200px';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/boats')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Boats
          </Button>
        </div>
      </div>

      {/* Quote Builder Iframe Container */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div 
          id="quote-widget-container" 
          style={{ 
            width: '100%', 
            minHeight: '1200px', 
            position: 'relative' 
          }}
        >
          <iframe 
            id="quote-widget-iframe"
            src="https://booking.premierpartycruises.com/"
            style={{ 
              width: '100%', 
              height: '1200px', 
              border: 'none', 
              display: 'block', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              position: 'relative', 
              zIndex: 1 
            }}
            title="Get Your Quote - Premier Party Cruises"
            allow="payment; clipboard-write"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
};

export default QuoteBuilderPage;
