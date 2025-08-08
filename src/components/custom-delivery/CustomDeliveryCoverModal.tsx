import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import discoBall from '@/assets/disco-ball.gif';
import lakeScene from '@/assets/patio-party-lake-travis.jpg';

interface CoverFeature {
  label: string;
}

export interface CustomDeliveryCoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartOrder?: () => void;
  appName: string;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  phone?: string; // e.g., 5125550123 or (512) 555-0123
  sms?: string;   // same as phone, will fallback to phone
  features?: CoverFeature[];
}

const defaultFeatures: CoverFeature[] = [
  { label: "On time" },
  { label: "Locally owned" },
  { label: "Cocktail kits" },
  { label: "Events" },
  { label: "Same‑day delivery" }
];

export const CustomDeliveryCoverModal: React.FC<CustomDeliveryCoverModalProps> = ({
  open,
  onOpenChange,
  onStartOrder,
  appName,
  logoUrl,
  title = "Concierge Delivery Service",
  subtitle = "Austin's favorite alcohol delivery service",
  phone = "5125550123",
  sms,
  features = defaultFeatures,
}) => {
  const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  const smsHref = `sms:${(sms || phone).replace(/[^0-9+]/g, '')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none">
        <article className="relative w-full">
          {/* Background layer */}
          <div className="relative h-[86vh] max-h-[760px] rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${lakeScene})` }} aria-hidden="true" />
            {/* Gradient + glass overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/70" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />

            {/* Decorative light sweep */}
            <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-2/3 bg-gradient-to-r from-transparent via-primary/25 to-transparent animate-slide-in-right" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between py-6 px-5">
              {/* Header: Logo + Title */}
              <header className="w-full text-center">
                <div className="mx-auto mb-3 h-10 w-auto flex items-center justify-center">
                  {/* Brand logo */}
                  <img
                    src={logoUrl || partyLogo}
                    alt={`${appName} logo - Party On Delivery`}
                    className="h-7 w-auto drop-shadow"
                    loading="eager"
                  />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground animate-fade-in">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '120ms' }}>
                  {subtitle}
                </p>
              </header>

              {/* Center visual: Disco ball */}
              <div className="relative mt-3 mb-2 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={discoBall}
                    alt="Animated disco ball with colorful light beam"
                    className="h-28 w-28 object-contain drop-shadow-lg animate-scale-in"
                  />
                  {/* Light cone */}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 mt-1 h-28 w-28 rounded-full bg-primary/15 blur-xl" aria-hidden="true" />
                </div>
              </div>

              {/* CTA buttons */}
              <div className="w-full space-y-2">
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-semibold shadow-lg"
                  onClick={() => {
                    onOpenChange(false);
                    onStartOrder?.();
                  }}
                >
                  Start Order
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <a href={telHref} className="block">
                    <Button variant="secondary" className="w-full h-11 font-medium">
                      Call
                    </Button>
                  </a>
                  <a href={smsHref} className="block">
                    <Button variant="outline" className="w-full h-11 font-medium">
                      Text
                    </Button>
                  </a>
                </div>
              </div>

              {/* Features footer */}
              <footer className="w-full pt-3">
                <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium">
                  {features.map((f, idx) => (
                    <li
                      key={idx}
                      className="rounded-full bg-background/70 px-3 py-1 text-foreground/90 shadow-sm backdrop-blur animate-fade-in"
                      style={{ animationDelay: `${180 + idx * 90}ms` }}
                    >
                      {f.label}
                    </li>
                  ))}
                </ul>
              </footer>
            </div>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDeliveryCoverModal;
