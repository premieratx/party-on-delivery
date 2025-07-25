import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-ORDER-COMPLETE] ${step}${detailsStr}`);
};

// Standardized order data structure - SINGLE SOURCE OF TRUTH
interface StandardOrderData {
  // Payment Details (from Stripe - authoritative source)
  paymentIntentId?: string;
  sessionId?: string;
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount: number;
  discountAmount: number;
  totalAmount: number;
  discountCode?: string;
  
  // Customer Details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Delivery Details
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  deliveryInstructions?: string;
  
  // Order Items
  lineItems: Array<{
    id: string;
    title: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
  }>;
  
  // Affiliate Information
  affiliateCode?: string;
  affiliateId?: string;
  
  // Metadata
  isAddingToOrder?: boolean;
  useSameAddress?: boolean;
  groupOrderToken?: string;
}

// Extract standardized order data from Stripe metadata
function extractStandardOrderData(metadata: any, paymentIntentId?: string, sessionId?: string): StandardOrderData {
  const cartItems = JSON.parse(metadata?.cart_items || '[]');
  const deliveryAddress = metadata?.delivery_address || '';
  
  // Parse address components
  const addressParts = deliveryAddress.split(',').map((part: string) => part.trim());
  const street = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts[2] || '';
  const state = stateZip.split(' ')[0] || '';
  const zipCode = stateZip.split(' ')[1] || '';
  
  return {
    paymentIntentId,
    sessionId,
    subtotal: parseFloat(metadata?.subtotal || '0'),
    deliveryFee: parseFloat(metadata?.shipping_fee || '0'),
    salesTax: parseFloat(metadata?.sales_tax || '0'),
    tipAmount: parseFloat(metadata?.tip_amount || '0'),
    discountAmount: parseFloat(metadata?.discount_amount || '0'),
    totalAmount: parseFloat(metadata?.total_amount || '0'),
    discountCode: metadata?.discount_code,
    
    customerName: metadata?.customer_name || '',
    customerEmail: metadata?.customer_email || '',
    customerPhone: metadata?.customer_phone || '',
    
    deliveryDate: metadata?.delivery_date || '',
    deliveryTime: metadata?.delivery_time || '',
    deliveryAddress: {
      street,
      city,
      state,
      zipCode,
      fullAddress: deliveryAddress,
    },
    deliveryInstructions: metadata?.delivery_instructions,
    
    lineItems: cartItems,
    
    affiliateCode: metadata?.affiliate_code,
    affiliateId: metadata?.affiliate_id,
    
    isAddingToOrder: metadata?.is_adding_to_order === 'true',
    useSameAddress: metadata?.use_same_address === 'true',
    groupOrderToken: metadata?.group_order_token,
  };
}

// Process Shopify order creation with standardized data
async function createShopifyOrder(orderData: StandardOrderData): Promise<any> {
  logStep("Creating Shopify order");
  
  const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
  const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
  
  if (!shopifyToken) {
    throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not configured");
  }

  // Create customer first
  const customerData = {
    customer: {
      first_name: orderData.customerName.split(' ')[0] || '',
      last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      addresses: [{
        address1: orderData.deliveryAddress.street,
        city: orderData.deliveryAddress.city,
        province: orderData.deliveryAddress.state,
        country: "US",
        zip: orderData.deliveryAddress.zipCode,
        phone: orderData.customerPhone
      }]
    }
  };

  const customerResponse = await fetch(
    `https://${shopifyStore}/admin/api/2024-10/customers.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    }
  );

  let shopifyCustomer;
  if (customerResponse.ok) {
    const customerResult = await customerResponse.json();
    shopifyCustomer = customerResult.customer;
  }

  // Prepare line items
  const lineItems = orderData.lineItems.map(item => {
    if (item.id && item.id.includes('gid://shopify/Product/')) {
      const productId = item.id.replace('gid://shopify/Product/', '');
      
      if (item.variant && item.variant.includes('gid://shopify/ProductVariant/')) {
        const variantId = item.variant.replace('gid://shopify/ProductVariant/', '');
        return {
          variant_id: parseInt(variantId),
          quantity: item.quantity,
          price: item.price.toString()
        };
      } else {
        return {
          title: item.title || item.name,
          price: item.price.toString(),
          quantity: item.quantity,
          requires_shipping: true,
          product_id: parseInt(productId)
        };
      }
    } else {
      return {
        title: item.title || item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        requires_shipping: true
      };
    }
  });

  // Create order
  const orderPayload = {
    order: {
      line_items: lineItems,
      customer: shopifyCustomer ? { id: shopifyCustomer.id } : undefined,
      billing_address: {
        first_name: orderData.customerName.split(' ')[0] || '',
        last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
        address1: orderData.deliveryAddress.street,
        city: orderData.deliveryAddress.city,
        province: orderData.deliveryAddress.state,
        country: "US",
        zip: orderData.deliveryAddress.zipCode,
        phone: orderData.customerPhone,
      },
      shipping_address: {
        first_name: orderData.customerName.split(' ')[0] || '',
        last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
        address1: orderData.deliveryAddress.street,
        city: orderData.deliveryAddress.city,
        province: orderData.deliveryAddress.state,
        country: "US",
        zip: orderData.deliveryAddress.zipCode,
        phone: orderData.customerPhone,
      },
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      financial_status: 'paid',
      fulfillment_status: 'unfulfilled',
      shipping_lines: orderData.deliveryFee > 0 ? [{
        title: "Scheduled Delivery Service",
        price: orderData.deliveryFee.toString(),
        code: "DELIVERY"
      }] : [],
      tax_lines: orderData.salesTax > 0 ? [{
        title: "Sales Tax",
        price: orderData.salesTax.toString(),
        rate: 0.0825
      }] : [],
      ...(orderData.discountCode && orderData.discountAmount > 0 && {
        discount_codes: [{
          code: orderData.discountCode,
          amount: Math.abs(orderData.discountAmount).toString(),
          type: 'fixed_amount'
        }]
      }),
      subtotal_price: orderData.subtotal.toString(),
      total_tax: orderData.salesTax.toString(),
      total_shipping_price_set: {
        shop_money: {
          amount: orderData.deliveryFee.toString(),
          currency_code: "USD"
        }
      },
      total_tips_set: {
        shop_money: {
          amount: orderData.tipAmount.toString(),
          currency_code: "USD"
        }
      },
      current_total_price: orderData.totalAmount.toString(),
      total_price: orderData.totalAmount.toString(),
      note: `🚚 DELIVERY ORDER 
📅 Delivery: ${orderData.deliveryDate} at ${orderData.deliveryTime}
📍 Address: ${orderData.deliveryAddress.fullAddress}
${orderData.deliveryInstructions ? `📝 Instructions: ${orderData.deliveryInstructions}` : ''}
${orderData.discountCode ? `🎟️ Discount: ${orderData.discountCode} (-$${orderData.discountAmount.toFixed(2)})` : ''}
💳 Payment: ${orderData.paymentIntentId || orderData.sessionId}

💰 PAYMENT BREAKDOWN:
Subtotal: $${orderData.subtotal.toFixed(2)}
Delivery: $${orderData.deliveryFee.toFixed(2)}
Tax: $${orderData.salesTax.toFixed(2)}
Tip: $${orderData.tipAmount.toFixed(2)}
TOTAL: $${orderData.totalAmount.toFixed(2)}`,
      tags: `delivery-order,stripe-payment${orderData.discountCode ? `,discount-${orderData.discountCode}` : ''}`,
    }
  };

  const orderResponse = await fetch(
    `https://${shopifyStore}/admin/api/2024-10/orders.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    }
  );

  if (!orderResponse.ok) {
    const errorText = await orderResponse.text();
    throw new Error(`Failed to create Shopify order: ${errorText}`);
  }

  const orderResult = await orderResponse.json();
  logStep("Shopify order created", { orderId: orderResult.order.id, orderNumber: orderResult.order.order_number });
  
  return orderResult.order;
}

// Store order in customer_orders table
async function storeCustomerOrder(orderData: StandardOrderData, shopifyOrder: any, supabase: any): Promise<any> {
  logStep("Storing customer order");
  
  // Get or create customer
  let customer;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('email', orderData.customerEmail)
    .maybeSingle();

  if (existingCustomer) {
    customer = existingCustomer;
    await supabase
      .from('customers')
      .update({
        total_orders: existingCustomer.total_orders + 1,
        total_spent: Number(existingCustomer.total_spent) + orderData.totalAmount,
        last_login_at: new Date().toISOString()
      })
      .eq('id', existingCustomer.id);
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: orderData.customerEmail,
        first_name: orderData.customerName.split(' ')[0] || null,
        last_name: orderData.customerName.split(' ').slice(1).join(' ') || null,
        phone: orderData.customerPhone,
        total_orders: 1,
        total_spent: orderData.totalAmount,
        referred_by_code: orderData.affiliateCode,
        referred_by_affiliate_id: orderData.affiliateId
      })
      .select()
      .single();

    if (customerError) throw customerError;
    customer = newCustomer;
  }

  // Create customer order record
  const { data: customerOrder, error: orderError } = await supabase
    .from('customer_orders')
    .insert({
      customer_id: customer.id,
      order_number: shopifyOrder.order_number,
      shopify_order_id: shopifyOrder.id.toString(),
      session_id: orderData.sessionId,
      status: 'confirmed',
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      total_amount: orderData.totalAmount,
      delivery_date: orderData.deliveryDate,
      delivery_time: orderData.deliveryTime,
      delivery_address: {
        street: orderData.deliveryAddress.street,
        city: orderData.deliveryAddress.city,
        state: orderData.deliveryAddress.state,
        zipCode: orderData.deliveryAddress.zipCode,
        instructions: orderData.deliveryInstructions
      },
      special_instructions: orderData.deliveryInstructions,
      line_items: orderData.lineItems,
      affiliate_code: orderData.affiliateCode,
      affiliate_id: orderData.affiliateId
    })
    .select()
    .single();

  if (orderError) throw orderError;
  
  logStep("Customer order stored", { orderId: customerOrder.id });
  return { customer, customerOrder };
}

// Track affiliate referral
async function trackAffiliateReferral(orderData: StandardOrderData, shopifyOrder: any, supabase: any): Promise<void> {
  if (!orderData.affiliateCode) return;
  
  logStep("Tracking affiliate referral", { affiliateCode: orderData.affiliateCode });
  
  try {
    const { data: result, error } = await supabase.functions.invoke('track-affiliate-referral', {
      body: {
        affiliateCode: orderData.affiliateCode,
        orderData: shopifyOrder,
        customerEmail: orderData.customerEmail,
        orderId: shopifyOrder.id.toString()
      }
    });
    
    if (error) {
      logStep("Affiliate tracking error", error);
    } else {
      logStep("Affiliate referral tracked", result);
    }
  } catch (error) {
    logStep("Exception in affiliate tracking", error);
  }
}

// Send email confirmations
async function sendEmailConfirmations(orderData: StandardOrderData, shopifyOrder: any, supabase: any): Promise<void> {
  logStep("Sending email confirmations");
  
  try {
    const emailData = {
      orderDetails: {
        orderNumber: shopifyOrder.order_number,
        orderId: shopifyOrder.id
      },
      customerInfo: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone
      },
      deliveryInfo: {
        date: orderData.deliveryDate,
        timeSlot: orderData.deliveryTime,
        address: orderData.deliveryAddress.fullAddress,
        instructions: orderData.deliveryInstructions
      },
      cartItems: orderData.lineItems,
      paymentInfo: {
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        salesTax: orderData.salesTax,
        tipAmount: orderData.tipAmount,
        discountAmount: orderData.discountAmount,
        discountCode: orderData.discountCode,
        total: orderData.totalAmount
      },
      shopifyOrderInfo: {
        shopifyOrderId: shopifyOrder.id,
        orderNumber: shopifyOrder.order_number
      }
    };

    const { data: result, error } = await supabase.functions.invoke('send-order-confirmation', {
      body: emailData
    });
    
    if (error) {
      logStep("Email confirmation error", error);
    } else {
      logStep("Email confirmations sent", result);
    }
  } catch (error) {
    logStep("Exception in email confirmations", error);
  }
}

// Send SMS notifications
async function sendSMSNotifications(orderData: StandardOrderData, shopifyOrder: any, supabase: any): Promise<void> {
  logStep("Sending SMS notifications");
  
  try {
    const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-order-sms', {
      body: {
        orderData: {
          orderNumber: shopifyOrder.order_number,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryDate: orderData.deliveryDate,
          deliveryTime: orderData.deliveryTime,
          deliveryAddress: orderData.deliveryAddress.fullAddress,
          totalAmount: orderData.totalAmount,
          lineItems: orderData.lineItems
        },
        notifyCustomer: true,
        notifyAdmin: true,
        adminPhone: "+1234567890" // Replace with actual admin phone
      }
    });
    
    if (smsError) {
      logStep("SMS notifications error", smsError);
    } else {
      logStep("SMS notifications sent", smsResult);
    }
    
  } catch (error) {
    logStep("Exception in SMS notifications", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Order processing started");

    const body = await req.json();
    const { paymentIntentId, sessionId, isAddingToOrder, useSameAddress } = body;
    
    if (!paymentIntentId && !sessionId) {
      throw new Error("Payment Intent ID or Session ID is required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get payment details from Stripe and extract standardized data
    let metadata;
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        throw new Error("Payment not completed");
      }
      metadata = paymentIntent.metadata;
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        throw new Error("Payment not completed");
      }
      metadata = session.metadata;
    }

    // Extract standardized order data - SINGLE SOURCE OF TRUTH
    const orderData = extractStandardOrderData(metadata, paymentIntentId, sessionId);
    logStep("Standardized order data extracted", { 
      customerEmail: orderData.customerEmail,
      totalAmount: orderData.totalAmount,
      itemCount: orderData.lineItems.length 
    });

    // CRITICAL: Verify amount integrity
    const calculatedTotal = orderData.subtotal + orderData.deliveryFee + orderData.salesTax + orderData.tipAmount - orderData.discountAmount;
    if (Math.abs(orderData.totalAmount - calculatedTotal) > 0.01) {
      throw new Error(`Amount mismatch: Expected $${calculatedTotal.toFixed(2)}, got $${orderData.totalAmount.toFixed(2)}`);
    }

    // Process all operations with standardized data
    const shopifyOrder = await createShopifyOrder(orderData);
    const { customer, customerOrder } = await storeCustomerOrder(orderData, shopifyOrder, supabase);
    
    // Run notifications in parallel (background tasks)
    const notifications = Promise.all([
      trackAffiliateReferral(orderData, shopifyOrder, supabase),
      sendEmailConfirmations(orderData, shopifyOrder, supabase),
      sendSMSNotifications(orderData, shopifyOrder, supabase)
    ]);

    // Don't wait for notifications to complete - let them run in background
    notifications.catch(error => logStep("Notification error", error));

    logStep("Order processing completed successfully", {
      shopifyOrderId: shopifyOrder.id,
      orderNumber: shopifyOrder.order_number,
      customerId: customer.id,
      customerOrderId: customerOrder.id
    });

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: shopifyOrder.id,
        order_number: shopifyOrder.order_number,
        customer_id: customer.id,
        customer_order_id: customerOrder.id,
        total_amount: orderData.totalAmount
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in order processing", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});