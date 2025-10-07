import React from 'react';
import { Button } from '@/components/ui/button';
import { PhoneFrameLayout } from '@/components/layout/PhoneFrameLayout';
import partyLogo from '@/assets/party-on-delivery-logo.svg';
import backgroundImage from '@/assets/old-fashioned-bg.jpg';

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
  titleFont?: string;
  subtitleFont?: string;
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
  titleFont,
  subtitleFont,
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

  // Track viewport height for responsive spacing
  const [viewportHeight, setViewportHeight] = React.useState(window.innerHeight);
  
  React.useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation state
  const [animationsStarted, setAnimationsStarted] = React.useState(!entranceAnimation);
  
  // Start animations on mount if enabled
  React.useEffect(() => {
    if (entranceAnimation) {
      const timer = setTimeout(() => {
        setAnimationsStarted(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [entranceAnimation]);

  // Calculate staggered delays for sequential animation
  const getAnimationDelay = (index: number) => {
    if (!entranceAnimation || animationsStarted) return 0;
    const delayPerElement = Math.max(animationDuration / 6, 200);
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

  return (
    <div 
      className="w-full h-full"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        overscrollBehavior: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
        height: '100%'
      } as React.CSSProperties}
    >
      {/* Background - Concierge Aesthetic */}
      <div 
        className="relative h-full overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600" 
        style={{ 
          touchAction: 'none',
          overscrollBehavior: 'none',
          height: '100%'
        } as React.CSSProperties}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Optional custom background image/video overlay */}
        {(backgroundImageUrl || backgroundVideoUrl) && (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${fallbackSrc})` }}
              aria-hidden="true"
            />
            {backgroundVideoUrl && showVideo && (
              <video
                ref={videoRef}
                src={backgroundVideoUrl}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
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
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Content Container - Flexbox layout with proper spacing */}
        <div 
          className="relative z-10 flex flex-col h-full px-4 py-4"
          style={{ 
            touchAction: 'none',
            userSelect: 'none',
            overscrollBehavior: 'none',
            height: '100%',
            overflow: 'hidden'
          } as React.CSSProperties}
        >
          
          {/* Logo Section - Top */}
          <div 
            className={`flex-none text-center transition-all duration-700 ${getAnimationClass(0)}`}
            style={{ 
              marginBottom: '8px',
              animationDelay: `${getAnimationDelay(0)}ms`,
              transform: logoOffsetY ? `translateY(${logoOffsetY}px)` : undefined
            }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="mx-auto object-contain filter drop-shadow-lg hover:scale-110 transition-transform duration-300"
                style={{ 
                  height: `${logoHeight || 50}px`,
                  width: 'auto',
                  maxWidth: '100px',
                  maxHeight: `${logoHeight || 50}px`
                }}
              />
            ) : (
              <div 
                className="relative rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center filter drop-shadow-lg mx-auto"
                style={{ 
                  height: `${logoHeight || 50}px`,
                  width: `${logoHeight || 50}px`,
                  maxWidth: '100px',
                  maxHeight: `${logoHeight || 50}px`
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

          {/* Title & Subtitle Section */}
          <div 
            className={`flex-none text-center transition-all duration-700 ${getAnimationClass(1)}`}
            style={{ 
              marginBottom: '12px',
              animationDelay: `${getAnimationDelay(1)}ms`,
              transform: titleOffsetY ? `translateY(${titleOffsetY}px)` : undefined
            }}
          >
            <h1 
              className="font-bold mb-1.5 px-3 leading-tight text-white drop-shadow-2xl"
              style={{ 
                fontSize: titleSizeProp ? `${titleSizeProp}px` : '26px',
                fontFamily: titleFont || 'system-ui',
                textShadow: '0 0 40px rgba(255, 255, 255, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              {title}
            </h1>
            
            {subtitle && (
              <div 
                className={`transition-all duration-700 ${getAnimationClass(2)}`}
                style={{ 
                  animationDelay: `${getAnimationDelay(2)}ms`,
                  transform: subtitleOffsetY ? `translateY(${subtitleOffsetY}px)` : undefined
                }}
              >
                <p 
                  className="text-white/90 px-3 leading-snug"
                  style={{ 
                    fontSize: subtitleSizeProp ? `${subtitleSizeProp}px` : '15px',
                    fontFamily: subtitleFont || 'system-ui',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* Features/Checklist Section */}
          {checklistItems && checklistItems.length > 0 && (
            <div 
              className={`flex-none transition-all duration-700 ${getAnimationClass(3)}`}
              style={{ 
                marginBottom: '12px',
                animationDelay: `${getAnimationDelay(3)}ms`,
                transform: checklistOffsetY ? `translateY(${checklistOffsetY}px)` : undefined
              }}
            >
              <div className="w-full max-w-xs mx-auto">
                <div className="space-y-1.5">
                  {checklistItems.filter(Boolean).slice(0, 3).map((item, index) => (
                    <div 
                      key={index} 
                      className={`bg-white/20 backdrop-blur-md rounded-xl p-2.5 border border-white/30 shadow-lg transition-all duration-700 hover:bg-white/25 ${getAnimationClass(3)}`}
                      style={{ 
                        animationDelay: `${getAnimationDelay(3) + (index * 100)}ms`
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg mr-2.5 flex-shrink-0">
                          <svg className="w-3 h-3 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 
                          className="font-semibold text-white leading-tight"
                          style={{ 
                            fontSize: checklistSizeProp ? `${checklistSizeProp}px` : '14px',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {item}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Flexible spacer to push buttons to bottom - responsive to viewport height */}
          <div 
            className="flex-grow" 
            style={{ 
              minHeight: '8px',
              // On small mobile screens (< 700px height), cap the spacer to ensure buttons stay visible
              // On larger screens (desktop/tablet), allow unlimited growth
              maxHeight: viewportHeight < 700 ? '40px' : 'none'
            }} 
          />

          {/* Buttons Section - Anchored to bottom with padding */}
          <div 
            className={`flex-none pb-4 transition-all duration-700 ${getAnimationClass(4)}`}
            style={{ 
              animationDelay: `${getAnimationDelay(4)}ms`,
              transform: buttonsOffsetY ? `translateY(${buttonsOffsetY}px)` : undefined
            }}
          >
            <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
              {buttons && buttons.length > 0 && buttons.slice(0, 2).map((button, index) => (
                <button
                  key={`${button.text}-${index}`}
                  onClick={(e) => { e.stopPropagation(); button.onClick?.(); }}
                  className="w-full text-base font-bold h-12 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-pink-500/50 bg-white text-purple-700 border-2 border-white/50"
                  style={{
                    backgroundColor: button.bgColor && button.bgColor !== 'primary' ? button.bgColor : undefined,
                    color: button.textColor || undefined,
                    boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
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