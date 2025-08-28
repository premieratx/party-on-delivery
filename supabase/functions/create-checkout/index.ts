import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced logging function
async function logEvent(supabase: any, eventType: string, operation: string, data: any, error?: any) {
  try {
    await supabase.rpc('log_system_event', {
      p_event_type: eventType,
      p_service_name: 'stripe_checkout',
      p_operation: operation,
      p_request_data: data,
      p_error_details: error,
      p_severity: error ? 'error' : 'info'
    });
  } catch (logError) {
    console.error('Failed to log event:', logError);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { 
      cartItems, 
      customerInfo, 
      deliveryInfo, 
      subtotal, 
      deliveryFee, 
      salesTax, 
      tipAmount = 0,
      appliedDiscount,
      affiliateCode 
    } = await req.json();

    console.log('🛒 Creating Stripe checkout session...');
    
    // Log checkout initiation
    await logEvent(supabase, 'checkout_initiated', 'create_session', {
      cart_items_count: cartItems?.length || 0,
      subtotal,
      delivery_fee: deliveryFee,
      sales_tax: salesTax,
      tip_amount: tipAmount,
      affiliate_code: affiliateCode
    });

    // Calculate total with detailed logging
    const totalAmount = Math.round((subtotal + deliveryFee + salesTax + tipAmount) * 100);
    
    console.log('💰 Checkout Session Amount Details:', {
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      sales_tax: salesTax,
      tip_amount: tipAmount,
      calculated_total_dollars: (subtotal + deliveryFee + salesTax + tipAmount).toFixed(2),
      total_amount_cents: totalAmount,
      total_amount_dollars: (totalAmount / 100).toFixed(2)
    });

    // Validate amount
    if (totalAmount < 50 || totalAmount > 1000000) {
      const error = new Error(`Invalid total: $${(totalAmount / 100).toFixed(2)}`);
      await logEvent(supabase, 'checkout_validation_failed', 'amount_validation', {
        total_amount: totalAmount,
        subtotal,
        delivery_fee: deliveryFee,
        sales_tax: salesTax,
        tip_amount: tipAmount
      }, error);
      throw error;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Build line items
    const lineItems = [];

    cartItems.forEach((item: any) => {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title || item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });
    });

    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Delivery Fee' },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    if (salesTax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Sales Tax' },
          unit_amount: Math.round(salesTax * 100),
        },
        quantity: 1,
      });
    }

    if (tipAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Driver Tip' },
          unit_amount: Math.round(tipAmount * 100),
        },
        quantity: 1,
      });
    }

    // Handle existing/new customer
    const customers = await stripe.customers.list({
      email: customerInfo.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customerInfo.email,
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        phone: customerInfo.phone,
      });
      customerId = customer.id;
    }

    // Build full delivery address string
    const fullDeliveryAddress = deliveryInfo?.address ? 
      `${deliveryInfo.address.street}, ${deliveryInfo.address.city}, ${deliveryInfo.address.state} ${deliveryInfo.address.zipCode}` : '';

    // Create session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout?cancelled=true`,
      metadata: {
        // Customer information
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || '',
        
        // Delivery information with CST timezone
        delivery_date: deliveryInfo?.date || '',
        delivery_time: deliveryInfo?.timeSlot || '',
        delivery_timezone: 'America/Chicago', // Ensure CST timezone is documented
        delivery_address: fullDeliveryAddress,
        delivery_instructions: deliveryInfo?.specialInstructions || '',
        
        // Order amounts (all in dollars for consistency)
        subtotal: subtotal.toString(),
        delivery_fee: deliveryFee.toString(),
        sales_tax: salesTax.toString(),
        tip_amount: tipAmount.toString(),
        total_amount: (totalAmount / 100).toString(), // Convert cents back to dollars
        
        // Cart items (JSON string)
        cart_items: JSON.stringify(cartItems),
        
        // Other
        affiliate_code: affiliateCode || '',
        applied_discount: appliedDiscount ? JSON.stringify(appliedDiscount) : '',
      },
    });

    console.log('✅ Checkout session created:', session.id);

    // 🔒 SECURITY: Schedule cleanup of sensitive payment data after 24 hours
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      // Call general cleanup function to remove any expired data
      await supabase.rpc('cleanup_sensitive_payment_data');
      console.log('🔒 Scheduled cleanup of expired payment data');
    } catch (cleanupError) {
      console.log('⚠️ Warning: Failed to schedule payment data cleanup:', cleanupError);
      // Don't fail checkout creation
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});