import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';
import { ImageOptimizer } from '@/utils/imageOptimizer';
// Removed imports for disabled preloading systems
// import { instantAppLoader } from '@/utils/instantAppLoader';
// import { preloadManager } from '@/utils/preloadManager';
import { getInstantProducts } from '@/utils/instantCacheClient';

export interface MultiCTAButton {
  text: string;
  onClick: () => void;
  bgColor?: string;
  textColor?: string;
  // Optional layout controls
  offsetY?: number; // extra margin-top in px
  spacingBelow?: number; // extra margin-bottom in px
  // Preloading
  appSlug?: string; // App slug for preloading
  collectionHandle?: string; // Collection handle for preloading
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
  // New layout/spacing controls
  buttonsBottomOffset?: number;
  buttonsSpacing?: number;
  checklistToButtonsOffset?: number;
  dotSpacing?: number;
  dotSize?: number;
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
  // New layout controls
  buttonsBottomOffset = 0,
  buttonsSpacing = 12,
  checklistToButtonsOffset = 30,
  dotSpacing = 8,
  dotSize = 14,
  logoBgColor,
  logoBgMode = 'auto',
}) => {
const [showSparkle, setShowSparkle] = React.useState(true);
const videoRef = React.useRef<HTMLVideoElement>(null);
const [showVideo, setShowVideo] = React.useState(false);
const fallbackSrc = backgroundVideoUrl ? backgroundImage : (backgroundImageUrl || backgroundImage);
// Generate sparkle field covering ~75% of screen
const [sparkles, setSparkles] = React.useState<Array<{ top: number; left: number; size: 'sm' | 'md' | 'lg'; delay: number; scale: number }>>([]);
React.useEffect(() => {
  const items = Array.from({ length: 60 }, () => ({
    top: Math.random() * 75, // cover top 75%
    left: Math.random() * 100,
    size: (Math.random() < 0.5 ? 'lg' : (Math.random() < 0.8 ? 'md' : 'sm')) as 'sm' | 'md' | 'lg',
    delay: Math.floor(Math.random() * 1000),
    scale: 1.4 + Math.random() * 1.1,
  }));
  setSparkles(items);
}, []);
React.useEffect(() => {
  const t = setTimeout(() => setShowSparkle(false), 3000);
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

// Preload delivery app data when modal opens
React.useEffect(() => {
  if (!open) return;

  // Disabled all preloading to prevent loading animations
  // const preloadApps = async () => {
  //   console.log('🚀 Preloading delivery apps from multi-CTA cover modal...');
  //   // Preload specific apps for each button
  //   for (const button of buttons) {
  //     if (button.appSlug) {
  //       try {
  //         await instantAppLoader.preloadApp(button.appSlug);
  //       } catch (error) {
  //         console.error(`Failed to preload app ${button.appSlug}:`, error);
  //       }
  //     }
  //   }
  // };
  // const timer = setTimeout(preloadApps, 100);
  // return () => clearTimeout(timer);
}, [open, buttons]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh] overflow-y-auto max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none animate-enter">
        <DialogTitle className="sr-only">{appName || title || "Delivery App"}</DialogTitle>
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

{/* Sparkle overlay covering ~75% of the screen for 3s */}
{showSparkle && (
  <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: '75%' }} aria-hidden="true">
    {sparkles.map((s, idx) => (
      <span
        key={idx}
        className={`sparkle sparkle-${s.size}`}
        style={{
          top: `${s.top}%`,
          left: `${s.left}%`,
          position: 'absolute',
          animationDelay: `${s.delay}ms`,
          animationDuration: '18s',
          transform: `scale(${s.scale})`,
          filter: 'brightness(1.7) drop-shadow(0 0 14px hsl(var(--primary)))',
          opacity: 0.95
        }}
      />
    ))}
  </div>
)}

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
  className="font-bold tracking-tight text-white mt-2 animate-fade-in"
  style={{ fontSize: titleSizeProp ? `${titleSizeProp}px` : 'clamp(24px,4vw,40px)', marginTop: (titleOffsetY || 0), animationDelay: '60ms', animationFillMode: 'both' }}
>
  {title}
</h1>
{subtitle && (
  <p
    className="text-white/90 mt-1 animate-fade-in"
    style={{ fontSize: subtitleSizeProp ? `${subtitleSizeProp}px` : 'clamp(14px,2.5vw,20px)', marginTop: (subtitleOffsetY || 0), animationDelay: '140ms', animationFillMode: 'both' }}
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
                  <div className="flex flex-col items-center">
                    {(checklistItems?.filter(Boolean).slice(0, 5) || defaultChecklist).map((item, idx, arr) => (
                      <React.Fragment key={idx}>
                        <p
                          className="text-white/90 font-semibold leading-tight animate-fade-in"
                          style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both', fontSize: checklistSizeProp ? `${checklistSizeProp}px` : 'clamp(12px,2.8vw,16px)', marginTop: (dotSpacing ?? 8) / 2, marginBottom: (dotSpacing ?? 8) / 2 }}
                        >
                          {item}
                        </p>
                        {idx < arr.length - 1 && (
                          <span className="text-white/60 animate-fade-in" style={{ animationDelay: `${idx * 80 + 40}ms`, animationFillMode: 'both', marginTop: (dotSpacing ?? 8) / 2, marginBottom: (dotSpacing ?? 8) / 2, fontSize: `${dotSize ?? 14}px` }} aria-hidden="true">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Adjustable gap between checklist and first button */}
                <div className="h-[30px]" aria-hidden="true" style={{ marginTop: (buttonsOffsetY || 0), height: (checklistToButtonsOffset ?? 30) }} />

                {/* Buttons layout: stack for 1-2, special layout for 3, grid for 4+ */}
                <div style={{ marginBottom: buttonsBottomOffset || 0 }}>
                  {buttons.length <= 2 ? (
                    <div className="flex flex-col" style={{ rowGap: buttonsSpacing || 12 }}>
                      {buttons.map((b, i) => (
                        <Button
                          key={`${b.text}-${i}`}
                          size="lg"
                          className={`w-full h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'} ${i % 2 === 0 ? 'animate-[pulse_1.9s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'animate-[pulse_2.6s_cubic-bezier(0.4,0,0.6,1)_infinite]'}`}
                          style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined, marginTop: (b as any).offsetY || 0, marginBottom: (b as any).spacingBelow || 0 }}
                          onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                        >
                          {b.text}
                        </Button>
                      ))}
                    </div>
                  ) : buttons.length === 3 ? (
                    <div className="flex flex-col" style={{ rowGap: buttonsSpacing || 12 }}>
                      <Button
                        key={`${buttons[0].text}-0`}
                        size="lg"
                        className={`w-full h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg ${buttons[0].bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'} animate-[pulse_1.9s_cubic-bezier(0.4,0,0.6,1)_infinite]`}
                        style={{ backgroundColor: buttons[0].bgColor || undefined, color: buttons[0].textColor || undefined, marginTop: (buttons[0] as any).offsetY || 0, marginBottom: (buttons[0] as any).spacingBelow || 0 }}
                        onClick={(e) => { e.stopPropagation(); buttons[0].onClick(); }}
                      >
                        {buttons[0].text}
                      </Button>
                      <div className="grid grid-cols-2" style={{ gap: buttonsSpacing || 12 }}>
                        {buttons.slice(1).map((b, i) => (
                          <Button
                            key={`${b.text}-${i + 1}`}
                            size="lg"
                            className={`h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'} ${i % 2 === 0 ? 'animate-[pulse_2.6s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'animate-[pulse_1.9s_cubic-bezier(0.4,0,0.6,1)_infinite]'}`}
                            style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined, marginTop: (b as any).offsetY || 0, marginBottom: (b as any).spacingBelow || 0 }}
                            onClick={(e) => { e.stopPropagation(); b.onClick(); }}
                          >
                            {b.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2" style={{ gap: buttonsSpacing || 12 }}>
                      {buttons.map((b, i) => (
                        <Button
                          key={`${b.text}-${i}`}
                          size="lg"
                          className={`h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'} ${i % 2 === 0 ? 'animate-[pulse_1.9s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'animate-[pulse_2.6s_cubic-bezier(0.4,0,0.6,1)_infinite]'}`}
                          style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined, marginTop: (b as any).offsetY || 0, marginBottom: (b as any).spacingBelow || 0 }}
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
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default MultiCTACoverModal;
