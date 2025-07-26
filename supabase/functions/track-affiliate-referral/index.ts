import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[track-affiliate-referral] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting affiliate referral tracking');

    // Parse request body
    const { 
      affiliateCode, 
      orderData,
      customerEmail,
      orderId
    } = await req.json();

    if (!affiliateCode || !orderData || !customerEmail) {
      throw new Error("Missing required fields");
    }

    logStep('Request data parsed', { affiliateCode, customerEmail, orderId });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find affiliate by code
    const { data: affiliate, error: affiliateError } = await supabaseService
      .from('affiliates')
      .select('id, commission_rate')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (affiliateError || !affiliate) {
      logStep('Affiliate not found', { affiliateCode });
      throw new Error("Affiliate not found");
    }

    // Calculate commission - get subtotal from multiple sources since Shopify order details may be incorrect
    let subtotal = 0;
    
    // Priority 1: Extract from order notes (format: "Subtotal: $29.99")
    if (orderData.note) {
      const subtotalMatch = orderData.note.match(/Subtotal:\s*\$?([\d,]+\.?\d*)/i);
      if (subtotalMatch) {
        subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
        logStep('Subtotal extracted from order notes', { subtotal });
      }
    }
    
    // Priority 2: Check for line items total (more reliable than order totals)
    if (subtotal === 0 && orderData.line_items) {
      subtotal = orderData.line_items.reduce((sum: number, item: any) => {
        const price = parseFloat(item.price || '0');
        const quantity = parseInt(item.quantity || '1');
        return sum + (price * quantity);
      }, 0);
      if (subtotal > 0) {
        logStep('Subtotal calculated from line items', { subtotal });
      }
    }
    
    // Priority 3: Try subtotal_price field
    if (subtotal === 0 && orderData.subtotal_price) {
      subtotal = parseFloat(orderData.subtotal_price);
      logStep('Subtotal from subtotal_price field', { subtotal });
    }
    
    // Priority 4: Fallback to total_price minus tax and shipping
    if (subtotal === 0 && orderData.total_price) {
      const total = parseFloat(orderData.total_price);
      const tax = parseFloat(orderData.total_tax || '0');
      const shipping = parseFloat(orderData.shipping_lines?.[0]?.price || '0');
      subtotal = total - tax - shipping;
      logStep('Subtotal calculated from total minus tax/shipping', { subtotal, total, tax, shipping });
    }
    
    // Final fallback
    if (subtotal === 0) {
      subtotal = parseFloat(orderData.subtotal || orderData.total_price || '0');
      logStep('Subtotal from fallback fields', { subtotal });
    }
    
    const commissionAmount = (subtotal * affiliate.commission_rate) / 100;

    logStep('Commission calculated', { subtotal, commissionRate: affiliate.commission_rate, commissionAmount });

    // Insert affiliate referral record
    const { data: referral, error: referralError } = await supabaseService
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        order_id: orderId,
        customer_email: customerEmail,
        subtotal: subtotal,
        commission_rate: affiliate.commission_rate,
        commission_amount: commissionAmount,
        paid_out: false
      })
      .select()
      .single();

    if (referralError) {
      logStep('Error inserting referral', referralError);
      throw new Error("Failed to track referral");
    }

    logStep('Referral tracked successfully', { referralId: referral.id });

    // Get affiliate details for Google Sheets
    const { data: affiliateDetails } = await supabaseService
      .from('affiliates')
      .select('name, total_commission')
      .eq('id', affiliate.id)
      .single();

    // Sync affiliate referral to Google Sheets (background task)
    supabaseService.functions.invoke('sync-google-sheets', {
      body: {
        type: 'affiliate_referral',
        data: {
          affiliateCode: affiliateCode,
          affiliateName: affiliateDetails?.name || 'Unknown',
          orderNumber: orderData.order_number || orderId,
          customerEmail: customerEmail,
          subtotal: subtotal,
          commissionAmount: commissionAmount,
          totalCommissionEarned: affiliateDetails?.total_commission || 0
        }
      }
    }).catch(error => logStep('Google Sheets sync error', error));

    return new Response(
      JSON.stringify({
        success: true,
        referral: {
          id: referral.id,
          commission_amount: commissionAmount
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in track-affiliate-referral function', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to track referral"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});