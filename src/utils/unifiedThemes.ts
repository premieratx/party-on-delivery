// Unified theme system for Cover Page, Delivery App, and Post-Checkout creators
export interface UnifiedTheme {
  id: string;
  name: string;
  category: 'modern' | 'vibrant' | 'elegant' | 'professional' | 'success' | 'celebration' | 'minimal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  description?: string;
}

export const UNIFIED_THEMES: UnifiedTheme[] = [
  {
    id: 'modern',
    name: 'Modern',
    category: 'modern',
    description: 'Clean and contemporary design with blue tones',
    colors: { 
      primary: '#0ea5e9', 
      secondary: '#06b6d4', 
      accent: '#3b82f6',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      text: '#1e293b'
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    category: 'vibrant',
    description: 'Bold and energetic with warm colors',
    colors: { 
      primary: '#ef4444', 
      secondary: '#f97316', 
      accent: '#eab308',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      text: '#7f1d1d'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'elegant',
    description: 'Sophisticated purple and violet tones',
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#a855f7', 
      accent: '#c084fc',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      text: '#581c87'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'professional',
    description: 'Business-ready with neutral tones',
    colors: { 
      primary: '#1f2937', 
      secondary: '#374151', 
      accent: '#6b7280',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      text: '#111827'
    }
  },
  {
    id: 'success',
    name: 'Success',
    category: 'success',
    description: 'Fresh green for positive outcomes',
    colors: { 
      primary: '#22c55e', 
      secondary: '#16a34a', 
      accent: '#15803d',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      text: '#14532d'
    }
  },
  {
    id: 'celebration',
    name: 'Celebration',
    category: 'celebration',
    description: 'Warm golden tones for special moments',
    colors: { 
      primary: '#f59e0b', 
      secondary: '#d97706', 
      accent: '#b45309',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      text: '#78350f'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    category: 'minimal',
    description: 'Simple and clean gray-scale design',
    colors: { 
      primary: '#6b7280', 
      secondary: '#4b5563', 
      accent: '#374151',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      text: '#111827'
    }
  }
];

// Theme utility functions
export const getThemeById = (id: string): UnifiedTheme | undefined => {
  return UNIFIED_THEMES.find(theme => theme.id === id);
};

export const getThemesByCategory = (category: string): UnifiedTheme[] => {
  return UNIFIED_THEMES.filter(theme => theme.category === category);
};

export const getAllThemeCategories = (): string[] => {
  return Array.from(new Set(UNIFIED_THEMES.map(theme => theme.category)));
};

// Legacy compatibility maps for existing components
export const COVER_THEMES_COMPATIBILITY = UNIFIED_THEMES.reduce((acc, theme) => {
  acc[theme.id] = {
    name: theme.name,
    colors: theme.colors
  };
  return acc;
}, {} as Record<string, { name: string; colors: UnifiedTheme['colors'] }>);

export const DELIVERY_THEMES_COMPATIBILITY = UNIFIED_THEMES.reduce((acc, theme) => {
  acc[theme.id] = {
    name: theme.name,
    colors: theme.colors
  };
  return acc;
}, {} as Record<string, { name: string; colors: UnifiedTheme['colors'] }>);

export const POST_CHECKOUT_THEMES_COMPATIBILITY = UNIFIED_THEMES.reduce((acc, theme) => {
  acc[theme.id] = {
    name: theme.name,
    colors: theme.colors
  };
  return acc;
}, {} as Record<string, { name: string; colors: UnifiedTheme['colors'] }>);

// Apply theme to DOM (for real-time preview)
export const applyUnifiedTheme = (theme: UnifiedTheme): void => {
  const root = document.documentElement;
  
  // Apply theme colors as CSS custom properties
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-text', theme.colors.text);
};

// Reset theme from DOM
export const resetUnifiedTheme = (): void => {
  const root = document.documentElement;
  
  root.style.removeProperty('--theme-primary');
  root.style.removeProperty('--theme-secondary');
  root.style.removeProperty('--theme-accent');
  root.style.removeProperty('--theme-background');
  root.style.removeProperty('--theme-text');
};