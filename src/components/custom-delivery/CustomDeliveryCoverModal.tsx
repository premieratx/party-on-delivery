import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';
import discoBall from '@/assets/disco-ball.gif';

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
}) => {
  const [showSparkle, setShowSparkle] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSparkle(false), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none">
        <article className="relative w-full">
          {/* Background */}
          <div className="relative h-[88vh] max-h-[820px] rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImageUrl || backgroundImage})` }}
              aria-hidden="true"
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-black/70" />
            {/* Light sweep overlay */}
            {/* Disco sparkle only; sweep removed for performance */}

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between py-6 px-6">
              {/* Top: Logo + Headings (Bloom-style) */}
              <header className="w-full text-center">
                <div className="mx-auto mb-3 relative inline-flex items-center justify-center">
                  <img
                    src={logoUrl || partyLogo}
                    alt={`${appName} logo`}
                    className="h-44 w-auto max-h-[32vh] drop-shadow-lg animate-[fade-in_0.625s_ease-out]"
                    loading="eager"
                  />
                </div>
                {showSparkle && (
                  <img
                    src={discoBall}
                    alt="Disco ball sparkle animation"
                    className="mx-auto mb-2 h-14 w-14 animate-[fade-in_0.3s_ease-out] drop-shadow"
                    aria-hidden="true"
                  />
                )}
                <h1 className="text-4xl font-bold tracking-tight text-white animate-[fade-in_0.625s_ease-out]" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                  {title || appName}
                </h1>
                <p className="mt-2 text-white/80 text-lg animate-[fade-in_0.625s_ease-out]" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                  {subtitle}
                </p>
              </header>

              {/* Middle: Centered text rows with separators */}
              <div className="flex-1 w-full max-w-sm flex items-center">
                <div className="w-full mt-4 space-y-2">
                  {checklistItems.filter(Boolean).slice(0, 5).map((item, idx, arr) => (
                    <React.Fragment key={idx}>
                      <p
                        className="text-center text-white text-xl md:text-2xl leading-tight animate-[fade-in_0.5s_ease-out]"
                        style={{ animationDelay: `${220 + idx * 120}ms`, animationFillMode: 'both' }}
                      >
                        {item}
                      </p>
                      {idx < arr.length - 1 && (
                        <div className="mx-auto h-2.5 w-2.5 rounded-full bg-white/90" aria-hidden="true" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom: Buttons (Bloom-style) */}
              <div className="w-full max-w-sm space-y-3 mt-6 mb-2">
                <Button
                  size="lg"
                  className="w-full h-12 rounded-full text-base font-semibold shadow-lg bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90"
                  onClick={() => {
                    onOpenChange(false);
                    onStartOrder?.();
                  }}
                >
                  {buttonText}
                </Button>

                <Button
                  size="lg"
                  className="w-full h-12 rounded-full text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    onOpenChange(false);
                    onSecondaryAction?.();
                  }}
                >
                  {secondaryButtonText}
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
