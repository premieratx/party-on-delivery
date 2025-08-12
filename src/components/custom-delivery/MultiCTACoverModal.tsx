import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';
import { ImageOptimizer } from '@/utils/imageOptimizer';

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
  logoHeight?: number; // px height control for logo
  title?: string;
  subtitle?: string;
  checklistItems?: string[];
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  buttons: MultiCTAButton[];
  titleSize?: number;
  subtitleSize?: number;
  checklistSize?: number;
  // New styling controls
  backgroundColor?: string;
  titleOffsetY?: number;
  subtitleOffsetY?: number;
  checklistOffsetY?: number;
  buttonsOffsetY?: number;
  logoBgColor?: string;
  logoBgMode?: 'auto' | 'rectangle' | 'none';
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
  logoHeight,
  title = 'Exclusive Concierge Delivery',
  subtitle = "Austin's favorite alcohol delivery service",
  checklistItems = defaultChecklist,
  backgroundImageUrl,
  backgroundVideoUrl,
  buttons,
  titleSize: titleSizeProp,
  subtitleSize: subtitleSizeProp,
  checklistSize: checklistSizeProp,
  backgroundColor,
  titleOffsetY,
  subtitleOffsetY,
  checklistOffsetY,
  buttonsOffsetY,
  logoBgColor,
  logoBgMode = 'auto',
}) => {
  const [showSparkle, setShowSparkle] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = React.useState(false);
  const fallbackSrc = backgroundVideoUrl ? backgroundImage : (backgroundImageUrl || backgroundImage);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSparkle(false), 1800);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (videoRef.current) {
      try { videoRef.current.playbackRate = 0.6; } catch {}
    }
    if (backgroundVideoUrl) {
      setShowVideo(true);
      try { videoRef.current?.play(); } catch {}
    } else {
      setShowVideo(false);
    }
  }, [backgroundVideoUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh] overflow-y-auto max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none animate-enter">
        <article className="relative w-full">
          {/* Background */}
          <div className="relative h-[88vh] max-h-[820px] rounded-2xl overflow-hidden" style={{ backgroundColor: backgroundColor || undefined }}>
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${fallbackSrc})` }}
                aria-hidden="true"
              />
              {backgroundVideoUrl && showVideo && (
                <video
                  ref={videoRef}
                  src={backgroundVideoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  preload="metadata"
                  poster={fallbackSrc}
                  onCanPlay={() => setShowVideo(true)}
                  onLoadedData={() => {
                    try { videoRef.current?.play(); } catch {}
                    setShowVideo(true);
                  }}
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black/70" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] uppercase tracking-wider">
              <header className="w-full text-center my-5">
                <div className="relative inline-block mx-auto">
                  {logoBgColor && logoBgMode !== 'none' && (
                    logoBgMode === 'rectangle' ? (
                      <div
                        className="absolute inset-0 -m-1 rounded-md"
                        style={{ backgroundColor: logoBgColor, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: logoBgColor,
                          WebkitMaskImage: `url(${logoUrl || partyLogo})`,
                          maskImage: `url(${logoUrl || partyLogo})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                        }}
                        aria-hidden="true"
                      />
                    )
                  )}
                  <img
                    src={logoUrl || partyLogo}
                    alt={`${appName} logo`}
                    className="relative w-auto max-h-[30vh] drop-shadow-lg mx-auto"
                    style={{ height: (typeof (logoHeight as number | undefined) === 'number' ? (logoHeight as number) : 160) }}
                    loading="eager"
                  />
                </div>
                <h1
                  className="font-bold tracking-tight text-white mt-2"
                  style={{ fontSize: titleSizeProp ? `${titleSizeProp}px` : 'clamp(24px,4vw,40px)', marginTop: (titleOffsetY || 0) }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className="text-white/90 mt-1"
                    style={{ fontSize: subtitleSizeProp ? `${subtitleSizeProp}px` : 'clamp(14px,2.5vw,20px)', marginTop: (subtitleOffsetY || 0) }}
                  >
                    {subtitle}
                  </p>
                )}
              </header>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Checklist + Buttons */}
              <div className="w-full max-w-sm mt-2 mb-0">
                {/* Auto-shrinking checklist area */}
                <div className="w-full mx-auto my-5" style={{ marginTop: (checklistOffsetY || 0) }}>
                  <div className="flex flex-col items-center gap-1 max-h-[20vh] overflow-hidden">
                    {(checklistItems?.filter(Boolean).slice(0, 5) || defaultChecklist).map((item, idx, arr) => (
                      <React.Fragment key={idx}>
                        <p
                          className="text-white/90 font-semibold leading-tight animate-fade-in my-5"
                          style={{ animationDelay: `${idx * 80}ms`, fontSize: checklistSizeProp ? `${checklistSizeProp}px` : 'clamp(12px,2.8vw,16px)' }}
                        >
                          {item}
                        </p>
                        {idx < arr.length - 1 && (
                          <span className="text-white/60 animate-fade-in" style={{ animationDelay: `${idx * 80 + 40}ms` }} aria-hidden="true">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Minimum 100px gap between checklist and first button */}
                <div className="min-h-[100px]" aria-hidden="true" style={{ marginTop: (buttonsOffsetY || 0) }} />

                {/* Buttons layout: stack for 1-2, special layout for 3, grid for 4+ */}
                {buttons.length <= 2 ? (
                  <div className="flex flex-col gap-3">
                    {buttons.map((b, i) => (
                      <Button
                        key={`${b.text}-${i}`}
                        size="lg"
                        className={`w-full h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg my-5 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                        style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                        onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                      >
                        {b.text}
                      </Button>
                    ))}
                  </div>
                ) : buttons.length === 3 ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      key={`${buttons[0].text}-0`}
                      size="lg"
                      className={`w-full h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg my-5 ${buttons[0].bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                      style={{ backgroundColor: buttons[0].bgColor || undefined, color: buttons[0].textColor || undefined }}
                      onClick={(e) => { e.stopPropagation(); buttons[0].onClick(); }}
                    >
                      {buttons[0].text}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      {buttons.slice(1).map((b, i) => (
                        <Button
                          key={`${b.text}-${i + 1}`}
                          size="lg"
                          className={`h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg my-5 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                          style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                          onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                        >
                          {b.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {buttons.map((b, i) => (
                      <Button
                        key={`${b.text}-${i}`}
                        size="lg"
                        className={`h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg my-5 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                        style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                        onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                      >
                        {b.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default MultiCTACoverModal;
