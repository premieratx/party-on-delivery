import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutConfig {
  always_editable: boolean;
  auto_save_enabled: boolean;
  auto_confirm_disabled: boolean;
  persistence_keys: string[];
  validation_rules: {
    datetime_required: string[];
    address_required: string[];
    customer_required: string[];
  };
  step_progression: {
    enable_auto_progression: boolean;
    require_manual_confirmation: boolean;
    allow_step_editing: boolean;
  };
  safeguards: {
    enable_edit_buttons: boolean;
    enable_clear_data: boolean;
    enable_reset_flow: boolean;
  };
}

interface PersistenceConfig {
  storage_type: string;
  auto_save_debounce_ms: number;
  expiry_hours: number;
  backup_keys: boolean;
  clear_on_completion: boolean;
  restore_on_load: boolean;
}

interface PaymentConfig {
  stripe_integration: boolean;
  tip_support: boolean;
  promo_code_support: boolean;
  tax_calculation: number;
  delivery_fee_calculation: string;
  free_shipping_codes: string[];
  payment_retry_enabled: boolean;
}

const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  always_editable: true,
  auto_save_enabled: true,
  auto_confirm_disabled: true,
  persistence_keys: [
    'partyondelivery_customer',
    'partyondelivery_address', 
    'partyondelivery_delivery_info',
    'partyondelivery_checkout_state',
    'persistent-checkout-info'
  ],
  validation_rules: {
    datetime_required: ['date', 'timeSlot'],
    address_required: ['street', 'city', 'state', 'zipCode'],
    customer_required: ['firstName', 'lastName', 'email', 'phone']
  },
  step_progression: {
    enable_auto_progression: false,
    require_manual_confirmation: true,
    allow_step_editing: true
  },
  safeguards: {
    enable_edit_buttons: true,
    enable_clear_data: true,
    enable_reset_flow: true
  }
};

const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  storage_type: 'localStorage',
  auto_save_debounce_ms: 300,
  expiry_hours: 24,
  backup_keys: true,
  clear_on_completion: false,
  restore_on_load: true
};

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  stripe_integration: true,
  tip_support: true,
  promo_code_support: true,
  tax_calculation: 0.0825,
  delivery_fee_calculation: 'dynamic',
  free_shipping_codes: ['PREMIERE2025'],
  payment_retry_enabled: true
};

export function useCheckoutConfig() {
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig>(DEFAULT_CHECKOUT_CONFIG);
  const [persistenceConfig, setPersistenceConfig] = useState<PersistenceConfig>(DEFAULT_PERSISTENCE_CONFIG);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Load checkout flow configuration
        const { data: checkoutData } = await supabase.rpc('get_checkout_config', { 
          config_type: 'checkout_flow_settings' 
        });
        
        if (checkoutData && typeof checkoutData === 'object') {
          setCheckoutConfig({ ...DEFAULT_CHECKOUT_CONFIG, ...checkoutData as Partial<CheckoutConfig> });
        }

        // Load persistence configuration
        const { data: persistenceData } = await supabase.rpc('get_checkout_config', { 
          config_type: 'checkout_persistence_config' 
        });
        
        if (persistenceData && typeof persistenceData === 'object') {
          setPersistenceConfig({ ...DEFAULT_PERSISTENCE_CONFIG, ...persistenceData as Partial<PersistenceConfig> });
        }

        // Load payment configuration
        const { data: paymentData } = await supabase.rpc('get_checkout_config', { 
          config_type: 'checkout_payment_config' 
        });
        
        if (paymentData && typeof paymentData === 'object') {
          setPaymentConfig({ ...DEFAULT_PAYMENT_CONFIG, ...paymentData as Partial<PaymentConfig> });
        }

        console.log('✅ Checkout configurations loaded from Supabase');
      } catch (error) {
        console.warn('⚠️ Failed to load checkout configurations, using defaults:', error);
        // Fallback to defaults - already set
      } finally {
        setIsLoaded(true);
      }
    };

    loadConfigurations();
  }, []);

  // Log checkout event for monitoring
  const logCheckoutEvent = async (
    sessionId: string,
    userEmail: string,
    step: string,
    status: string = 'in_progress',
    errorDetails?: any,
    deviceInfo?: any,
    entryPoint?: string
  ) => {
    try {
      await supabase.rpc('log_checkout_event', {
        p_session_id: sessionId,
        p_user_email: userEmail,
        p_step: step,
        p_status: status,
        p_error_details: errorDetails ? JSON.stringify(errorDetails) : null,
        p_device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
        p_entry_point: entryPoint
      });
    } catch (error) {
      console.warn('Failed to log checkout event:', error);
    }
  };

  // Validation helpers using config
  const validateStep = (step: string, data: any): boolean => {
    const rules = checkoutConfig.validation_rules;
    
    switch (step) {
      case 'datetime':
        return rules.datetime_required.every(field => data[field]);
      case 'address':
        return rules.address_required.every(field => data[field]);
      case 'customer':
        return rules.customer_required.every(field => data[field]);
      default:
        return true;
    }
  };

  // Auto-save utility using config
  const shouldAutoSave = (): boolean => {
    return checkoutConfig.auto_save_enabled;
  };

  // Edit mode utilities
  const canEditStep = (): boolean => {
    return checkoutConfig.always_editable && checkoutConfig.step_progression.allow_step_editing;
  };

  const requiresManualConfirmation = (): boolean => {
    return checkoutConfig.step_progression.require_manual_confirmation;
  };

  return {
    // Configuration objects
    checkoutConfig,
    persistenceConfig,
    paymentConfig,
    isLoaded,
    
    // Utility functions
    logCheckoutEvent,
    validateStep,
    shouldAutoSave,
    canEditStep,
    requiresManualConfirmation,
    
    // Direct config access
    debounceMs: persistenceConfig.auto_save_debounce_ms,
    taxRate: paymentConfig.tax_calculation,
    freeShippingCodes: paymentConfig.free_shipping_codes,
    persistenceKeys: checkoutConfig.persistence_keys
  };
}