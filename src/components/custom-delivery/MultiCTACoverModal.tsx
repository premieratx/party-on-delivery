import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';

export interface MultiCTAButton {
  text: string;
  onClick: () => void;
  bgColor?: string;
  textColor?: string;
}

export interface MultiCTACoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName?: string;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  checklistItems?: string[];
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  buttons: MultiCTAButton[];
}

const defaultChecklist = [
  'Locally Owned',
  'Same Day Delivery',
  'Cocktail Kits on Demand',
];

const MultiCTACoverModal: React.FC<MultiCTACoverModalProps> = ({
  open,
  onOpenChange,
  appName = 'Party On Delivery',
  logoUrl,
  title = 'Exclusive Concierge Delivery',
  subtitle = "Austin's favorite alcohol delivery service",
  checklistItems = defaultChecklist,
  backgroundImageUrl,
  backgroundVideoUrl,
  buttons,
}) => {
  const [showSparkle, setShowSparkle] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setShowSparkle(false), 1800);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (videoRef.current) {
      try { videoRef.current.playbackRate = 0.6; } catch {}
    }
  }, [backgroundVideoUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh] overflow-y-auto max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none">
        <article className="relative w-full">
          {/* Background */}
          <div className="relative h-[88vh] max-h-[820px] rounded-2xl overflow-hidden">
            {backgroundVideoUrl ? (
              <video
                ref={videoRef}
                src={backgroundVideoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImageUrl || backgroundImage})` }}
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 bg-black/70" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] uppercase tracking-wider">
              {/* Header */}
              <header className="w-full text-center">
                <img
                  src={logoUrl || partyLogo}
                  alt={`${appName} logo`}
                  className="h-20 sm:h-28 w-auto max-h-[30vh] drop-shadow-lg"
                  loading="eager"
                />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-white/90 mt-1 text-sm sm:text-base">{subtitle}</p>
                )}
              </header>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Checklist + Buttons */}
              <div className="w-full max-w-sm space-y-3 mt-2 mb-0">
                {/* Auto-shrinking checklist area */}
                <div className="w-full mx-auto mb-2">
                  <div className="flex flex-col items-center gap-1 max-h-[20vh] overflow-hidden">
                    {(checklistItems?.filter(Boolean).slice(0, 5) || defaultChecklist).map((item, idx, arr) => (
                      <React.Fragment key={idx}>
                        <p className="text-white/90 text-[clamp(10px,2.8vw,14px)] font-semibold leading-tight">
                          {item}
                        </p>
                        {idx < arr.length - 1 && <span className="text-white/60" aria-hidden="true">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Buttons grid (2-wide on mobile) */}
                <div className="grid grid-cols-2 gap-2">
                  {buttons.map((b, i) => (
                    <Button
                      key={`${b.text}-${i}`}
                      size="lg"
                      className={`h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                      style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                      onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                    >
                      {b.text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default MultiCTACoverModal;
