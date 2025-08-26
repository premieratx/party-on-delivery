import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MobileFirstCoverPreviewProps {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  checklist: string[];
  buttons: any[];
  selectedTheme: string;
  elementPositions: any[];
  dragMode: boolean;
}

const MOBILE_VIEWPORT = {
  width: 393,
  height: 852,
  className: 'w-[393px] h-[700px]'
};

const COVER_THEMES = {
  gold: {
    name: 'Luxury Gold',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
    primaryColor: '#F5B800',
    textColor: '#F5B800',
    subtitleColor: '#CCCCCC',
    buttonBg: '#F5B800',
    buttonText: '#000000',
    glowColor: 'rgba(245, 184, 0, 0.4)',
  },
  ocean: {
    name: 'Ocean Depth',
    background: 'linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #0083b0 100%)',
    primaryColor: '#00d4ff',
    textColor: '#ffffff',
    subtitleColor: '#b3e5fc',
    buttonBg: '#00d4ff',
    buttonText: '#0077be',
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)',
    primaryColor: '#ffffff',
    textColor: '#ffffff',
    subtitleColor: '#ffe8e8',
    buttonBg: '#ffffff',
    buttonText: '#ff6b6b',
  }
};

export const MobileFirstCoverPreview: React.FC<MobileFirstCoverPreviewProps> = ({
  title,
  subtitle,
  logoUrl,
  checklist,
  buttons,
  selectedTheme,
  elementPositions,
  dragMode
}) => {
  const theme = COVER_THEMES[selectedTheme as keyof typeof COVER_THEMES] || COVER_THEMES.gold;

  const getElementPosition = (type: string) => {
    return elementPositions.find(el => el.type === type) || { x: 50, y: 50 };
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Mobile-First Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-primary/10">
          📱 Mobile-First Design
        </Badge>
        <Badge variant="outline" className="text-xs">
          393×852px (iPhone 14 Pro)
        </Badge>
        {dragMode && (
          <Badge variant="outline" className="text-xs bg-blue-50">
            🎯 Drag Mode Active
          </Badge>
        )}
      </div>

      {/* Mobile Frame */}
      <div className="relative">
        <div 
          className={`${MOBILE_VIEWPORT.className} rounded-[2.5rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative`}
          style={{ background: theme.background }}
        >
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 text-white text-sm z-50">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white rounded-sm opacity-60"></div>
              <div className="w-6 h-3 border border-white rounded-sm opacity-60"></div>
            </div>
          </div>

          {/* Content Container */}
          <div className="absolute inset-0 pt-12 pb-8 px-6 flex flex-col items-center justify-center text-center">
            
            {/* Logo */}
            {logoUrl && (
              <div 
                className="absolute transition-all duration-200"
                style={{
                  left: `${getElementPosition('logo').x}%`,
                  top: `${getElementPosition('logo').y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Title */}
            <div 
              className="absolute max-w-[300px] transition-all duration-200"
              style={{
                left: `${getElementPosition('title').x}%`,
                top: `${getElementPosition('title').y}%`,
                transform: 'translate(-50%, -50%)',
                color: theme.textColor
              }}
            >
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                {title || 'Elite Concierge'}
              </h1>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div 
                className="absolute max-w-[280px] transition-all duration-200"
                style={{
                  left: `${getElementPosition('subtitle').x}%`,
                  top: `${getElementPosition('subtitle').y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: theme.subtitleColor
                }}
              >
                <p className="text-lg opacity-90 leading-relaxed">
                  {subtitle}
                </p>
              </div>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <div 
                className="absolute max-w-[260px] transition-all duration-200"
                style={{
                  left: `${getElementPosition('checklist').x}%`,
                  top: `${getElementPosition('checklist').y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="space-y-3">
                  {checklist.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.textColor }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons - Fixed at bottom with 15px margin like the real version */}
            {buttons.length > 0 && (
              <div 
                className="absolute bottom-0 left-4 right-4"
                style={{ marginBottom: '15px' }}
              >
                <div className="flex flex-col gap-2.5 w-full max-w-xs mx-auto">
                  {buttons.slice(0, 2).map((button, idx) => (
                    <button
                      key={idx}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg"
                      style={{
                        backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
                        color: button.style === 'filled' ? theme.buttonText : theme.primaryColor,
                        border: button.style === 'outline' ? `2px solid ${theme.primaryColor}` : 'none'
                      }}
                    >
                      {button.text || `Button ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full"></div>
        </div>

        {/* Responsive Info */}
        <div className="mt-4 text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Mobile-first design expands to larger screens
          </div>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="outline">📱 Phone: Fixed Frame</Badge>
            <Badge variant="outline">💻 Desktop: Background Expands</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};