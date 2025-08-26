import React from 'react';
import { Button } from '@/components/ui/button';
import { PhoneFrameLayout } from '@/components/layout/PhoneFrameLayout';
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
    <div className="w-full h-full">
      {/* Background */}
      <div className="relative h-full overflow-hidden" style={{ backgroundColor: backgroundColor || undefined }}>
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

        {/* Content - Enhanced Figma Layout with Animations */}
        <div className="relative z-10 flex h-full flex-col items-center px-6 py-8" style={{ minHeight: '100vh' }}>
          
          {/* Logo with enhanced Figma styling */}
          {logoUrl && (
            <div 
              className="flex justify-center mb-6 cover-scale-in stagger-1"
              style={{ transform: `translateY(${logoOffsetY || 0}px)` }}
            >
              <div className="relative inline-block">
                {logoBgColor && logoBgMode !== 'none' && (
                  logoBgMode === 'rectangle' ? (
                    <div
                      className="absolute inset-0 -m-2 rounded-xl shadow-lg"
                      style={{ backgroundColor: logoBgColor, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: logoBgColor,
                        WebkitMaskImage: `url(${logoUrl})`,
                        maskImage: `url(${logoUrl})`,
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
                  src={logoUrl} 
                  alt="Logo" 
                  className="relative w-20 h-20 object-contain filter drop-shadow-lg hover:scale-110 transition-transform duration-300"
                  style={{ height: `${logoHeight || 80}px` }}
                />
              </div>
            </div>
          )}

          {/* Title with gradient and glow effects from Figma */}
          <div 
            className="text-center mb-4 cover-fade-in stagger-2"
            style={{ transform: `translateY(${titleOffsetY || 0}px)` }}
          >
            <h1 
              className="font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl animate-pulse"
              style={{ 
                fontSize: titleSizeProp ? `${titleSizeProp}px` : '28px',
                textShadow: '0 0 30px rgba(59,130,246,0.6), 0 0 60px rgba(59,130,246,0.4), 0 4px 8px rgba(0,0,0,0.8)',
                lineHeight: '1.2'
              }}
            >
              {title}
            </h1>
          </div>

          {/* Subtitle with enhanced styling */}
          {subtitle && (
            <div 
              className="text-center mb-8 cover-fade-in stagger-3"
              style={{ transform: `translateY(${subtitleOffsetY || 0}px)` }}
            >
              <p 
                className="text-gray-200 leading-relaxed font-medium px-6"
                style={{ 
                  fontSize: subtitleSizeProp ? `${subtitleSizeProp}px` : '15px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  lineHeight: '1.4'
                }}
              >
                {subtitle}
              </p>
            </div>
          )}

          {/* Checklist with enhanced animations and Figma styling */}
          {checklistItems && checklistItems.length > 0 && (
            <div 
              className="w-full flex-1 px-2 my-6"
              style={{ transform: `translateY(${checklistOffsetY || 0}px)` }}
            >
              <div className="space-y-3">
                {checklistItems.filter(Boolean).slice(0, 6).map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 cover-fade-in stagger-${Math.min(index + 4, 5)} group bg-white/10 backdrop-blur-sm rounded-lg p-3`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-3 h-3 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span 
                      className="text-gray-100 font-medium group-hover:text-white transition-colors duration-200 flex-1"
                      style={{ 
                        fontSize: checklistSizeProp ? `${checklistSizeProp}px` : '14px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
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

          {/* Action buttons with enhanced Figma styling and animations */}
          <div 
            className="w-full flex-shrink-0 mt-auto pb-4"
            style={{ transform: `translateY(${buttonsOffsetY || 0}px)` }}
          >
            <div className="flex flex-col gap-3">
              {buttons.slice(0, 3).map((button, index) => (
                <button
                  key={`${button.text}-${index}`}
                  onClick={(e) => { e.stopPropagation(); button.onClick?.(); }}
                  className={`
                    w-full h-12 rounded-2xl font-semibold text-base transition-all duration-300
                    transform hover:scale-[1.02] hover:shadow-2xl active:scale-95
                    cover-scale-in stagger-${Math.min(index + 4, 5)}
                    relative overflow-hidden group
                    ${!button.bgColor || button.bgColor === 'primary'
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white shadow-[0_8px_32px_rgba(59,130,246,0.5)] border border-blue-400/40' 
                      : 'bg-white/10 text-white border-2 border-white/40 backdrop-blur-sm hover:bg-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.15)]'
                    }
                  `}
                  style={{
                    backgroundColor: button.bgColor && button.bgColor !== 'primary' ? button.bgColor : undefined,
                    color: button.textColor || undefined,
                    textShadow: (!button.bgColor || button.bgColor === 'primary') ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.7)',
                    boxShadow: (!button.bgColor || button.bgColor === 'primary')
                      ? '0 8px 32px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px rgba(59,130,246,0.3)' 
                      : '0 8px 32px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="relative z-10">{button.text}</span>
                  {(!button.bgColor || button.bgColor === 'primary') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverStartScreen;
