// UI Theme system for delivery apps
export interface UITheme {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    border: string;
    destructive: string;
    success: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    tight: boolean;
    rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  layout: {
    headerStyle: 'minimal' | 'bold' | 'elegant';
    tabStyle: 'pills' | 'underline' | 'filled' | 'outline';
    cardStyle: 'flat' | 'elevated' | 'outlined';
  };
}

export const uiThemes: UITheme[] = [
  // Modern & Minimalist
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, modern design with plenty of whitespace',
    category: 'modern',
    preview: '/theme-previews/modern-minimal.jpg',
    colors: {
      primary: '220 70% 50%',
      secondary: '220 14% 96%',
      background: '0 0% 100%',
      foreground: '220 9% 9%',
      muted: '220 14% 96%',
      accent: '220 14% 96%',
      border: '220 13% 91%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'lg'
    },
    layout: {
      headerStyle: 'minimal',
      tabStyle: 'underline',
      cardStyle: 'flat'
    }
  },

  // E-commerce Inspired
  {
    id: 'shopify-inspired',
    name: 'E-commerce Pro',
    description: 'Inspired by high-converting Shopify stores',
    category: 'ecommerce',
    preview: '/theme-previews/shopify-inspired.jpg',
    colors: {
      primary: '142 86% 28%',
      secondary: '142 86% 95%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '142 9% 96%',
      accent: '142 86% 95%',
      border: '142 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Poppins',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'md'
    },
    layout: {
      headerStyle: 'bold',
      tabStyle: 'filled',
      cardStyle: 'elevated'
    }
  },

  // Premium Luxury
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Premium, sophisticated design with gold accents',
    category: 'luxury',
    preview: '/theme-previews/luxury-gold.jpg',
    colors: {
      primary: '45 93% 47%',
      secondary: '45 100% 96%',
      background: '0 0% 2%',
      foreground: '0 0% 98%',
      muted: '0 0% 15%',
      accent: '45 100% 96%',
      border: '0 0% 20%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Playfair Display',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'sm'
    },
    layout: {
      headerStyle: 'elegant',
      tabStyle: 'outline',
      cardStyle: 'outlined'
    }
  },

  // Vibrant & Energetic
  {
    id: 'vibrant-orange',
    name: 'Energetic Orange',
    description: 'Bold, energetic design perfect for food delivery',
    category: 'vibrant',
    preview: '/theme-previews/vibrant-orange.jpg',
    colors: {
      primary: '24 95% 53%',
      secondary: '24 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '24 9% 96%',
      accent: '24 100% 97%',
      border: '24 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Montserrat',
      secondary: 'Inter'
    },
    spacing: {
      tight: true,
      rounded: 'xl'
    },
    layout: {
      headerStyle: 'bold',
      tabStyle: 'pills',
      cardStyle: 'elevated'
    }
  },

  // Tech/App Style
  {
    id: 'tech-purple',
    name: 'Tech Purple',
    description: 'Modern tech aesthetic with purple gradients',
    category: 'tech',
    preview: '/theme-previews/tech-purple.jpg',
    colors: {
      primary: '262 83% 58%',
      secondary: '262 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '262 9% 96%',
      accent: '262 100% 97%',
      border: '262 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Space Grotesk',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'lg'
    },
    layout: {
      headerStyle: 'minimal',
      tabStyle: 'underline',
      cardStyle: 'flat'
    }
  },

  // Classic & Trustworthy
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    description: 'Trustworthy, professional blue theme',
    category: 'classic',
    preview: '/theme-previews/classic-blue.jpg',
    colors: {
      primary: '221 83% 53%',
      secondary: '221 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '221 9% 96%',
      accent: '221 100% 97%',
      border: '221 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Roboto',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'md'
    },
    layout: {
      headerStyle: 'bold',
      tabStyle: 'filled',
      cardStyle: 'outlined'
    }
  },

  // Retro & Fun
  {
    id: 'retro-pink',
    name: 'Retro Pink',
    description: 'Fun, retro-inspired design with pink accents',
    category: 'retro',
    preview: '/theme-previews/retro-pink.jpg',
    colors: {
      primary: '330 81% 60%',
      secondary: '330 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '330 9% 96%',
      accent: '330 100% 97%',
      border: '330 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Fredoka One',
      secondary: 'Inter'
    },
    spacing: {
      tight: true,
      rounded: 'xl'
    },
    layout: {
      headerStyle: 'bold',
      tabStyle: 'pills',
      cardStyle: 'elevated'
    }
  },

  // Dark Themes
  {
    id: 'dark-modern',
    name: 'Dark Modern',
    description: 'Sleek dark theme with accent colors',
    category: 'dark',
    preview: '/theme-previews/dark-modern.jpg',
    colors: {
      primary: '210 40% 98%',
      secondary: '217 33% 17%',
      background: '222 84% 5%',
      foreground: '210 40% 98%',
      muted: '217 33% 17%',
      accent: '217 33% 17%',
      border: '217 33% 17%',
      destructive: '0 63% 31%',
      success: '142 76% 36%'
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'lg'
    },
    layout: {
      headerStyle: 'minimal',
      tabStyle: 'underline',
      cardStyle: 'flat'
    }
  },

  // More themes continue...
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Organic, eco-friendly green theme',
    category: 'nature',
    preview: '/theme-previews/nature-green.jpg',
    colors: {
      primary: '122 39% 49%',
      secondary: '122 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '122 9% 96%',
      accent: '122 100% 97%',
      border: '122 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Nunito',
      secondary: 'Inter'
    },
    spacing: {
      tight: false,
      rounded: 'lg'
    },
    layout: {
      headerStyle: 'elegant',
      tabStyle: 'outline',
      cardStyle: 'elevated'
    }
  },

  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm sunset colors for evening delivery',
    category: 'warm',
    preview: '/theme-previews/sunset-orange.jpg',
    colors: {
      primary: '14 91% 60%',
      secondary: '14 100% 97%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '14 9% 96%',
      accent: '14 100% 97%',
      border: '14 9% 88%',
      destructive: '0 84% 60%',
      success: '142 71% 45%'
    },
    fonts: {
      primary: 'Oswald',
      secondary: 'Inter'
    },
    spacing: {
      tight: true,
      rounded: 'md'
    },
    layout: {
      headerStyle: 'bold',
      tabStyle: 'filled',
      cardStyle: 'elevated'
    }
  }
];

export const getThemesByCategory = (category: string): UITheme[] => {
  return uiThemes.filter(theme => theme.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(uiThemes.map(theme => theme.category))];
};

export const applyTheme = (theme: UITheme) => {
  const root = document.documentElement;
  
  // Apply CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Apply font families if available
  if (theme.fonts.primary) {
    root.style.setProperty('--font-primary', theme.fonts.primary);
  }
  
  // Apply custom classes for layout styles
  const body = document.body;
  body.classList.remove(...body.classList);
  body.classList.add(`theme-${theme.id}`);
  
  if (theme.spacing.tight) {
    body.classList.add('spacing-tight');
  }
  
  body.classList.add(`rounded-${theme.spacing.rounded}`);
  body.classList.add(`header-${theme.layout.headerStyle}`);
  body.classList.add(`tabs-${theme.layout.tabStyle}`);
  body.classList.add(`cards-${theme.layout.cardStyle}`);
};