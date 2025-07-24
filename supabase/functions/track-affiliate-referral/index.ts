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

    // Calculate commission
    const subtotal = parseFloat(orderData.subtotal || orderData.total_price || '0');
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