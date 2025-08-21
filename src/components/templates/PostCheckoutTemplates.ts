// Default template configurations for post-checkout pages
// Based on the enhanced demo post-checkout page

export const DEFAULT_POST_CHECKOUT_TEMPLATE = {
  name: 'Enhanced Demo Order Complete',
  title: 'Order Confirmed! 🎉',
  subtitle: 'Thank you for choosing our premium service. Your order is being prepared with the utmost care.',
  theme: 'celebration',
  variant: 'gold',
  content: {
    thankYouMessage: 'We appreciate your trust in our premium service. Every order receives our signature white-glove treatment.',
    nextStepsMessage: 'Your order is now in our fulfillment queue. You\'ll receive SMS and email updates as we prepare and deliver your items.',
    continue_shopping_text: 'Continue Premium Shopping',
    continue_shopping_url: '/checkout',
    manage_order_text: 'Track My Order',
    manage_order_url: '/orders',
    logo_url: 'https://premierpartycruises.com/wp-content/uploads/2025/01/PPC_logo_compressed_new_aggressive-1.png',
    primary_button_color: '#d4af37',
    primary_button_text_color: '#000000',
    secondary_button_color: '#8b5cf6',
    secondary_button_text_color: '#ffffff',
    show_order_details: true,
    show_delivery_info: true,
    show_share_options: true,
    supportContact: {
      phone: '+1 (512) 555-0123',
      email: 'concierge@premiumdelivery.com',
      hours: 'Available 24/7 for our premium clients'
    },
    testimonial: {
      enabled: true,
      text: 'Absolutely incredible service! The attention to detail and speed of delivery exceeded all expectations. This is luxury convenience at its finest.',
      author: 'Sarah M., Austin',
      rating: 5
    },
    animations: {
      enabled: true,
      celebrationEffect: true,
      entranceAnimation: 'fade'
    }
  }
};

export const POST_CHECKOUT_VARIANTS = {
  gold: {
    ...DEFAULT_POST_CHECKOUT_TEMPLATE,
    theme: 'celebration',
    variant: 'gold',
    content: {
      ...DEFAULT_POST_CHECKOUT_TEMPLATE.content,
      primary_button_color: '#d4af37',
      primary_button_text_color: '#000000',
      secondary_button_color: '#8b5cf6',
      secondary_button_text_color: '#ffffff'
    }
  },
  platinum: {
    ...DEFAULT_POST_CHECKOUT_TEMPLATE,
    name: 'Platinum Elite Order Complete',
    title: 'Platinum Order Confirmed! 💎',
    subtitle: 'Your elite-tier order is receiving our highest level of attention.',
    theme: 'premium',
    variant: 'platinum',
    content: {
      ...DEFAULT_POST_CHECKOUT_TEMPLATE.content,
      thankYouMessage: 'Welcome to the platinum experience. Your order receives our most exclusive handling.',
      primary_button_color: '#71717a',
      primary_button_text_color: '#ffffff',
      secondary_button_color: '#3b82f6',
      secondary_button_text_color: '#ffffff',
      testimonial: {
        enabled: true,
        text: 'The platinum service is unmatched. Every detail is perfect, and the speed is incredible.',
        author: 'Michael R., CEO',
        rating: 5
      }
    }
  },
  original: {
    ...DEFAULT_POST_CHECKOUT_TEMPLATE,
    name: 'Standard Order Complete',
    title: 'Order Confirmed! ✅',
    subtitle: 'Thank you for your order. We\'re preparing it with care.',
    theme: 'success',
    variant: 'original',
    content: {
      ...DEFAULT_POST_CHECKOUT_TEMPLATE.content,
      thankYouMessage: 'We appreciate your business and look forward to serving you.',
      primary_button_color: '#22c55e',
      primary_button_text_color: '#ffffff',
      secondary_button_color: '#3b82f6',
      secondary_button_text_color: '#ffffff',
      testimonial: {
        enabled: true,
        text: 'Great service and fast delivery. Exactly what I needed!',
        author: 'Jennifer K., Customer',
        rating: 5
      }
    }
  }
};

export const generatePostCheckoutSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const createPostCheckoutFromTemplate = (
  templateName: string = 'gold',
  customizations: Partial<typeof DEFAULT_POST_CHECKOUT_TEMPLATE> = {}
) => {
  const template = POST_CHECKOUT_VARIANTS[templateName as keyof typeof POST_CHECKOUT_VARIANTS] || POST_CHECKOUT_VARIANTS.gold;
  const merged = { ...template, ...customizations };
  
  return {
    ...merged,
    slug: generatePostCheckoutSlug(merged.name),
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};