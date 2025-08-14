import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';
import { ImageOptimizer } from '@/utils/imageOptimizer';
import { haptic } from '@/utils/hapticFeedback';
import { instantAppLoader } from '@/utils/instantAppLoader';
import { preloadManager } from '@/utils/preloadManager';
import { getInstantProducts } from '@/utils/instantCacheClient';


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
  checklistSpacing?: number;
  // Preloading props
  appSlug?: string; // App slug for preloading
  secondaryAppSlug?: string; // Secondary app slug for preloading
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
  checklistSpacing = 8,
  appSlug,
  secondaryAppSlug,
}) => {
  const [showSparkle, setShowSparkle] = React.useState(true);
  const [enablePulse, setEnablePulse] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = React.useState(false);
  const fallbackSrc = backgroundVideoUrl ? backgroundImage : (backgroundImageUrl || backgroundImage);
  const optimizedFallback = ImageOptimizer.optimizeShopifyImageUrl(fallbackSrc, 800, 80);
  // Generate a denser, brighter sparkle field for full-screen coverage
  const [sparkles, setSparkles] = React.useState<Array<{ top: number; left: number; size: 'sm' | 'md' | 'lg'; delay: number; scale: number }>>([]);
  React.useEffect(() => {
    const items = Array.from({ length: 80 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: (Math.random() < 0.5 ? 'lg' : (Math.random() < 0.8 ? 'md' : 'sm')) as 'sm' | 'md' | 'lg',
      delay: Math.floor(Math.random() * 1200),
      scale: 1.6 + Math.random() * 1.2,
    }));
    setSparkles(items);
  }, []);
  // control sparkle and CTA animations + haptic feedback
  React.useEffect(() => {
    // Trigger haptic feedback when cover loads
    if (open) {
      haptic.vibrate(50);
    }
    
    const t = setTimeout(() => setShowSparkle(false), 2000);
    const p = setTimeout(() => setEnablePulse(true), 1000); // start pulse after initial sequence
    return () => {
      clearTimeout(t);
      clearTimeout(p);
    };
  }, [open]);

  // slow-motion playback for background video
  React.useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = 0.6;
      } catch {}
    }
  }, [backgroundVideoUrl]);

  // Preload fallback image aggressively for instant paint
  React.useEffect(() => {
    if (!fallbackSrc) return;
    // JS preload
    ImageOptimizer.preloadImage(fallbackSrc).catch(() => {});
    // Resource hint
    const id = `preload-fallback-${fallbackSrc}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'preload';
      link.as = 'image';
      link.href = fallbackSrc;
      document.head.appendChild(link);
    }
  }, [fallbackSrc]);

  // Only switch to video after it is ready very quickly; otherwise keep static image
  React.useEffect(() => {
    let cancelled = false;
    if (!backgroundVideoUrl) {
      setShowVideo(false);
      return;
    }
    const testVideo = document.createElement('video');
    testVideo.preload = 'metadata';
    testVideo.src = backgroundVideoUrl;

    const ready = () => {
      if (!cancelled) setShowVideo(true);
    };

    testVideo.addEventListener('canplay', ready, { once: true });
    testVideo.addEventListener('canplaythrough', ready, { once: true });

    const to = setTimeout(() => {
      // If not ready within ~450ms, prefer instant fallback image
      if (!cancelled) setShowVideo(false);
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(to);
      testVideo.removeEventListener('canplay', ready);
      testVideo.removeEventListener('canplaythrough', ready);
    };
  }, [backgroundVideoUrl]);

  // Preload delivery app data when modal opens
  React.useEffect(() => {
    if (!open) return;

    // Disabled all preloading to prevent loading animations
    // const preloadApps = async () => {
    //   console.log('🚀 Preloading delivery apps from cover modal...');
    //   // Preload specific apps
    //   const appsToPreload = [appSlug, secondaryAppSlug].filter(Boolean);
    //   for (const slug of appsToPreload) {
    //     try {
    //       await instantAppLoader.preloadApp(slug);
    //     } catch (error) {
    //       console.error(`Failed to preload app ${slug}:`, error);
    //     }
    //   }
    // };
    // const timer = setTimeout(preloadApps, 100);
    // return () => clearTimeout(timer);
  }, [open, appSlug, secondaryAppSlug]);
  // Animation sequencing setup - faster timing (1/3 speed per line)
  const visibleChecklist = (checklistItems || []).filter(Boolean).slice(0, 5);
  const steps = Math.max(visibleChecklist.length - 1, 1);
  const perStep = visibleChecklist.length > 1 ? 0.33 : 0; // 1/3 second per line
  const logoDelay = 0;
  const titleDelay = 0.2;
  const subtitleDelay = 0.4;
  const listStartDelay = 0.6; // start list after subtitle begins
  const buttonDelay = listStartDelay + (visibleChecklist.length > 1 ? perStep * (visibleChecklist.length - 1) : 0) + 0.2;
  console.log('🎯 CustomDeliveryCoverModal rendering, open:', open, 'appName:', appName);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh] overflow-y-auto max-w-md w-[92vw] rounded-2xl border-none bg-transparent shadow-none">
        <DialogTitle className="sr-only">{appName || "Delivery App"}</DialogTitle>
        <DialogDescription className="sr-only">Cover page for {appName || "delivery app"}</DialogDescription>
         <article className="relative w-full" onClick={() => { onOpenChange(false); onStartOrder?.(); }}>
          {/* Background */}
          <div className="relative h-[88vh] max-h-[820px] rounded-2xl overflow-hidden">
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
                  style={{ objectPosition: '60% 50%' }}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  preload="metadata"
                  poster={fallbackSrc}
                  onLoadedMetadata={() => {
                    try {
                      if (videoRef.current) videoRef.current.currentTime = 0.5;
                    } catch {}
                  }}
                />
              )}
            </div>
            {/* Overlays */}
            <div className="absolute inset-0 bg-black/70" />
            {/* Glitter over top quarter on load */}
              {showSparkle && (
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {sparkles.map((s, idx) => (
                    <span
                      key={idx}
                      className={`sparkle sparkle-${s.size}`}
                      style={{
                        top: `${s.top}%`,
                        left: `${s.left}%`,
                        position: 'absolute',
                        animationDelay: `${s.delay}ms`,
                        animationDuration: '20s',
                        transform: `scale(${s.scale})`,
                        filter: 'brightness(1.7) drop-shadow(0 0 14px hsl(var(--primary)))',
                        opacity: 0.95
                      }}
                    />
                  ))}
                </div>
              )}

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] font-montserrat uppercase tracking-wider">
              {/* Top: Logo + Headings (Bloom-style) */}
              <header className="w-full text-center">
                <div className="mx-auto mb-3 relative inline-flex items-center justify-center">
                  <img
                    src={logoUrl || partyLogo}
                    alt={`${appName} logo`}
                    className="h-24 sm:h-32 md:h-44 w-auto max-h-[32vh] drop-shadow-lg animate-[fade-in_0.625s_ease-out]"
                    loading="eager"
                    style={{ animationDelay: `${logoDelay}s`, animationFillMode: 'both' }}
                  />
                  {showSparkle && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[fade-in_3s_ease-out]" aria-hidden="true" style={{ width: '600%', height: '600%' }}>
                      <span className="sparkle sparkle-sm" style={{ top: '12%', left: '22%', animationDelay: '120ms', animationDuration: '23s', transform: 'scale(2.2)', filter: 'brightness(1.8) drop-shadow(0 0 16px hsl(var(--primary)))' }} />
                      <span className="sparkle sparkle-md" style={{ top: '28%', left: '76%', animationDelay: '240ms', animationDuration: '23s', transform: 'scale(2.0)', filter: 'brightness(1.8) drop-shadow(0 0 16px hsl(var(--primary)))' }} />
                      <span className="sparkle sparkle-lg" style={{ top: '60%', left: '18%', animationDelay: '360ms', animationDuration: '23s', transform: 'scale(2.4)', filter: 'brightness(1.9) drop-shadow(0 0 18px hsl(var(--primary)))' }} />
                      <span className="sparkle sparkle-sm" style={{ top: '70%', left: '64%', animationDelay: '480ms', animationDuration: '23s', transform: 'scale(2.0)', filter: 'brightness(1.8) drop-shadow(0 0 16px hsl(var(--primary)))' }} />
                      <span className="sparkle sparkle-md" style={{ top: '38%', left: '40%', animationDelay: '600ms', animationDuration: '23s', transform: 'scale(2.1)', filter: 'brightness(1.8) drop-shadow(0 0 16px hsl(var(--primary)))' }} />
                      <span className="sparkle sparkle-sm" style={{ top: '15%', left: '55%', animationDelay: '720ms', animationDuration: '23s', transform: 'scale(2.2)', filter: 'brightness(1.8) drop-shadow(0 0 16px hsl(var(--primary)))' }} />
                    </div>
                  )}
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-tight text-white animate-[fade-in_0.625s_ease-out]"
                  style={{ animationDelay: `${titleDelay}s`, animationFillMode: 'both' }}
                >
                  {title || appName}
                </h1>
                {subtitle && (
                  <p
                    className="mt-1 text-sm sm:text-base text-white/90 animate-[fade-in_0.625s_ease-out]"
                    style={{ animationDelay: `${subtitleDelay}s`, animationFillMode: 'both' }}
                  >
                    {subtitle}
                  </p>
                )}
              </header>

              {/* Middle spacer to showcase video */}
              <div className="flex-1" />

              {/* Bottom: Checklist (flattened) + Buttons */}
              <div className="w-full max-w-sm space-y-3 mt-2 mb-0">
                {/* Restored vertical checklist with dot separators */}
                <div className="w-full mx-auto mb-2 translate-y-[-15%] md:translate-y-[-25%]">
                  <div className="flex flex-col items-center">
                    {visibleChecklist.map((item, idx) => {
                      const rowDelay = (listStartDelay + idx * perStep).toFixed(2);
                      return (
                        <React.Fragment key={idx}>
                          <p
                            className="text-white/90 text-xs md:text-sm font-semibold leading-tight animate-[fade-in_0.4s_ease-out]"
                            style={{
                              animationDelay: `${rowDelay}s`,
                              animationFillMode: 'both',
                              marginTop: (checklistSpacing ?? 8) / 2,
                              marginBottom: (checklistSpacing ?? 8) / 2
                            }}
                          >
                            {item}
                          </p>
                          {idx < visibleChecklist.length - 1 && (
                            <span
                              className="text-white/60 animate-[fade-in_0.4s_ease-out]"
                              aria-hidden="true"
                              style={{
                                animationDelay: `${rowDelay}s`,
                                animationFillMode: 'both',
                                marginTop: (checklistSpacing ?? 8) / 2,
                                marginBottom: (checklistSpacing ?? 8) / 2
                              }}
                            >
                              •
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="animate-[fade-in_0.625s_ease-out]"
                  style={{ animationDelay: `${buttonDelay}s`, animationFillMode: 'both' }}
                >
                  <Button
                    size="lg"
                    className={`w-full h-11 sm:h-12 rounded-full text-xl sm:text-2xl font-semibold shadow-lg bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90 ${enablePulse ? 'animate-[pulse_1.4375s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.vibrate(50); // Add haptic feedback
                      onOpenChange(false);
                      onStartOrder?.();
                    }}
                  >
                    {buttonText}
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDeliveryCoverModal;
