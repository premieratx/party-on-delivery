import React from 'react';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';
// Removed imports for disabled preloading systems
// import { instantAppLoader } from '@/utils/instantAppLoader';
// import { preloadManager } from '@/utils/preloadManager';
import { getInstantProducts } from '@/utils/instantCacheClient';

export interface CoverStartButton {
  text: string;
  onClick?: () => void;
  bgColor?: string;
  textColor?: string;
  appSlug?: string; // App slug for preloading
  collectionHandle?: string; // Collection handle for preloading
}

export interface CoverStartScreenProps {
  appName?: string;
  logoUrl?: string;
  logoHeight?: number;
  title?: string;
  subtitle?: string;
  checklistItems?: string[];
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  buttons: CoverStartButton[];
  titleSize?: number;
  subtitleSize?: number;
  checklistSize?: number;
  backgroundColor?: string;
  titleOffsetY?: number;
  subtitleOffsetY?: number;
  checklistOffsetY?: number;
  buttonsOffsetY?: number;
  logoOffsetY?: number;
  logoBgColor?: string;
  logoBgMode?: 'auto' | 'rectangle' | 'none';
}

// No default checklist - must be provided via props

export const CoverStartScreen: React.FC<CoverStartScreenProps> = ({
  appName,
  logoUrl,
  logoHeight,
  title,
  subtitle,
  checklistItems,
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
  logoOffsetY,
  logoBgColor,
  logoBgMode = 'auto',
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = React.useState(false);
  const fallbackSrc = backgroundVideoUrl ? backgroundImage : (backgroundImageUrl || backgroundImage);

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

  // Preload delivery app data for all buttons
  React.useEffect(() => {
    // Disabled all preloading to prevent loading animations
    // const preloadApps = async () => {
    //   console.log('🚀 Preloading delivery apps from cover screen...');
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
  }, [buttons]);

  return (
    <article className="relative w-full">
      {/* Background */}
      <div className="relative h-full rounded-2xl overflow-hidden" style={{ backgroundColor: backgroundColor || undefined }}>
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

        {/* Content - Improved Responsive and Centered Layout */}
        <div className="relative z-10 flex h-full flex-col justify-center items-center px-4 sm:px-6 py-6">
          
          {/* Top Section: Logo and Title - Centered */}
          <div className="text-center flex flex-col items-center flex-shrink-0 w-full max-w-4xl">
            {/* Logo with better responsive handling */}
            <div className="mb-6 sm:mb-8" style={{ marginTop: (logoOffsetY || 0) }}>
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
                  className="relative w-auto object-contain drop-shadow-lg mx-auto"
                  style={{ 
                    height: Math.min(
                      (typeof (logoHeight as number | undefined) === 'number' ? (logoHeight as number) : 160),
                      window.innerHeight * 0.15
                    ), 
                    maxHeight: '160px' 
                  }}
                  loading="eager"
                />
              </div>
            </div>

            {/* Title with responsive sizing */}
            <h1
              className="font-bold tracking-tight text-white mb-4 px-2 leading-tight"
              style={{ 
                fontSize: titleSizeProp ? `${Math.min(titleSizeProp, window.innerWidth < 640 ? 32 : titleSizeProp)}px` : 'clamp(24px,4vw,40px)', 
                marginTop: (titleOffsetY || 0) 
              }}
            >
              {title}
            </h1>

            {/* Subtitle with responsive sizing */}
            {subtitle && (
              <p
                className="text-white/90 mb-6 sm:mb-8 px-2 leading-relaxed"
                style={{ 
                  fontSize: subtitleSizeProp ? `${Math.min(subtitleSizeProp, window.innerWidth < 640 ? 16 : subtitleSizeProp)}px` : 'clamp(14px,2.5vw,20px)', 
                  marginTop: (subtitleOffsetY || 0) 
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Middle Section: Checklist - Responsive with scroll */}
          {checklistItems && checklistItems.length > 0 && (
            <div 
              className="w-full max-w-4xl mx-auto flex-1 overflow-y-auto px-2 my-4"
              style={{ marginTop: (checklistOffsetY || 0) }}
            >
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {checklistItems.filter(Boolean).slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 text-left bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 animate-fade-in"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span 
                      className="text-white font-medium flex-1"
                      style={{ 
                        fontSize: checklistSizeProp ? `${Math.min(checklistSizeProp, window.innerWidth < 640 ? 14 : checklistSizeProp)}px` : 'clamp(12px,2.8vw,16px)',
                        lineHeight: '1.4'
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Section: Buttons - Always visible and centered */}
          <div 
            className="w-full max-w-lg mx-auto flex-shrink-0 pb-safe"
            style={{ marginTop: (buttonsOffsetY || 0) }}
          >
            {/* Responsive Button Layout */}
            {buttons.length <= 2 ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                {buttons.map((b, i) => (
                  <Button
                    key={`${b.text}-${i}`}
                    size="lg"
                    className={`w-full h-12 sm:h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                    style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                    onClick={(e) => { e.stopPropagation(); b.onClick?.(); }}
                  >
                    {b.text}
                  </Button>
                ))}
              </div>
            ) : buttons.length === 3 ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                <Button
                  key={`${buttons[0].text}-0`}
                  size="lg"
                  className={`w-full h-12 sm:h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${buttons[0].bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                  style={{ backgroundColor: buttons[0].bgColor || undefined, color: buttons[0].textColor || undefined }}
                  onClick={(e) => { e.stopPropagation(); buttons[0].onClick?.(); }}
                >
                  {buttons[0].text}
                </Button>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {buttons.slice(1).map((b, i) => (
                    <Button
                      key={`${b.text}-${i + 1}`}
                      size="lg"
                      className={`h-12 sm:h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                      style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                      onClick={(e) => { e.stopPropagation(); b.onClick?.(); }}
                    >
                      {b.text}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {buttons.map((b, i) => (
                  <Button
                    key={`${b.text}-${i}`}
                    size="lg"
                    className={`h-12 sm:h-11 rounded-full text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${b.bgColor ? '' : 'bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90'}`}
                    style={{ backgroundColor: b.bgColor || undefined, color: b.textColor || undefined }}
                    onClick={(e) => { e.stopPropagation(); b.onClick?.(); }}
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
  );
};

export default CoverStartScreen;
