import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';


interface CoverFeature {
  label: string;
}

export interface CustomDeliveryCoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartOrder?: () => void;
  onSecondaryAction?: () => void;
  secondaryButtonText?: string;
  appName: string;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  checklistItems?: string[]; // up to 3 items
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string; // optional background video/gif URL
  // Legacy props kept for compatibility (unused in new design)
  phone?: string;
  sms?: string;
  features?: CoverFeature[];
}

const defaultChecklist = [
  'Locally Owned',
  'Same Day Delivery',
  'Cocktail Kits on Demand',
];

export const CustomDeliveryCoverModal: React.FC<CustomDeliveryCoverModalProps> = ({
  open,
  onOpenChange,
  onStartOrder,
  onSecondaryAction,
  secondaryButtonText = 'Margaritas Now',
  appName,
  logoUrl,
  title = 'Exclusive Concierge Delivery',
  subtitle = "Austin's favorite alcohol delivery service",
  buttonText = 'Order Now',
  checklistItems = defaultChecklist,
  backgroundImageUrl,
  backgroundVideoUrl,
}) => {
  const [showSparkle, setShowSparkle] = React.useState(true);
  const [enablePulse, setEnablePulse] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // control sparkle and CTA animations
  React.useEffect(() => {
    const t = setTimeout(() => setShowSparkle(false), 2000);
    const p = setTimeout(() => setEnablePulse(true), 1000); // start pulse after initial sequence
    return () => {
      clearTimeout(t);
      clearTimeout(p);
    };
  }, []);

  // slow-motion playback for background video
  React.useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = 0.6;
      } catch {}
    }
  }, [backgroundVideoUrl]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none">
         <article className="relative w-full">
          {/* Background */}
          <div className="relative h-[88vh] max-h-[820px] rounded-2xl overflow-hidden">
            {backgroundVideoUrl ? (
              <video
                ref={videoRef}
                src={backgroundVideoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: '60% 50%' }}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
                onLoadedMetadata={() => {
                  try {
                    if (videoRef.current) videoRef.current.currentTime = 0.5;
                  } catch {}
                }}
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImageUrl || backgroundImage})` }}
                aria-hidden="true"
              />
            )}
            {/* Overlays */}
            <div className="absolute inset-0 bg-black/70" />
            {/* Glitter over top quarter on load */}
            {showSparkle && (
              <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: '25%' }} aria-hidden="true">
                <span className="sparkle sparkle-sm" style={{ top: '12%', left: '18%', position: 'absolute', animationDelay: '80ms', animationDuration: '2s' }} />
                <span className="sparkle sparkle-md" style={{ top: '30%', left: '36%', position: 'absolute', animationDelay: '160ms', animationDuration: '2s' }} />
                <span className="sparkle sparkle-lg" style={{ top: '20%', left: '64%', position: 'absolute', animationDelay: '240ms', animationDuration: '2s' }} />
                <span className="sparkle sparkle-sm" style={{ top: '8%', left: '80%', position: 'absolute', animationDelay: '320ms', animationDuration: '2s' }} />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] font-montserrat uppercase tracking-wider">
              {/* Top: Logo + Headings (Bloom-style) */}
              <header className="w-full text-center">
                <div className="mx-auto mb-3 relative inline-flex items-center justify-center">
                  <img
                    src={logoUrl || partyLogo}
                    alt={`${appName} logo`}
                    className="h-44 w-auto max-h-[32vh] drop-shadow-lg animate-[fade-in_0.625s_ease-out]"
                    loading="eager"
                  />
                  {showSparkle && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[fade-in_3s_ease-out]" aria-hidden="true" style={{ width: '600%', height: '600%' }}>
                      <span className="sparkle sparkle-sm" style={{ top: '12%', left: '22%', animationDelay: '120ms', animationDuration: '2.3s' }} />
                      <span className="sparkle sparkle-md" style={{ top: '28%', left: '76%', animationDelay: '240ms', animationDuration: '2.3s' }} />
                      <span className="sparkle sparkle-lg" style={{ top: '60%', left: '18%', animationDelay: '360ms', animationDuration: '2.3s' }} />
                      <span className="sparkle sparkle-sm" style={{ top: '70%', left: '64%', animationDelay: '480ms', animationDuration: '2.3s' }} />
                      <span className="sparkle sparkle-md" style={{ top: '38%', left: '40%', animationDelay: '600ms', animationDuration: '2.3s' }} />
                      <span className="sparkle sparkle-sm" style={{ top: '15%', left: '55%', animationDelay: '720ms', animationDuration: '2.3s' }} />
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white animate-[fade-in_0.625s_ease-out]" style={{ animationDelay: '104ms', animationFillMode: 'both' }}>
                  {title || appName}
                </h1>
                <p className="mt-2 text-white/80 text-lg animate-[fade-in_0.625s_ease-out]" style={{ animationDelay: '208ms', animationFillMode: 'both' }}>
                  {subtitle}
                </p>
              </header>

              {/* Middle spacer to showcase video */}
              <div className="flex-1" />

              {/* Bottom: Checklist (flattened) + Buttons */}
              <div className="w-full max-w-sm space-y-3 mt-2 mb-0">
                {/* Restored vertical checklist with dot separators */}
                <div className="w-full mx-auto mb-2" style={{ transform: 'translateY(-25%)' }}>
                  <div className="flex flex-col items-center space-y-1">
                    {checklistItems.filter(Boolean).slice(0, 5).map((item, idx, arr) => (
                      <React.Fragment key={idx}>
                        <p
                          className="text-white/90 text-xs md:text-sm font-semibold leading-tight animate-[fade-in_1.5s_ease-out]"
                          style={{ animationDelay: `${240 + idx * 120}ms`, animationFillMode: 'both' }}
                        >
                          {item}
                        </p>
                        {idx < arr.length - 1 && (
                          <span className="text-white/60" aria-hidden="true">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <Button
                  size="lg"
                  className={`w-full h-12 rounded-full text-2xl font-semibold shadow-lg bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90 ${enablePulse ? 'animate-[pulse_1.4375s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'animate-[fade-in_0.625s_ease-out]'}`}
                  style={!enablePulse ? { animationDelay: '416ms', animationFillMode: 'both' } : undefined}
                  onClick={() => {
                    onOpenChange(false);
                    onStartOrder?.();
                  }}
                >
                  {buttonText}
                </Button>

              </div>
            </div>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDeliveryCoverModal;
