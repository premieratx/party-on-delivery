import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoucherValidationRequest {
  voucher_code: string;
  cart_subtotal: number;
  customer_email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voucher_code, cart_subtotal, customer_email }: VoucherValidationRequest = await req.json();

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`[VALIDATE-VOUCHER] Validating voucher: ${voucher_code} for subtotal: ${cart_subtotal}`);

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
      .eq('voucher_code', voucher_code)
      .eq('is_active', true)
      .single();

    if (voucherError || !voucher) {
      console.log(`[VALIDATE-VOUCHER] Voucher not found or inactive: ${voucher_code}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Voucher not found or inactive' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check expiration
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      console.log(`[VALIDATE-VOUCHER] Voucher expired: ${voucher_code}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Voucher has expired' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check usage limits
    if (voucher.current_uses >= voucher.max_uses) {
      console.log(`[VALIDATE-VOUCHER] Voucher usage limit reached: ${voucher_code}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Voucher usage limit reached' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check minimum spend
    if (cart_subtotal < voucher.minimum_spend) {
      console.log(`[VALIDATE-VOUCHER] Minimum spend not met: ${cart_subtotal} < ${voucher.minimum_spend}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: `Minimum spend of $${voucher.minimum_spend} required`,
        minimum_spend: voucher.minimum_spend
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get remaining balance for prepaid credit vouchers
    let remaining_balance = null;
    if (voucher.voucher_type === 'prepaid_credit' && customer_email) {
      const { data: usage } = await supabaseService
        .from('voucher_usage')
        .select('remaining_balance')
        .eq('voucher_id', voucher.id)
        .eq('customer_email', customer_email)
        .order('used_at', { ascending: false })
        .limit(1);

      remaining_balance = usage && usage.length > 0 
        ? usage[0].remaining_balance 
        : voucher.prepaid_amount;
    }

    // Calculate discount amount
    let discount_amount = 0;
    switch (voucher.voucher_type) {
      case 'percentage':
        discount_amount = (cart_subtotal * (voucher.discount_value || 0)) / 100;
        break;
      case 'fixed_amount':
        discount_amount = Math.min(voucher.discount_value || 0, cart_subtotal);
        break;
      case 'prepaid_credit':
        discount_amount = Math.min(remaining_balance || 0, cart_subtotal);
        break;
    }

    console.log(`[VALIDATE-VOUCHER] Valid voucher: ${voucher_code}, discount: ${discount_amount}`);

    return new Response(JSON.stringify({
      valid: true,
      voucher: {
        id: voucher.id,
        voucher_code: voucher.voucher_code,
        voucher_name: voucher.voucher_name,
        voucher_type: voucher.voucher_type,
        discount_value: voucher.discount_value,
        prepaid_amount: voucher.prepaid_amount,
        minimum_spend: voucher.minimum_spend,
        expires_at: voucher.expires_at,
        remaining_balance,
        affiliate: voucher.affiliates,
        commission_rate: voucher.commission_rate
      },
      discount_amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[VALIDATE-VOUCHER] Error:`, error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Internal server error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});