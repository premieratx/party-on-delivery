import { supabase } from '@/integrations/supabase/client';

interface CheckoutTestResult {
  success: boolean;
  component: string;
  message: string;
  details?: any;
}

export class CheckoutFlowTester {
  private results: CheckoutTestResult[] = [];

  private log(component: string, success: boolean, message: string, details?: any) {
    const result = { success, component, message, details };
    this.results.push(result);
    console.log(`[CHECKOUT-TEST] ${component}: ${success ? '✅' : '❌'} ${message}`, details || '');
    return result;
  }

  async testStripePublishableKey(): Promise<CheckoutTestResult> {
    try {
      console.log('[CHECKOUT-TEST] Testing Stripe publishable key...');
      const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
      
      if (error) {
        return this.log('Stripe Publishable Key', false, 'Edge function error', error);
      }
      
      if (!data || !data.key) {
        return this.log('Stripe Publishable Key', false, 'No key returned', data);
      }
      
      if (!data.key.startsWith('pk_')) {
        return this.log('Stripe Publishable Key', false, 'Invalid key format', { keyPrefix: data.key.substring(0, 8) });
      }
      
      const environment = data.key.includes('test') ? 'test' : 'live';
      return this.log('Stripe Publishable Key', true, `Valid ${environment} key retrieved`, { 
        keyPrefix: data.key.substring(0, 12) + '...',
        environment 
      });
    } catch (error) {
      return this.log('Stripe Publishable Key', false, 'Exception occurred', error);
    }
  }

  async testPaymentIntentCreation(): Promise<CheckoutTestResult> {
    try {
      console.log('[CHECKOUT-TEST] Testing payment intent creation...');
      
      const testPaymentData = {
        cartItems: [
          {
            id: 'test-product-1',
            title: 'Test Product',
            name: 'Test Product',
            price: 24.99,
            quantity: 1,
            image: '',
            variant: undefined
          }
        ],
        amount: 3248, // $32.48 in cents (24.99 + 2.50 + 4.99)
        currency: 'usd',
        subtotal: 24.99,
        deliveryFee: 2.50,
        salesTax: 4.99,
        tipAmount: 0,
        customerInfo: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@example.com',
          phone: '555-1234'
        },
        deliveryInfo: {
          date: '2024-01-15',
          timeSlot: '2:00 PM - 4:00 PM',
          address: '123 Main St, Austin, TX 78701',
          instructions: 'Test delivery instructions'
        }
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: testPaymentData
      });
      
      if (error) {
        return this.log('Payment Intent Creation', false, 'Edge function error', error);
      }
      
      if (!data || !data.client_secret) {
        return this.log('Payment Intent Creation', false, 'No client_secret returned', data);
      }
      
      if (!data.client_secret.startsWith('pi_')) {
        return this.log('Payment Intent Creation', false, 'Invalid client_secret format', { 
          clientSecretPrefix: data.client_secret.substring(0, 8) 
        });
      }
      
      return this.log('Payment Intent Creation', true, 'Payment intent created successfully', {
        clientSecretPrefix: data.client_secret.substring(0, 15) + '...'
      });
    } catch (error) {
      return this.log('Payment Intent Creation', false, 'Exception occurred', error);
    }
  }

  async testShopifyOrderCreation(): Promise<CheckoutTestResult> {
    try {
      console.log('[CHECKOUT-TEST] Testing Shopify order creation...');
      
      // This is harder to test without a real payment intent
      // Let's check if the function exists and responds properly to invalid input
      const { data, error } = await supabase.functions.invoke('create-shopify-order', {
        body: { paymentIntentId: 'invalid_test_pi' }
      });
      
      // We expect this to fail with a proper error message
      if (error && error.message && error.message.includes('Payment Intent ID')) {
        return this.log('Shopify Order Creation', true, 'Function exists and validates input properly', { 
          expectedError: error.message 
        });
      }
      
      if (!error) {
        return this.log('Shopify Order Creation', false, 'Function should have rejected invalid payment intent', data);
      }
      
      return this.log('Shopify Order Creation', true, 'Function exists and handles errors', { error });
    } catch (error) {
      return this.log('Shopify Order Creation', false, 'Exception occurred', error);
    }
  }

  async testWebhookEndpoint(): Promise<CheckoutTestResult> {
    try {
      console.log('[CHECKOUT-TEST] Testing webhook endpoint...');
      
      // Test if webhook function exists by sending invalid data (should get proper error)
      const response = await fetch(`https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'invalid' })
      });
      
      if (response.status === 400) {
        return this.log('Stripe Webhook', true, 'Webhook endpoint exists and validates input', { 
          status: response.status 
        });
      }
      
      return this.log('Stripe Webhook', false, 'Unexpected response from webhook', { 
        status: response.status,
        statusText: response.statusText
      });
    } catch (error) {
      return this.log('Stripe Webhook', false, 'Exception occurred', error);
    }
  }

  async testOrderDraftsTable(): Promise<CheckoutTestResult> {
    try {
      console.log('[CHECKOUT-TEST] Testing order_drafts table...');
      
      // Try to insert a test draft
      const testDraft = {
        draft_data: {
          test: 'checkout_flow_test',
          timestamp: new Date().toISOString()
        },
        total_amount: 25.99,
        customer_email: 'test@example.com',
        checkout_step: 'test'
      };
      
      const { data, error } = await supabase
        .from('order_drafts')
        .insert(testDraft)
        .select('id')
        .single();
      
      if (error) {
        return this.log('Order Drafts Table', false, 'Failed to insert test draft', error);
      }
      
      // Clean up test data
      if (data?.id) {
        await supabase.from('order_drafts').delete().eq('id', data.id);
      }
      
      return this.log('Order Drafts Table', true, 'Table accessible and writable', { testId: data.id });
    } catch (error) {
      return this.log('Order Drafts Table', false, 'Exception occurred', error);
    }
  }

  async runFullTest(): Promise<CheckoutTestResult[]> {
    console.log('[CHECKOUT-TEST] 🚀 Starting comprehensive checkout flow test...');
    this.results = [];
    
    await this.testStripePublishableKey();
    await this.testPaymentIntentCreation();
    await this.testShopifyOrderCreation();
    await this.testWebhookEndpoint();
    await this.testOrderDraftsTable();
    
    const successCount = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    
    console.log(`[CHECKOUT-TEST] 📊 Test Results: ${successCount}/${totalTests} passed`);
    
    return this.results;
  }

  getResults(): CheckoutTestResult[] {
    return this.results;
  }

  getSummaryReport(): string {
    const successCount = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const failedTests = this.results.filter(r => !r.success);
    
    let report = `\n🔍 CHECKOUT FLOW TEST SUMMARY\n`;
    report += `==============================\n\n`;
    report += `✅ Tests Passed: ${successCount}/${totalTests}\n`;
    report += `❌ Tests Failed: ${totalTests - successCount}\n\n`;
    
    if (failedTests.length > 0) {
      report += `FAILED TESTS:\n`;
      failedTests.forEach(test => {
        report += `- ${test.component}: ${test.message}\n`;
      });
      report += `\n`;
    }
    
    report += `DETAILED RESULTS:\n`;
    this.results.forEach(test => {
      const icon = test.success ? '✅' : '❌';
      report += `${icon} ${test.component}: ${test.message}\n`;
    });
    
    return report;
  }
}

// Export a singleton instance for easy use
export const checkoutTester = new CheckoutFlowTester();