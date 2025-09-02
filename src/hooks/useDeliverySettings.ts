import { useState, useEffect } from 'react';

// Define delivery settings interface
interface DeliverySettings {
  delivery_fees: {
    base_fee: number;
    percentage_rate: number;
    percentage_threshold: number;
    free_shipping_threshold: number;
    minimum_order: number;
    rush_delivery_fee: number;
  };
  driver_tips: {
    default_percentage: number;
    suggested_percentages: number[];
    minimum_tip: number;
    maximum_tip: number;
  };
  promo_codes: Record<string, {
    type: 'percentage' | 'free_shipping' | 'dollar_amount';
    value: number;
    minimum_order: number;
    active: boolean;
    description: string;
  }>;
}

// Mock settings data (using the actual values from Supabase)
const MOCK_DELIVERY_SETTINGS: DeliverySettings = {
  delivery_fees: {
    base_fee: 20,
    percentage_rate: 0.1,
    percentage_threshold: 200,
    free_shipping_threshold: 500,
    minimum_order: 50,
    rush_delivery_fee: 15
  },
  driver_tips: {
    default_percentage: 18,
    suggested_percentages: [15, 18, 20, 25],
    minimum_tip: 3,
    maximum_tip: 100
  },
  promo_codes: {
    'FREESHIP': {
      type: 'free_shipping',
      value: 0,
      minimum_order: 100,
      active: true,
      description: 'Free shipping on orders over $100'
    },
    'WELCOME20': {
      type: 'percentage',
      value: 20,
      minimum_order: 50,
      active: true,
      description: '20% off for new customers'
    },
    'FREE10': {
      type: 'percentage',
      value: 10,
      minimum_order: 75,
      active: true,
      description: '10% off orders over $75'
    }
  }
};

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(MOCK_DELIVERY_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    // For now, we'll use the mock settings since we have the actual values
    // This can be connected to Supabase later when needed
    setSettings(MOCK_DELIVERY_SETTINGS);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const calculateDeliveryFee = (subtotal: number, promoCode?: string) => {
    const { delivery_fees, promo_codes } = settings;
    
    // Check for delivery app free shipping settings first
    try {
      const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
      if (deliveryAppSettings.freeDeliveryEnabled) {
        return 0;
      }
    } catch (error) {
      console.warn('Failed to parse delivery app settings:', error);
    }
    
    // Check for free shipping promo code
    if (promoCode && promo_codes[promoCode]?.type === 'free_shipping' && promo_codes[promoCode]?.active) {
      if (subtotal >= promo_codes[promoCode].minimum_order) {
        return 0;
      }
    }

    // Apply standard delivery fee rules
    if (subtotal >= delivery_fees.percentage_threshold) {
      return Math.round(subtotal * delivery_fees.percentage_rate * 100) / 100;
    } else {
      return delivery_fees.base_fee;
    }
  };

  const validatePromoCode = (code: string, subtotal: number) => {
    if (!code) return null;

    const promo = settings.promo_codes[code.toUpperCase()];
    if (!promo || !promo.active) {
      return { valid: false, error: 'Invalid promo code' };
    }

    if (subtotal < promo.minimum_order) {
      return { 
        valid: false, 
        error: `Minimum order of $${promo.minimum_order} required for this promo code` 
      };
    }

    return {
      valid: true,
      discount: promo,
      description: promo.description
    };
  };

  const calculateDiscount = (subtotal: number, promoCode?: string) => {
    if (!promoCode) return 0;

    const validation = validatePromoCode(promoCode, subtotal);
    if (!validation?.valid || !validation.discount) return 0;

    const discount = validation.discount;
    
    if (discount.type === 'percentage') {
      return Math.round(subtotal * (discount.value / 100) * 100) / 100;
    } else if (discount.type === 'dollar_amount') {
      return Math.min(discount.value, subtotal);
    }
    
    return 0;
  };

  return {
    settings,
    loading,
    error,
    reload: loadSettings,
    calculateDeliveryFee,
    validatePromoCode,
    calculateDiscount
  };
}