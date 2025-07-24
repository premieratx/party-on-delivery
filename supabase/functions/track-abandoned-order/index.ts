import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[track-abandoned-order] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting abandoned order tracking');

    // Parse request body
    const { 
      sessionId, 
      customerEmail,
      customerName,
      customerPhone,
      deliveryAddress,
      affiliateCode,
      cartItems,
      subtotal,
      totalAmount
    } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep('Request data parsed', { sessionId, customerEmail, affiliateCode });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let affiliateId = null;

    // Find affiliate by code if provided
    if (affiliateCode) {
      const { data: affiliate, error: affiliateError } = await supabaseService
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .single();

      if (!affiliateError && affiliate) {
        affiliateId = affiliate.id;
        logStep('Affiliate found', { affiliateId });
      }
    }

    // Check if abandoned order already exists for this session
    const { data: existingOrder, error: existingError } = await supabaseService
      .from('abandoned_orders')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingError) {
      logStep('Error checking existing order', existingError);
    }

    const orderData = {
      session_id: sessionId,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      affiliate_code: affiliateCode,
      affiliate_id: affiliateId,
      cart_items: cartItems || [],
      subtotal: subtotal ? parseFloat(subtotal) : null,
      total_amount: totalAmount ? parseFloat(totalAmount) : null,
      abandoned_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    };

    let result;
    if (existingOrder) {
      // Update existing abandoned order
      const { data: updatedOrder, error: updateError } = await supabaseService
        .from('abandoned_orders')
        .update(orderData)
        .eq('id', existingOrder.id)
        .select()
        .single();

      if (updateError) {
        logStep('Error updating abandoned order', updateError);
        throw new Error("Failed to update abandoned order");
      }

      result = updatedOrder;
      logStep('Abandoned order updated', { orderId: result.id });
    } else {
      // Insert new abandoned order record
      const { data: abandonedOrder, error: abandonedError } = await supabaseService
        .from('abandoned_orders')
        .insert(orderData)
        .select()
        .single();

      if (abandonedError) {
        logStep('Error inserting abandoned order', abandonedError);
        throw new Error("Failed to track abandoned order");
      }

      result = abandonedOrder;
      logStep('Abandoned order tracked', { orderId: result.id });
    }

    return new Response(
      JSON.stringify({
        success: true,
        abandonedOrder: {
          id: result.id,
          session_id: result.session_id
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in track-abandoned-order function', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to track abandoned order"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});