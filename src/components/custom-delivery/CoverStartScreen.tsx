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
  // NEW: Entrance Animation Props
  entranceAnimation?: boolean;
  animationDuration?: number;
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
  // NEW: Animation props
  entranceAnimation = false,
  animationDuration = 2000,
}) => {
  console.log('🎯 CoverStartScreen received checklistItems:', checklistItems);
  console.log('🎯 CoverStartScreen checklistItems type:', typeof checklistItems);
  console.log('🎯 CoverStartScreen checklistItems length:', checklistItems?.length);
  console.log('🎬 Entrance animation enabled:', entranceAnimation);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = React.useState(false);
  const fallbackSrc = backgroundVideoUrl ? backgroundImage : (backgroundImageUrl || backgroundImage);

  // Animation state
  const [animationsStarted, setAnimationsStarted] = React.useState(!entranceAnimation);
  
  // Start animations on mount if enabled
  React.useEffect(() => {
    if (entranceAnimation) {
      const timer = setTimeout(() => {
        setAnimationsStarted(true);
      }, 300); // Small delay to ensure proper rendering
      return () => clearTimeout(timer);
    }
  }, [entranceAnimation]);

  // Calculate staggered delays for sequential animation
  const getAnimationDelay = (index: number) => {
    if (!entranceAnimation || animationsStarted) return 0;
    const delayPerElement = Math.max(animationDuration / 6, 200); // At least 200ms per element
    return index * delayPerElement;
  };

  const getAnimationClass = (index: number) => {
    if (!entranceAnimation) return '';
    return animationsStarted 
      ? `animate-fade-in` 
      : 'opacity-0 translate-y-4';
  };

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

        {/* Content - Fixed Phone Layout with proper mobile spacing */}
        <div className="relative z-10 flex h-full flex-col items-center px-4 py-8 justify-center space-y-4">
          
          {/* Logo Section */}
          <div 
            className={`flex-shrink-0 text-center transition-all duration-700 ${getAnimationClass(0)}`}
            style={{ 
              transform: `translateY(${logoOffsetY || 0}px)`,
              animationDelay: `${getAnimationDelay(0)}ms`
            }}
          >
            <div className="mb-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="mx-auto object-contain filter drop-shadow-lg hover:scale-110 transition-transform duration-300"
                  style={{ 
                    height: `${Math.min(logoHeight || 60, 60)}px`,
                    width: 'auto',
                    maxWidth: '60px',
                    maxHeight: '60px'
                  }}
                />
              ) : (
                /* Logo Placeholder Circle */
                <div 
                  className="relative rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center filter drop-shadow-lg mx-auto"
                  style={{ 
                    height: `${Math.min(logoHeight || 60, 60)}px`,
                    width: `${Math.min(logoHeight || 60, 60)}px`,
                    maxWidth: '60px',
                    maxHeight: '60px'
                  }}
                >
                  <svg 
                    className="text-white/60" 
                    width="50%" 
                    height="50%" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Title Section */}
          <div 
            className={`text-center transition-all duration-700 ${getAnimationClass(1)}`}
            style={{ 
              transform: `translateY(${titleOffsetY || 0}px)`,
              animationDelay: `${getAnimationDelay(1)}ms`
            }}
          >
            <h1 
              className="font-bold mb-2 px-3 leading-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl"
              style={{ 
                fontSize: titleSizeProp ? `${Math.min(titleSizeProp, 24)}px` : '24px'
              }}
            >
              {title}
            </h1>
            
            {/* Subtitle */}
            {subtitle && (
              <div 
                className={`transition-all duration-700 ${getAnimationClass(2)}`}
                style={{ 
                  transform: `translateY(${subtitleOffsetY || 0}px)`,
                  animationDelay: `${getAnimationDelay(2)}ms`
                }}
              >
                <p 
                  className="text-white/80 mb-3 px-3 leading-relaxed"
                  style={{ fontSize: subtitleSizeProp ? `${Math.min(subtitleSizeProp, 14)}px` : '14px' }}
                >
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* Features Section */}
          {checklistItems && checklistItems.length > 0 && (
            <div 
              className={`w-full max-w-xs flex-shrink-0 transition-all duration-700 ${getAnimationClass(3)}`}
              style={{ 
                transform: `translateY(${checklistOffsetY || 0}px)`,
                animationDelay: `${getAnimationDelay(3)}ms`
              }}
            >
              <div className="space-y-2">
                {checklistItems.filter(Boolean).slice(0, 3).map((item, index) => (
                  <div 
                    key={index} 
                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20 transition-all duration-700 ${getAnimationClass(3)}`}
                    style={{ 
                      animationDelay: `${getAnimationDelay(3) + (index * 100)}ms`
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg mr-3">
                        <svg className="w-3 h-3 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-white">{item}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons Section */}
            <div 
            className={`w-full max-w-xs flex-shrink-0 transition-all duration-700 ${getAnimationClass(4)}`}
            style={{ 
              transform: `translateY(${buttonsOffsetY || 0}px)`,
              animationDelay: `${getAnimationDelay(4)}ms`
            }}
          >
            <div className="flex flex-col gap-2.5">
              {buttons.slice(0, 2).map((button, index) => (
                <button
                  key={`${button.text}-${index}`}
                  onClick={(e) => { e.stopPropagation(); button.onClick?.(); }}
                  className={`w-full text-sm font-semibold h-11 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white border border-blue-400/40 ${getAnimationClass(4)}`}
                  style={{
                    backgroundColor: button.bgColor && button.bgColor !== 'primary' ? button.bgColor : undefined,
                    color: button.textColor || '#FFFFFF',
                    animationDelay: `${getAnimationDelay(4) + (index * 150)}ms`
                  }}
                >
                  <span className="relative z-10">{button.text}</span>
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
