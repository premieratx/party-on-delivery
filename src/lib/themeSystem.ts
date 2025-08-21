// Unified Theme Configuration System
// This defines the cohesive theming across delivery apps, cover pages, and post-checkout pages

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  gradient: string;
  overlay: string;
  border: string;
  cardBackground: string;
}

export interface ThemeConfig {
  id: 'original' | 'gold' | 'platinum';
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
  shadows: {
    card: string;
    button: string;
    glow: string;
  };
}

// Figma-Based Theme Definitions
export const UNIFIED_THEMES: Record<string, ThemeConfig> = {
  original: {
    id: 'original',
    name: 'Original Blue',
    description: 'Classic professional blue theme',
    colors: {
      background: 'hsl(210, 40%, 98%)',
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(210, 40%, 94%)',
      accent: 'hsl(221, 83%, 53%)',
      text: 'hsl(222, 84%, 5%)',
      muted: 'hsl(215, 20%, 65%)',
      gradient: 'linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(221, 83%, 43%) 100%)',
      overlay: 'hsla(221, 83%, 53%, 0.1)',
      border: 'hsl(214, 32%, 91%)',
      cardBackground: 'hsl(0, 0%, 100%)'
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif'
    },
    borderRadius: '8px',
    shadows: {
      card: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      button: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
      glow: '0 0 20px hsla(221, 83%, 53%, 0.3)'
    }
  },
  
  gold: {
    id: 'gold',
    name: 'Gold Premium',
    description: 'Luxurious gold and dark theme',
    colors: {
      background: 'hsl(240, 10%, 3.9%)',
      primary: 'hsl(43, 96%, 56%)',
      secondary: 'hsl(240, 3.7%, 15.9%)',
      accent: 'hsl(43, 96%, 56%)',
      text: 'hsl(0, 0%, 98%)',
      muted: 'hsl(240, 5%, 64.9%)',
      gradient: 'linear-gradient(135deg, hsl(43, 96%, 56%) 0%, hsl(45, 93%, 47%) 100%)',
      overlay: 'hsla(43, 96%, 56%, 0.1)',
      border: 'hsl(240, 3.7%, 15.9%)',
      cardBackground: 'hsl(240, 10%, 3.9%)'
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Inter, system-ui, sans-serif'
    },
    borderRadius: '12px',
    shadows: {
      card: '0 8px 32px rgba(0, 0, 0, 0.3)',
      button: '0 4px 16px rgba(234, 179, 8, 0.3)',
      glow: '0 0 40px hsla(43, 96%, 56%, 0.4)'
    }
  },
  
  platinum: {
    id: 'platinum',
    name: 'Platinum Elite',
    description: 'Ultra-premium platinum and silver theme',
    colors: {
      background: 'hsl(224, 71%, 4%)',
      primary: 'hsl(213, 31%, 91%)',
      secondary: 'hsl(217, 33%, 17%)',
      accent: 'hsl(213, 31%, 91%)',
      text: 'hsl(210, 40%, 98%)',
      muted: 'hsl(215, 20%, 65%)',
      gradient: 'linear-gradient(135deg, hsl(213, 31%, 91%) 0%, hsl(213, 27%, 84%) 100%)',
      overlay: 'hsla(213, 31%, 91%, 0.1)',
      border: 'hsl(217, 33%, 17%)',
      cardBackground: 'hsl(224, 71%, 4%)'
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Inter, system-ui, sans-serif'
    },
    borderRadius: '16px',
    shadows: {
      card: '0 12px 40px rgba(0, 0, 0, 0.4)',
      button: '0 6px 20px rgba(226, 232, 240, 0.2)',
      glow: '0 0 60px hsla(213, 31%, 91%, 0.3)'
    }
  }
};

// Theme Application Helpers
export const getThemeCSS = (theme: ThemeConfig): Record<string, string> => {
  return {
    '--background': theme.colors.background,
    '--primary': theme.colors.primary,
    '--secondary': theme.colors.secondary,
    '--accent': theme.colors.accent,
    '--text': theme.colors.text,
    '--muted': theme.colors.muted,
    '--gradient': theme.colors.gradient,
    '--overlay': theme.colors.overlay,
    '--border': theme.colors.border,
    '--card-background': theme.colors.cardBackground,
    '--font-heading': theme.fonts.heading,
    '--font-body': theme.fonts.body,
    '--border-radius': theme.borderRadius,
    '--shadow-card': theme.shadows.card,
    '--shadow-button': theme.shadows.button,
    '--shadow-glow': theme.shadows.glow
  };
};

export const applyThemeToElement = (element: HTMLElement, themeId: string) => {
  const theme = UNIFIED_THEMES[themeId];
  if (!theme) return;
  
  const cssVars = getThemeCSS(theme);
  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

// Legacy Theme Migration
export const migrateLegacyTheme = (oldTheme: string): 'original' | 'gold' | 'platinum' => {
  const themeMap: Record<string, 'original' | 'gold' | 'platinum'> = {
    'default': 'original',
    'blue': 'original',
    'original': 'original',
    'gold': 'gold',
    'premium': 'gold',
    'platinum': 'platinum',
    'elite': 'platinum',
    'silver': 'platinum'
  };
  
  return themeMap[oldTheme?.toLowerCase()] || 'gold';
};

export default UNIFIED_THEMES;