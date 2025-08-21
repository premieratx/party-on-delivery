import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      // Verify webhook signature in production using async method for Deno
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Webhook signature verification failed', { status: 400 });
      }
    } else {
      // For development/testing
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('📧 Stripe webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Try to process successful payment with retry logic
        try {
          await processOrderWithRetry(paymentIntent.id);
          console.log('✅ Shopify order created successfully');
          
          // Webhook processing completed successfully
          console.log('✅ Webhook processing completed');
        } catch (processError) {
          console.log('🚨 Order processing failed after retries, but payment succeeded:', processError);
          
          // Store failed order for manual review
          await supabase.from('failed_order_processing').insert({
            payment_intent_id: paymentIntent.id,
            error_message: processError instanceof Error ? processError.message : String(processError),
            payment_amount: paymentIntent.amount,
            customer_email: paymentIntent.metadata?.customer_email || 'unknown',
            retry_count: 3,
            requires_manual_review: true,
            created_at: new Date().toISOString()
          }).catch(dbError => {
            console.log('Failed to log failed order:', dbError);
          });
        }
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        // Handle failed payment if needed
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Retry logic for order processing with exponential backoff
async function processOrderWithRetry(paymentIntentId: string, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Order processing attempt ${attempt}/${maxRetries} for payment ${paymentIntentId}`);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabase.functions.invoke('create-shopify-order', {
        body: {
          paymentIntentId: paymentIntentId,
          retryAttempt: attempt
        }
      });
      
      console.log(`✅ Order processing succeeded on attempt ${attempt}`);
      return; // Success!
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
      // Don't retry on certain fatal errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Payment not completed') || 
          errorMessage.includes('Invalid amount') ||
          errorMessage.includes('No cart items found')) {
        console.log('🚨 Fatal error detected, not retrying:', errorMessage);
        throw error;
      }
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Order processing failed after all retries');
}