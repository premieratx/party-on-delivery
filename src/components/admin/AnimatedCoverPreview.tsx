import React, { useEffect, useState } from 'react';
import Draggable from 'react-draggable';

interface AnimatedCoverPreviewProps {
  title: string;
  subtitle: string;
  logoUrl?: string;
  bgImageUrl?: string;
  bgVideoUrl?: string;
  checklist: string[];
  buttons: Array<{
    text: string;
    type: string;
    style: 'filled' | 'outline';
    url?: string;
    app_slug?: string;
  }>;
  selectedTheme: string;
  activeDevice: string;
  dragMode: boolean;
  elementPositions: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
  }>;
  onElementDrag?: (id: string, position: { x: number; y: number }) => void;
  fullscreenPreview?: boolean;
  templateData?: any;
}

const COVER_THEMES = {
  gold: {
    name: 'Luxury Gold',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    primaryColor: '#F5B800',
    secondaryColor: '#FFD700',
    subtitleColor: 'rgba(255, 255, 255, 0.9)',
    buttonBg: 'linear-gradient(135deg, #F5B800, #FFD700)',
    buttonText: '#000000',
    buttonOutline: '#F5B800',
    buttonOutlineText: '#F5B800',
    glowColor: 'rgba(245, 184, 0, 0.4)',
    particles: true,
    waves: false
  },
  ocean: {
    name: 'Ocean Blue',
    background: 'linear-gradient(135deg, #001122 0%, #003355 50%, #001122 100%)',
    primaryColor: '#00d4ff',
    secondaryColor: '#0088cc',
    subtitleColor: 'rgba(255, 255, 255, 0.9)',
    buttonBg: 'linear-gradient(135deg, #00d4ff, #0088cc)',
    buttonText: '#ffffff',
    buttonOutline: '#00d4ff',
    buttonOutlineText: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.4)',
    waves: true,
    particles: false
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #ff6b6b 100%)',
    primaryColor: '#ff6b6b',
    secondaryColor: '#ffa500',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBg: 'rgba(255, 255, 255, 0.2)',
    buttonText: '#ffffff',
    buttonOutline: 'rgba(255, 255, 255, 0.3)',
    buttonOutlineText: '#ffffff',
    glowColor: 'rgba(255, 107, 107, 0.4)',
    particles: true,
    waves: false
  }
};

const DEVICE_CONFIGS = {
  iphone14: { name: 'iPhone 14', width: 393, height: 852, previewWidth: 350, previewHeight: 700 },
  galaxyS23: { name: 'Galaxy S23', width: 360, height: 800, previewWidth: 340, previewHeight: 680 },
  tablet: { name: 'iPad Air', width: 820, height: 1180, previewWidth: 400, previewHeight: 560 },
  desktop: { name: 'Desktop', width: 1200, height: 800, previewWidth: 600, previewHeight: 400 }
};

export const AnimatedCoverPreview: React.FC<AnimatedCoverPreviewProps> = ({
  title,
  subtitle,
  logoUrl,
  bgImageUrl,
  bgVideoUrl,
  checklist,
  buttons,
  selectedTheme,
  activeDevice,
  dragMode,
  elementPositions,
  onElementDrag,
  fullscreenPreview = false,
  templateData
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [particlePositions, setParticlePositions] = useState<Array<{x: number, y: number, delay: number}>>([]);

  const theme = COVER_THEMES[selectedTheme as keyof typeof COVER_THEMES] || COVER_THEMES.gold;
  const device = DEVICE_CONFIGS[activeDevice as keyof typeof DEVICE_CONFIGS] || DEVICE_CONFIGS.iphone14;
  const isMobile = ['iphone14', 'galaxyS23', 'tablet'].includes(activeDevice);

  // Initialize particles
  useEffect(() => {
    if (theme.particles) {
      const particles = Array.from({ length: 25 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5
      }));
      setParticlePositions(particles);
    }
  }, [selectedTheme, animationKey]);

  // Trigger re-animation when theme changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [selectedTheme, templateData]);

  const handleElementDrag = (id: string, position: { x: number; y: number }) => {
    onElementDrag?.(id, position);
  };

  const getElementPosition = (id: string) => {
    return elementPositions.find(pos => pos.id === id) || { x: 50, y: 50 };
  };

  const renderParticles = () => {
    if (!theme.particles) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particlePositions.map((particle, i) => (
          <div
            key={`${animationKey}-${i}`}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: theme.primaryColor,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.6 + Math.random() * 0.4,
              boxShadow: `0 0 6px ${theme.glowColor}`
            }}
          />
        ))}
      </div>
    );
  };

  const renderWaves = () => {
    if (!theme.waves) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={`wave-${animationKey}-${i}`}
            className="absolute w-full opacity-20"
            style={{
              bottom: `${-20 + i * 10}%`,
              height: '200px',
              background: `radial-gradient(ellipse at center, ${theme.primaryColor} 0%, transparent 70%)`,
              borderRadius: '50%',
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`
            }}
          />
        ))}
      </div>
    );
  };

  const renderAnimatedElement = (elementId: string, content: React.ReactNode, animations: string[] = []) => {
    const position = getElementPosition(elementId);
    const animationClasses = animations.map(anim => {
      switch (anim) {
        case 'fadeIn': return 'animate-fade-in';
        case 'slideInUp': return 'animate-slide-in-up';
        case 'pulse': return 'animate-pulse';
        case 'glow': return 'animate-pulse';
        case 'scale': return 'hover:animate-scale-in';
        case 'hover-scale': return 'hover:scale-105 transition-transform duration-300';
        default: return '';
      }
    }).join(' ');

    if (!dragMode) {
      return (
        <div
          key={`${elementId}-${animationKey}`}
          className={`transition-all duration-500 ${animationClasses}`}
          style={{
            position: 'absolute',
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${Math.random() * 0.5}s`
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <Draggable
        key={`${elementId}-${animationKey}`}
        position={{ x: (position.x / 100) * device.previewWidth - device.previewWidth/2, y: (position.y / 100) * device.previewHeight - device.previewHeight/2 }}
        onStop={(_, data) => handleElementDrag(elementId, { 
          x: ((data.x + device.previewWidth/2) / device.previewWidth) * 100, 
          y: ((data.y + device.previewHeight/2) / device.previewHeight) * 100 
        })}
      >
        <div className={`absolute cursor-move transition-all duration-300 ${animationClasses}`}>
          {content}
        </div>
      </Draggable>
    );
  };

  const renderLogo = () => {
    if (!logoUrl) return null;
    
    return renderAnimatedElement('logo', (
      <div className="flex justify-center animate-scale-in">
        <img 
          src={logoUrl} 
          alt="Logo" 
          className="w-16 h-16 object-contain rounded-lg shadow-lg"
          style={{
            filter: `drop-shadow(0 0 10px ${theme.glowColor})`
          }}
        />
      </div>
    ), ['fadeIn', 'scale']);
  };

  const renderTitle = () => {
    return renderAnimatedElement('title', (
      <h1 
        className="text-3xl md:text-4xl font-bold text-center px-4 leading-tight"
        style={{ 
          color: theme.primaryColor,
          textShadow: `0 0 20px ${theme.glowColor}, 0 2px 4px rgba(0,0,0,0.3)`,
          fontFamily: templateData?.design_data?.typography?.heading || 'inherit'
        }}
      >
        {title}
      </h1>
    ), ['fadeIn', 'glow']);
  };

  const renderSubtitle = () => {
    return renderAnimatedElement('subtitle', (
      <p 
        className="text-lg md:text-xl text-center px-6 leading-relaxed"
        style={{ 
          color: theme.subtitleColor,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
      >
        {subtitle}
      </p>
    ), ['fadeIn']);
  };

  const renderChecklist = () => {
    return renderAnimatedElement('checklist', (
      <div className="space-y-3 px-4">
        {checklist.filter(Boolean).map((item, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-center gap-3 animate-slide-in-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <span 
              className="text-xl animate-pulse"
              style={{ 
                color: theme.primaryColor,
                textShadow: `0 0 8px ${theme.glowColor}`
              }}
            >
              {selectedTheme === 'gold' ? '🥂' : selectedTheme === 'ocean' ? '🌊' : '🔥'}
            </span>
            <span 
              className="text-base font-medium"
              style={{ color: theme.subtitleColor }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    ), ['slideInUp']);
  };

  const renderButtons = () => {
    return renderAnimatedElement('buttons', (
      <div className="space-y-4 px-4 w-full max-w-sm">
        {buttons.map((button, idx) => (
          <button
            key={idx}
            className="w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 animate-scale-in"
            style={{
              backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
              color: button.style === 'filled' ? theme.buttonText : theme.buttonOutlineText,
              border: button.style === 'outline' ? `2px solid ${theme.buttonOutline}` : 'none',
              boxShadow: button.style === 'filled' 
                ? `0 6px 20px ${theme.glowColor}, 0 0 0 1px rgba(255,255,255,0.1)` 
                : `0 2px 10px rgba(0,0,0,0.1)`,
              backdropFilter: button.style === 'outline' ? 'blur(10px)' : 'none',
              background: button.style === 'filled' ? theme.buttonBg : 
                         button.style === 'outline' ? `linear-gradient(135deg, ${theme.buttonOutline}15, ${theme.buttonOutline}05)` : 
                         'transparent',
              animationDelay: `${idx * 0.2}s`
            }}
          >
            {button.text}
          </button>
        ))}
      </div>
    ), ['scale', 'hover-scale']);
  };

  return (
    <div 
      className={`flex items-center justify-center min-h-full p-4 transition-all duration-500 ${
        isMobile ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'
      }`}
      style={{
        background: isMobile ? theme.background : 'rgb(249 250 251)'
      }}
    >
      {/* Device Frame with Enhanced Design */}
      <div
        className={`relative overflow-hidden transition-all duration-500 ${
          isMobile ? 'border-2 shadow-2xl' : 'border border-gray-200 shadow-lg'
        }`}
        style={{
          width: fullscreenPreview && isMobile ? Math.min(device.previewWidth * 1.2, 420) : Math.min(device.previewWidth, 400),
          height: fullscreenPreview && isMobile ? Math.min(device.previewHeight * 1.2, 800) : Math.min(device.previewHeight, 750),
          borderRadius: isMobile ? '2.5rem' : '1rem',
          background: bgImageUrl ? `url(${bgImageUrl})` : bgVideoUrl ? 'black' : theme.background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: isMobile ? 
            `0 0 60px ${theme.glowColor}, 0 20px 80px rgba(0, 0, 0, 0.6)` : 
            '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: isMobile ? theme.primaryColor + '60' : 'rgb(229 231 235)'
        }}
      >
        {/* Video Background */}
        {bgVideoUrl && (
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
            src={bgVideoUrl}
          />
        )}
        
        {/* Animated Background Effects */}
        {renderParticles()}
        {renderWaves()}
        
        {/* Content Container with Animation */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center space-y-8 p-8">
          {!dragMode ? (
            <div className="w-full space-y-8 animate-fade-in">
              {renderLogo()}
              {renderTitle()}
              {renderSubtitle()}
              {renderChecklist()}
              {renderButtons()}
            </div>
          ) : (
            <div className="absolute inset-0">
              {renderLogo()}
              {renderTitle()}
              {renderSubtitle()}
              {renderChecklist()}
              {renderButtons()}
            </div>
          )}
        </div>

        {/* Enhanced Phone Frame Overlay Effects */}
        {isMobile && (
          <>
            {/* Screen Glow */}
            <div 
              className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
              style={{
                boxShadow: `inset 0 0 100px ${theme.glowColor}`,
                opacity: 0.3
              }}
            />
            {/* Screen Border Highlight */}
            <div 
              className="absolute inset-2 rounded-[2rem] border pointer-events-none"
              style={{
                borderColor: theme.primaryColor + '30'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};