import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplyVoucherRequest {
  voucher_id: string;
  customer_email: string;
  order_id?: string;
  amount_used: number;
  cart_subtotal: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      voucher_id, 
      customer_email, 
      order_id, 
      amount_used, 
      cart_subtotal 
    }: ApplyVoucherRequest = await req.json();

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`[APPLY-VOUCHER] Applying voucher: ${voucher_id} for customer: ${customer_email}`);

    // Get voucher details
    const { data: voucher, error: voucherError } = await supabaseService
      .from('vouchers')
      .select(`
        *,
        affiliates (
          id,
          name,
          affiliate_code
        )
      `)
      .eq('id', voucher_id)
      .single();

    if (voucherError || !voucher) {
      throw new Error('Voucher not found');
    }

    // Calculate remaining balance for prepaid credit vouchers
    let remaining_balance = 0;
    if (voucher.voucher_type === 'prepaid_credit') {
      const { data: previousUsage } = await supabaseService
        .from('voucher_usage')
        .select('remaining_balance')
        .eq('voucher_id', voucher_id)
        .eq('customer_email', customer_email)
        .order('used_at', { ascending: false })
        .limit(1);

      const currentBalance = previousUsage && previousUsage.length > 0 
        ? previousUsage[0].remaining_balance 
        : voucher.prepaid_amount || 0;
      
      remaining_balance = currentBalance - amount_used;
    }

    // Record voucher usage
    const { error: usageError } = await supabaseService
      .from('voucher_usage')
      .insert({
        voucher_id,
        customer_email,
        order_id,
        amount_used,
        remaining_balance: remaining_balance > 0 ? remaining_balance : 0
      });

    if (usageError) {
      throw usageError;
    }

    // Update voucher usage count
    const { error: updateError } = await supabaseService
      .from('vouchers')
      .update({ 
        current_uses: voucher.current_uses + 1 
      })
      .eq('id', voucher_id);

    if (updateError) {
      throw updateError;
    }

    // Record affiliate commission if applicable
    if (voucher.affiliate_id && voucher.commission_rate > 0) {
      const commission_amount = (cart_subtotal * voucher.commission_rate) / 100;
      
      const { error: commissionError } = await supabaseService
        .from('affiliate_referrals')
        .insert({
          affiliate_id: voucher.affiliate_id,
          customer_email,
          order_id,
          subtotal: cart_subtotal,
          commission_amount,
          commission_rate: voucher.commission_rate,
          paid_out: false
        });

      if (commissionError) {
        console.error('[APPLY-VOUCHER] Commission recording error:', commissionError);
        // Don't fail the request for commission errors
      }
    }

    console.log(`[APPLY-VOUCHER] Successfully applied voucher: ${voucher_id}`);

    return new Response(JSON.stringify({
      success: true,
      remaining_balance,
      amount_used,
      voucher_type: voucher.voucher_type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[APPLY-VOUCHER] Error:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});