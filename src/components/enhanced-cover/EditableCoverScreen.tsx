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
  };
  
  // Typography & Sizing Controls
  typography?: {
    titleSize?: string;
    subtitleSize?: string;
    fontFamily?: string;
    titleColor?: string;
    subtitleColor?: string;
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
  features = [],
  buttons = [],
  variant = 'original',
  customColors,
  typography,
  logoSizing,
  positioning,
  className,
  onClose,
  standalone = false
}) => {
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
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      );
    }
    
    return null;
  };

  return (
    <div className={`${containerClass} ${className || ''}`}>
      {renderBackground()}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative w-full max-w-4xl mx-auto ${styles.container} rounded-2xl shadow-2xl overflow-hidden`}
      >
          {/* Frame effect for premium variants */}
          {styles.frame && (
            <div className={`absolute inset-0 ${styles.frame} p-1 rounded-2xl`}>
              <div className={`w-full h-full ${styles.inner} rounded-xl`} />
            </div>
          )}
          
          {/* Content */}
          <div 
            className={`relative ${styles.inner} p-8 md:p-12 text-center space-y-8`}
            style={{ textAlign: 'center' }}
          >
            
            {/* Premium Badge */}
            <div 
              className={`inline-block px-4 py-2 ${styles.badge} font-bold rounded-full text-sm shadow-lg mx-auto`}
              style={{ textAlign: 'center', display: 'inline-block' }}
            >
              {styles.badgeText}
            </div>
            
            {/* Logo Section */}
            <div 
              className="flex justify-center items-center"
              style={{
                marginTop: positioning?.logoMarginTop || '0',
                marginBottom: positioning?.logoMarginBottom || '0',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className={`object-contain rounded-full shadow-xl ${
                    logoSizing?.width && logoSizing?.height 
                      ? '' 
                      : 'w-20 h-20'
                  }`}
                  style={{
                    width: logoSizing?.width || '5rem',
                    height: logoSizing?.height || '5rem'
                  }}
                />
              ) : (
                <div 
                  className={`${styles.logoContainer} rounded-full flex items-center justify-center shadow-xl ${
                    logoSizing?.width && logoSizing?.height 
                      ? '' 
                      : 'w-20 h-20'
                  }`}
                  style={{
                    width: logoSizing?.width || '5rem',
                    height: logoSizing?.height || '5rem'
                  }}
                >
                  <span className="text-2xl">{logoEmoji}</span>
                </div>
              )}
            </div>
            
            {/* Title & Subtitle */}
            <div 
              className="space-y-4 max-w-3xl mx-auto text-center"
              style={{ textAlign: 'center' }}
            >
              <h1 
                className={`font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent ${
                  typography?.titleSize || 'text-4xl md:text-5xl'
                } text-center`}
                style={{
                  fontFamily: typography?.fontFamily || 'inherit',
                  color: typography?.titleColor || undefined,
                  marginTop: positioning?.titleMarginTop || '0',
                  marginBottom: positioning?.titleMarginBottom || '0',
                  textAlign: 'center'
                }}
              >
                {title}
              </h1>
              
              <p 
                className={`${typography?.subtitleSize || 'text-xl'} ${
                  typography?.subtitleColor || styles.subtitleColor
                } text-center`}
                style={{
                  fontFamily: typography?.fontFamily || 'inherit',
                  color: typography?.subtitleColor || undefined,
                  marginTop: positioning?.subtitleMarginTop || '0',
                  marginBottom: positioning?.subtitleMarginBottom || '0',
                  textAlign: 'center'
                }}
              >
                {subtitle}
              </p>
            </div>
            
            {/* Features Grid */}
            {features.length > 0 && (
              <div 
                className="w-full max-w-4xl mx-auto"
                style={{
                  marginTop: positioning?.featuresMarginTop || '0',
                  marginBottom: positioning?.featuresMarginBottom || '0'
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className={`flex flex-col items-center p-4 rounded-lg ${styles.featureCard} shadow-lg space-y-2`}
                    >
                      <div className="text-2xl">{feature.emoji}</div>
                      <h3 className={`font-semibold ${styles.featureTitle}`}>{feature.title}</h3>
                      <p className={`text-sm ${styles.featureDesc}`}>{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {buttons.length > 0 && (
              <div 
                className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto justify-center items-center"
                style={{
                  marginTop: positioning?.buttonsMarginTop || '0',
                  marginBottom: positioning?.buttonsMarginBottom || '0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {buttons.map((button, index) => {
                  const buttonStyles = getButtonStyles(button, variant);
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={button.onClick || onClose}
                      className={`flex-1 px-8 py-4 font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${buttonStyles}`}
                      style={{
                        backgroundColor: button.color,
                        color: button.textColor
                      }}
                    >
                      {button.text}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Shimmer overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${styles.shimmer} animate-shimmer pointer-events-none`} />
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