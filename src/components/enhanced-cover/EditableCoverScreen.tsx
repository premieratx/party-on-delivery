import React from 'react';
import { motion } from 'framer-motion';

interface EditableCoverScreenProps {
  // Content fields
  title: string;
  subtitle: string;
  logoUrl?: string;
  logoEmoji?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundImageStyles?: {
    backgroundSize?: string;
    backgroundPosition?: string;
  };
  
  // Feature cards
  features: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;
  
  // Buttons
  buttons: Array<{
    text: string;
    type: 'primary' | 'secondary' | 'tertiary';
    color?: string;
    textColor?: string;
    onClick?: () => void;
  }>;
  
  // Style customizations
  variant: 'original' | 'gold' | 'platinum';
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    border?: string;
    font?: string;
  };
  
  // Typography & Sizing Controls
  typography?: {
    titleSize?: string;
    subtitleSize?: string;
    fontFamily?: string;
    titleColor?: string;
    subtitleColor?: string;
  };
  
  // Sizing controls
  sizing?: {
    logoSize?: number;
    headlineSize?: number;
    subtitleSize?: number;
  };
  
  // Logo customization
  logoSizing?: {
    width?: string;
    height?: string;
  };
  
  // Layout & Positioning Controls
  positioning?: {
    logoMarginTop?: string;
    logoMarginBottom?: string;
    titleMarginTop?: string;
    titleMarginBottom?: string;
    subtitleMarginTop?: string;
    subtitleMarginBottom?: string;
    featuresMarginTop?: string;
    featuresMarginBottom?: string;
    buttonsMarginTop?: string;
    buttonsMarginBottom?: string;
  };
  
  // Badge configuration
  badgeConfig?: {
    text?: string;
    size?: number;
    verticalPos?: number;
  };
  
  // Layout options
  className?: string;
  onClose?: () => void;
  standalone?: boolean;
}

export const EditableCoverScreen: React.FC<EditableCoverScreenProps> = ({
  title,
  subtitle,
  logoUrl,
  logoEmoji = '🎉',
  backgroundImageUrl,
  backgroundVideoUrl,
  backgroundImageStyles,
  features = [],
  buttons = [],
  variant = 'original',
  customColors,
  typography,
  logoSizing,
  positioning,
  sizing,
  badgeConfig,
  className,
  onClose,
  standalone = false
}) => {
  console.log('📱 EditableCoverScreen mobile render:', {
    title,
    subtitle,
    hasLogo: !!logoUrl,
    hasBackground: !!(backgroundImageUrl || backgroundVideoUrl),
    featureCount: features?.length || 0,
    buttonCount: buttons?.length || 0,
    variant,
    standalone
  });
  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return {
          backdrop: 'bg-gradient-to-br from-amber-900/90 via-yellow-800/90 to-orange-900/90',
          container: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-4 border-amber-300',
          frame: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300',
          inner: 'bg-gradient-to-br from-amber-50 to-yellow-50',
          badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900',
          badgeText: '✨ GOLD TIER EXPERIENCE ✨',
          logoContainer: 'bg-gradient-to-br from-amber-400 to-yellow-500 border-4 border-amber-200',
          titleGradient: 'from-amber-600 via-yellow-500 to-amber-700',
          subtitleColor: 'text-amber-800',
          featureCard: 'bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-200',
          featureTitle: 'text-amber-900',
          featureDesc: 'text-amber-700',
          shimmer: 'from-transparent via-amber-200/20 to-transparent'
        };
      
      case 'platinum':
        return {
          backdrop: 'bg-gradient-to-br from-slate-900/95 via-zinc-800/95 to-slate-900/95',
          container: 'bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100 border border-slate-200',
          frame: 'bg-gradient-to-r from-slate-300 via-zinc-200 to-slate-300',
          inner: 'bg-gradient-to-br from-slate-50 to-zinc-100',
          badge: 'bg-gradient-to-r from-slate-600 via-zinc-500 to-slate-600 text-white border border-slate-300',
          badgeText: '💎 PLATINUM ELITE EXPERIENCE 💎',
          logoContainer: 'bg-gradient-to-br from-slate-300 via-zinc-200 to-slate-400 border-4 border-slate-200',
          titleGradient: 'from-slate-700 via-zinc-600 to-slate-800',
          subtitleColor: 'text-slate-700',
          featureCard: 'bg-gradient-to-br from-slate-100 via-zinc-100 to-slate-200 border-2 border-slate-300',
          featureTitle: 'text-slate-800',
          featureDesc: 'text-slate-600',
          shimmer: 'from-transparent via-slate-200/10 to-transparent'
        };
      
      default: // original
        return {
          backdrop: 'bg-black/80',
          container: 'bg-white',
          frame: '',
          inner: 'bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5',
          badge: 'bg-primary/10 text-primary',
          badgeText: '✨ PREMIUM SERVICE ✨',
          logoContainer: 'bg-primary/10',
          titleGradient: 'from-primary to-secondary',
          subtitleColor: 'text-muted-foreground',
          featureCard: 'bg-background/50 backdrop-blur-sm border',
          featureTitle: 'text-foreground',
          featureDesc: 'text-muted-foreground',
          shimmer: 'from-transparent via-white/5 to-transparent'
        };
    }
  };

  const styles = getVariantStyles();
  
  const containerClass = standalone ? 
    `min-h-screen flex items-center justify-center p-4 ${styles.backdrop}` :
    `fixed inset-0 z-50 ${styles.backdrop} backdrop-blur-sm flex items-center justify-center p-4`;

  const renderBackground = () => {
    if (backgroundVideoUrl) {
      return (
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideoUrl} type="video/mp4" />
        </video>
      );
    }
    
    if (backgroundImageUrl) {
      return (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: backgroundImageStyles?.backgroundSize || 'cover',
            backgroundPosition: backgroundImageStyles?.backgroundPosition || 'center'
          }}
        />
      );
    }
    
    return null;
  };

  return (
    <div className={`${containerClass} ${className || ''}`} style={{ fontSize: '16px' }}>
      {renderBackground()}
      
      {/* Mobile-first vertical layout with desktop centering */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm mx-auto lg:max-w-md h-full lg:h-auto lg:aspect-[9/16] bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        style={{ 
          minHeight: standalone ? '85vh' : '100vh',
          maxHeight: standalone ? '90vh' : '100vh',
          fontSize: 'inherit',
          borderColor: customColors?.border || undefined,
          borderWidth: customColors?.border ? '4px' : undefined,
          borderStyle: customColors?.border ? 'solid' : undefined
        }}
      >
        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 text-center overflow-y-auto">
          
          {/* Top Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-full uppercase tracking-wider shadow-lg"
            style={{
              marginTop: positioning?.logoMarginTop || '0',
              fontSize: badgeConfig?.size ? `${badgeConfig.size}px` : '12px',
              marginBottom: badgeConfig?.verticalPos ? `${badgeConfig.verticalPos}px` : '0',
              color: customColors?.font || undefined
            }}
          >
            {badgeConfig?.text || styles.badgeText}
          </motion.div>
          
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center items-center my-8"
            style={{
              marginTop: positioning?.logoMarginTop || '2rem',
              marginBottom: positioning?.logoMarginBottom || '2rem'
            }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="object-contain rounded-2xl shadow-2xl"
                style={{
                  width: sizing?.logoSize ? `${sizing.logoSize}px` : logoSizing?.width || '6rem',
                  height: sizing?.logoSize ? `${sizing.logoSize}px` : logoSizing?.height || '6rem'
                }}
              />
            ) : (
              <div 
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{
                  width: sizing?.logoSize ? `${sizing.logoSize}px` : logoSizing?.width || '6rem',
                  height: sizing?.logoSize ? `${sizing.logoSize}px` : logoSizing?.height || '6rem'
                }}
              >
                <span className="text-3xl">{logoEmoji}</span>
              </div>
            )}
          </motion.div>
          
          {/* Title Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
            style={{
              marginTop: positioning?.titleMarginTop || '0',
              marginBottom: positioning?.titleMarginBottom || '0'
            }}
          >
            <h1 
              className={`font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent leading-tight ${
                typography?.titleSize || 'text-3xl'
              }`}
              style={{
                fontFamily: typography?.fontFamily || 'inherit',
                color: customColors?.font || typography?.titleColor || undefined,
                fontSize: sizing?.headlineSize ? `${sizing.headlineSize}px` : undefined
              }}
            >
              {title}
            </h1>
            
            <p 
              className={`text-gray-300 font-medium leading-relaxed ${
                typography?.subtitleSize || 'text-lg'
              }`}
              style={{
                fontFamily: typography?.fontFamily || 'inherit',
                color: customColors?.font || typography?.subtitleColor || undefined,
                fontSize: sizing?.subtitleSize ? `${sizing.subtitleSize}px` : undefined,
                marginTop: positioning?.subtitleMarginTop || '0',
                marginBottom: positioning?.subtitleMarginBottom || '0'
              }}
            >
              {subtitle}
            </p>
          </motion.div>
          
          {/* Features Section - Vertical stacked with animations */}
          {features.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-4 my-8"
              style={{
                marginTop: positioning?.featuresMarginTop || '2rem',
                marginBottom: positioning?.featuresMarginBottom || '2rem'
              }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-2xl p-4 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      {feature.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1" style={{ color: customColors?.font || '#ffffff' }}>
                        {feature.title}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: customColors?.font || '#9ca3af' }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* Action Buttons - Bottom positioned */}
          {buttons.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="space-y-3 mt-auto"
              style={{
                marginTop: positioning?.buttonsMarginTop || 'auto',
                marginBottom: positioning?.buttonsMarginBottom || '0'
              }}
            >
              {buttons.map((button, index) => {
                const isSpecial = button.type === 'primary';
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={button.onClick || onClose}
                    className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 shadow-xl ${
                      isSpecial 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/25' 
                        : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border border-gray-500'
                    }`}
                    style={{
                      backgroundColor: button.color,
                      color: button.textColor
                    }}
                  >
                    {button.text}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
          
          {/* Animated particles/glow effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-16 h-16 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-5 w-12 h-12 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-500" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const getButtonStyles = (button: any, variant: string) => {
  const baseStyles = 'transition-all duration-200 shadow-lg hover:shadow-xl';
  
  if (button.color && button.textColor) {
    return `${baseStyles} hover:opacity-90`;
  }
  
  switch (variant) {
    case 'gold':
      return button.type === 'primary' ? 
        `${baseStyles} bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-2 border-amber-300 hover:from-amber-600 hover:to-yellow-700` :
        `${baseStyles} border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 hover:from-amber-100 hover:to-yellow-100`;
    
    case 'platinum':
      return button.type === 'primary' ? 
        `${baseStyles} bg-gradient-to-r from-slate-700 via-zinc-600 to-slate-700 text-white border border-slate-400` :
        `${baseStyles} border-2 border-slate-400 bg-gradient-to-r from-slate-50 to-zinc-50 text-slate-800 hover:from-slate-100 hover:to-zinc-100`;
    
    default:
      return button.type === 'primary' ? 
        `${baseStyles} bg-primary text-primary-foreground hover:bg-primary/90` :
        `${baseStyles} border-2 border-primary bg-transparent text-primary hover:bg-primary/10`;
  }
};

export default EditableCoverScreen;