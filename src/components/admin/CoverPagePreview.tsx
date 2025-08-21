import React from 'react';
import { UNIFIED_THEMES, getThemeCSS } from '@/lib/themeSystem';

interface CoverPagePreviewProps {
  title: string;
  subtitle: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  theme: 'original' | 'gold' | 'platinum';
  features: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;
  buttons: Array<{
    text: string;
    type: 'primary' | 'secondary';
    url: string;
  }>;
}

export const CoverPagePreview: React.FC<CoverPagePreviewProps> = ({
  title,
  subtitle,
  logoUrl,
  backgroundImageUrl,
  theme,
  features,
  buttons
}) => {
  const themeConfig = UNIFIED_THEMES[theme];
  const cssVars = getThemeCSS(themeConfig);

  return (
    <div 
      className="w-full h-full min-h-[600px] relative overflow-hidden rounded-lg"
      style={{
        ...cssVars,
        background: backgroundImageUrl 
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImageUrl})`
          : themeConfig.colors.gradient,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } as React.CSSProperties}
    >
      {/* Content Container */}
      <div 
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 py-12"
        style={{ color: themeConfig.colors.text }}
      >
        {/* Logo */}
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-20 h-20 object-contain mb-6 rounded-lg shadow-lg"
          />
        )}
        
        {/* Main Heading */}
        <h1 
          className="text-5xl font-bold mb-6 leading-tight"
          style={{ 
            fontFamily: themeConfig.fonts.heading,
            color: themeConfig.colors.text,
            textShadow: backgroundImageUrl ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          {title || 'Premium Delivery Experience'}
        </h1>
        
        {/* Subtitle */}
        <p 
          className="text-xl mb-8 max-w-2xl leading-relaxed opacity-90"
          style={{ 
            color: themeConfig.colors.text,
            textShadow: backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.6)' : 'none'
          }}
        >
          {subtitle || 'Experience luxury delivery service with premium quality products'}
        </p>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl">
          {features.slice(0, 3).map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl backdrop-blur-sm border transition-transform hover:scale-105"
              style={{ 
                backgroundColor: `${themeConfig.colors.cardBackground}40`,
                borderColor: `${themeConfig.colors.border}60`
              }}
            >
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h3 
                className="font-semibold mb-2"
                style={{ color: themeConfig.colors.text }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-sm opacity-80"
                style={{ color: themeConfig.colors.text }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          {buttons.slice(0, 2).map((button, index) => (
            <button
              key={index}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 ${
                button.type === 'primary' 
                  ? 'shadow-lg' 
                  : 'border-2 backdrop-blur-sm'
              }`}
              style={{
                backgroundColor: button.type === 'primary' 
                  ? themeConfig.colors.primary 
                  : 'transparent',
                color: button.type === 'primary' 
                  ? themeConfig.colors.background 
                  : themeConfig.colors.text,
                borderColor: button.type === 'secondary' 
                  ? themeConfig.colors.primary 
                  : 'transparent',
                boxShadow: button.type === 'primary' 
                  ? themeConfig.shadows.button 
                  : 'none'
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
      
      {/* Background Overlay for better text readability */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            background: `linear-gradient(135deg, ${themeConfig.colors.overlay}, ${themeConfig.colors.overlay})`
          }}
        />
      )}
    </div>
  );
};