import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Draggable from 'react-draggable';

interface OptimizedAnimatedPreviewProps {
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

export const OptimizedAnimatedPreview: React.FC<OptimizedAnimatedPreviewProps> = ({
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
  const [particlePositions, setParticlePositions] = useState<Array<{x: number, y: number, delay: number}>>([]);
  
  const theme = useMemo(() => 
    COVER_THEMES[selectedTheme as keyof typeof COVER_THEMES] || COVER_THEMES.gold,
    [selectedTheme]
  );
  
  const device = useMemo(() => 
    DEVICE_CONFIGS[activeDevice as keyof typeof DEVICE_CONFIGS] || DEVICE_CONFIGS.iphone14,
    [activeDevice]
  );
  
  const isMobile = useMemo(() => 
    ['iphone14', 'galaxyS23', 'tablet'].includes(activeDevice),
    [activeDevice]
  );

  // Use mobile dimensions as the constraint for all screen sizes to ensure consistency
  const constrainedHeight = useMemo(() => Math.min(device.previewHeight, 700), [device.previewHeight]); // Max height based on mobile
  const constrainedWidth = useMemo(() => Math.min(device.previewWidth, 350), [device.previewWidth]);

  // Optimized particles initialization - only when theme changes
  useEffect(() => {
    if (theme.particles) {
      setParticlePositions(Array.from({ length: 15 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      })));
    }
  }, [selectedTheme, theme.particles]);

  const handleElementDrag = useCallback((id: string, position: { x: number; y: number }) => {
    onElementDrag?.(id, position);
  }, [onElementDrag]);

  const getElementPosition = useCallback((id: string) => {
    return elementPositions.find(pos => pos.id === id) || { x: 50, y: 50 };
  }, [elementPositions]);

  const renderParticles = useMemo(() => {
    if (!theme.particles) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particlePositions.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: theme.primaryColor,
              animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              opacity: 0.7,
              boxShadow: `0 0 4px ${theme.glowColor}`
            }}
          />
        ))}
      </div>
    );
  }, [theme.particles, particlePositions, theme.primaryColor, theme.glowColor]);

  const renderWaves = useMemo(() => {
    if (!theme.waves) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full opacity-15"
            style={{
              bottom: `${-15 + i * 8}%`,
              height: '150px',
              background: `radial-gradient(ellipse at center, ${theme.primaryColor} 0%, transparent 60%)`,
              borderRadius: '50%',
              animation: `float ${6 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 1}s`
            }}
          />
        ))}
      </div>
    );
  }, [theme.waves, theme.primaryColor]);

  const renderElement = useCallback((elementId: string, content: React.ReactNode) => {
    const position = getElementPosition(elementId);

    if (!dragMode) {
      return (
        <div
          className="absolute transition-all duration-300"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <Draggable
        position={{ 
          x: (position.x / 100) * device.previewWidth - device.previewWidth/2, 
          y: (position.y / 100) * device.previewHeight - device.previewHeight/2 
        }}
        onStop={(_, data) => handleElementDrag(elementId, { 
          x: ((data.x + device.previewWidth/2) / device.previewWidth) * 100, 
          y: ((data.y + device.previewHeight/2) / device.previewHeight) * 100 
        })}
      >
        <div className="absolute cursor-move hover:scale-105 transition-transform duration-200">
          {content}
        </div>
      </Draggable>
    );
  }, [dragMode, getElementPosition, device, handleElementDrag]);

  const renderContent = useMemo(() => {
    return (
      <>
        {/* Logo */}
        {logoUrl && renderElement('logo', (
          <div className="flex justify-center">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-16 h-16 object-contain rounded-lg shadow-lg transition-transform duration-300 hover:scale-110"
              style={{
                filter: `drop-shadow(0 0 8px ${theme.glowColor})`
              }}
            />
          </div>
        ))}

        {/* Title */}
        {renderElement('title', (
          <h1 
            className="text-2xl md:text-3xl font-bold text-center px-4 leading-tight"
            style={{ 
              color: theme.primaryColor,
              textShadow: `0 0 15px ${theme.glowColor}, 0 2px 4px rgba(0,0,0,0.3)`,
              fontFamily: templateData?.design_data?.typography?.heading || 'inherit'
            }}
          >
            {title}
          </h1>
        ))}

        {/* Subtitle */}
        {renderElement('subtitle', (
          <p 
            className="text-base md:text-lg text-center px-6 leading-relaxed"
            style={{ 
              color: theme.subtitleColor,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {subtitle}
          </p>
        ))}

        {/* Checklist */}
        {checklist.length > 0 && renderElement('checklist', (
          <div className="space-y-2 px-4">
            {checklist.filter(Boolean).map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-center gap-3"
              >
                <span 
                  className="text-lg"
                  style={{ 
                    color: theme.primaryColor,
                    textShadow: `0 0 6px ${theme.glowColor}`
                  }}
                >
                  {selectedTheme === 'gold' ? '✨' : selectedTheme === 'ocean' ? '🌊' : '🔥'}
                </span>
                <span 
                  className="text-sm font-medium"
                  style={{ color: theme.subtitleColor }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* Buttons */}
        {buttons.length > 0 && renderElement('buttons', (
          <div className="space-y-3 px-4 w-full max-w-sm">
            {buttons.map((button, idx) => (
              <button
                key={idx}
                className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
                  color: button.style === 'filled' ? theme.buttonText : theme.buttonOutlineText,
                  border: button.style === 'outline' ? `2px solid ${theme.buttonOutline}` : 'none',
                  boxShadow: button.style === 'filled' 
                    ? `0 4px 15px ${theme.glowColor}` 
                    : `0 2px 8px rgba(0,0,0,0.1)`,
                  backdropFilter: button.style === 'outline' ? 'blur(8px)' : 'none',
                  background: button.style === 'filled' ? theme.buttonBg : 
                             button.style === 'outline' ? `linear-gradient(135deg, ${theme.buttonOutline}10, ${theme.buttonOutline}05)` : 
                             'transparent'
                }}
              >
                {button.text}
              </button>
            ))}
          </div>
        ))}
      </>
    );
  }, [logoUrl, title, subtitle, checklist, buttons, theme, selectedTheme, templateData, renderElement]);

  return (
    <div 
      className={`flex items-center justify-center min-h-full p-4 transition-all duration-500 ${
        isMobile ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'
      }`}
      style={{
        background: isMobile ? theme.background : 'rgb(249 250 251)'
      }}
    >
      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          isMobile ? 'border-2 shadow-2xl' : 'border border-gray-200 shadow-lg'
        }`}
        style={{
          width: constrainedWidth,
          height: constrainedHeight,
          borderRadius: isMobile ? '2.5rem' : '1rem',
          background: bgImageUrl ? `url(${bgImageUrl})` : bgVideoUrl ? 'black' : theme.background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: isMobile ? 
            `0 0 40px ${theme.glowColor}, 0 15px 60px rgba(0, 0, 0, 0.4)` : 
            '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: isMobile ? theme.primaryColor + '40' : 'rgb(229 231 235)'
        }}
      >
        {/* Video Background */}
        {bgVideoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={bgVideoUrl}
          />
        )}
        
        {/* Optimized Background Effects */}
        {renderParticles}
        {renderWaves}
        
        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center p-6">
          {!dragMode ? (
            <div className="w-full space-y-6">
              {renderContent}
            </div>
          ) : (
            <div className="absolute inset-0">
              {renderContent}
            </div>
          )}
        </div>

        {/* Enhanced Mobile Frame Effects */}
        {isMobile && (
          <>
            <div 
              className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
              style={{
                boxShadow: `inset 0 0 60px ${theme.glowColor}`,
                opacity: 0.2
              }}
            />
            <div 
              className="absolute inset-2 rounded-[2rem] border pointer-events-none"
              style={{
                borderColor: theme.primaryColor + '20'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};