// Default template configurations for cover pages
// Based on the enhanced demo cover page that's proven to work well

export const DEFAULT_COVER_TEMPLATE = {
  title: 'Premium Delivery Experience',
  subtitle: 'Professional concierge service with luxury touches and seamless ordering',
  theme: 'gold',
  checklist: [
    '⚡ Same Day Premium Delivery',
    '🏪 Locally Curated Selection', 
    '🍸 White-Glove Service Experience'
  ],
  buttons: [
    {
      text: 'Start Premium Shopping',
      type: 'primary' as const,
      color: '#d4af37',
      textColor: '#000000',
      target: '/checkout'
    },
    {
      text: 'Browse Collections',
      type: 'secondary' as const,
      color: '#8b5cf6',
      textColor: '#ffffff',
      target: '/search'
    }
  ],
  styles: {
    variant: 'gold',
    logoEmoji: '✨',
    // Condensed sizing to fit vertical constraints
    logoSize: 50,
    headlineSize: 24,
    subheadlineSize: 14,
    // Reset all positioning to zero for full control
    logoVerticalPos: 0,
    headlineVerticalPos: 0,
    subheadlineVerticalPos: 0,
    buttonVerticalPos: 0,
    buttonSpacing: 10,
    customColors: {
      primary: '#d4af37',
      secondary: '#8b5cf6',
      accent: '#f59e0b'
    },
    features: [
      {
        emoji: '⚡',
        title: 'Same Day Premium Delivery',
        description: 'Lightning-fast service with premium handling'
      },
      {
        emoji: '🏪',
        title: 'Locally Curated Selection',
        description: 'Hand-picked products from trusted local vendors'
      },
      {
        emoji: '🍸',
        title: 'White-Glove Service Experience',
        description: 'Concierge-level attention to every detail'
      }
    ],
    animations: {
      enabled: true,
      speed: 'normal',
      entrance: 'fade'
    }
  }
};

export const TEMPLATE_VARIANTS = {
  gold: {
    ...DEFAULT_COVER_TEMPLATE,
    theme: 'gold',
    styles: {
      ...DEFAULT_COVER_TEMPLATE.styles,
      variant: 'gold',
      customColors: {
        primary: '#d4af37',
        secondary: '#8b5cf6',
        accent: '#f59e0b'
      }
    }
  },
  platinum: {
    ...DEFAULT_COVER_TEMPLATE,
    title: 'Platinum Elite Experience',
    theme: 'platinum',
    styles: {
      ...DEFAULT_COVER_TEMPLATE.styles,
      variant: 'platinum',
      customColors: {
        primary: '#71717a',
        secondary: '#3b82f6',
        accent: '#6366f1'
      }
    }
  },
  original: {
    ...DEFAULT_COVER_TEMPLATE,
    title: 'Premium Delivery Service',
    theme: 'default',
    styles: {
      ...DEFAULT_COVER_TEMPLATE.styles,
      variant: 'original',
      customColors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4'
      }
    }
  }
};

export const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const createCoverPageFromTemplate = (
  templateName: string = 'gold',
  customizations: Partial<typeof DEFAULT_COVER_TEMPLATE> = {}
) => {
  const template = TEMPLATE_VARIANTS[templateName as keyof typeof TEMPLATE_VARIANTS] || TEMPLATE_VARIANTS.gold;
  const merged = { ...template, ...customizations };
  
  return {
    ...merged,
    slug: generateSlugFromTitle(merged.title),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};