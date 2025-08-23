import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Palette, ExternalLink } from 'lucide-react';

interface ThemeVariant {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

const DEMO_THEMES: Record<string, ThemeVariant> = {
  gold: {
    name: 'Gold Luxury',
    primary: '#D4AF37',
    secondary: '#FFD700',
    accent: '#FFA500',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    foreground: '#FFFFFF'
  },
  purple: {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#A855F7',
    accent: '#C084FC',
    background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
    foreground: '#FFFFFF'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    accent: '#7DD3FC',
    background: 'linear-gradient(135deg, #0c4a6e, #075985, #0369a1)',
    foreground: '#FFFFFF'
  },
  emerald: {
    name: 'Emerald Green',
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    background: 'linear-gradient(135deg, #064e3b, #065f46, #047857)',
    foreground: '#FFFFFF'
  },
  sunset: {
    name: 'Sunset Orange',
    primary: '#F97316',
    secondary: '#FB923C',
    accent: '#FDBA74',
    background: 'linear-gradient(135deg, #7c2d12, #9a3412, #c2410c)',
    foreground: '#FFFFFF'
  }
};

const DEMO_FEATURES = [
  {
    emoji: '⚡',
    title: 'Lightning Fast Delivery',
    description: 'Get your party supplies delivered in under 30 minutes across Austin'
  },
  {
    emoji: '🏆', 
    title: 'Premium Quality',
    description: 'Only the finest party supplies and beverages, curated for perfection'
  },
  {
    emoji: '📱',
    title: 'Easy Mobile Ordering',
    description: 'Order seamlessly from your phone with our optimized mobile experience'
  },
  {
    emoji: '🎉',
    title: 'Party Planning Experts',
    description: 'Our team helps you create unforgettable celebrations'
  },
  {
    emoji: '🛡️',
    title: '100% Satisfaction Guarantee',
    description: 'Not happy? We will make it right, no questions asked'
  }
];

export default function DemoCoverPage() {
  const [currentTheme, setCurrentTheme] = useState('gold');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const theme = DEMO_THEMES[currentTheme];

  const handleThemeChange = (themeKey: string) => {
    setCurrentTheme(themeKey);
  };

  const handleOrderNow = () => {
    // Navigate to actual delivery app
    window.location.href = '/';
  };

  const handleLearnMore = () => {
    window.open('https://docs.lovable.dev', '_blank');
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        background: theme.background,
        color: theme.foreground
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${theme.primary}, transparent)`,
            top: '10%',
            left: '10%',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${theme.secondary}, transparent)`,
            bottom: '20%',
            right: '15%',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full opacity-5 blur-2xl animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${theme.accent}, transparent)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDelay: '2s'
          }}
        />
      </div>

      {/* Theme Selector */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" style={{ color: theme.primary }} />
            <span className="text-xs font-medium">Themes</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(DEMO_THEMES).map(([key, themeOption]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  currentTheme === key ? 'border-white scale-110' : 'border-white/30'
                }`}
                style={{ backgroundColor: themeOption.primary }}
                title={themeOption.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-8">
          
          {/* Logo Placeholder */}
          <div 
            className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-2xl font-bold border-2"
            style={{ 
              borderColor: theme.primary,
              backgroundColor: `${theme.primary}20`,
              color: theme.primary
            }}
          >
            🎉
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: theme.primary }}
          >
            Austin's Premier
            <br />
            Party Delivery
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 max-w-2xl opacity-90">
            Experience lightning-fast delivery of premium party supplies across Austin. 
            Your celebration starts here.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {DEMO_FEATURES.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="text-2xl mb-2">{feature.emoji}</div>
                <h3 
                  className="font-semibold mb-2 text-sm"
                  style={{ color: theme.primary }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs opacity-80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              onClick={handleOrderNow}
              size="lg"
              className="flex-1 text-black font-bold py-4 text-base hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: theme.primary,
                borderColor: theme.primary
              }}
            >
              Order Now
            </Button>
            
            <Button
              onClick={handleLearnMore}
              variant="outline"
              size="lg"
              className="flex-1 font-semibold py-4 text-base hover:scale-105 transition-transform"
              style={{ 
                borderColor: theme.primary,
                color: theme.primary
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>

          {/* Bottom Message */}
          <div className="mt-8 text-center">
            <p className="text-sm opacity-70">
              Built with ❤️ using Lovable's no-code platform
            </p>
            <p className="text-xs opacity-50 mt-1">
              Theme: {theme.name} • Click theme colors above to change
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}