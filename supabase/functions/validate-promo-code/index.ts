import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromoCode {
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  is_active: boolean;
  expires_at?: string;
  minimum_order_amount?: number;
  usage_limit?: number;
  usage_count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { code, orderAmount = 0 } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Promo code is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // **HARDCODED PROMO CODES** - High priority codes that should always work
    const hardcodedCodes: { [key: string]: PromoCode } = {
      'PREMIER2025': {
        code: 'PREMIER2025',
        discount_type: 'free_shipping',
        discount_value: 0, // Free shipping
        is_active: true
      },
      'FREEDELIVERY': {
        code: 'FREEDELIVERY',
        discount_type: 'fixed_amount',
        discount_value: 20, // Covers typical delivery fee
        is_active: true
      },
      'FREESHIP': {
        code: 'FREESHIP', 
        discount_type: 'fixed_amount',
        discount_value: 20,
        is_active: true
      },
      'WELCOME10': {
        code: 'WELCOME10',
        discount_type: 'percentage', 
        discount_value: 10,
        is_active: true
      },
      'SAVE15': {
        code: 'SAVE15',
        discount_type: 'percentage',
        discount_value: 15, 
        is_active: true
      }
    };

    const upperCode = code.toUpperCase();

    // Check hardcoded codes first (always prioritized)
    if (hardcodedCodes[upperCode]) {
      const promoCode = hardcodedCodes[upperCode];
      console.log('✅ Using hardcoded promo code:', code);
      
      // Calculate discount and determine message
      let discountAmount = 0;
      let message = '';
      let appliesTo = 'subtotal';
      
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (orderAmount * promoCode.discount_value) / 100;
        message = `${promoCode.discount_value}% discount applied!`;
      } else if (promoCode.discount_type === 'free_shipping') {
        // Free shipping code
        discountAmount = 0;
        message = 'Free shipping applied!';
        appliesTo = 'delivery';
      } else {
        // Fixed amount applies to delivery fee
        discountAmount = promoCode.discount_value;
        message = promoCode.discount_value > 0 
          ? `$${promoCode.discount_value} discount applied!`
          : 'Free delivery applied!';
        appliesTo = 'delivery';
      }
      
      return new Response(
        JSON.stringify({
          valid: true,
          code: promoCode.code,
          discountType: promoCode.discount_type,
          discountValue: promoCode.discount_value,
          discountAmount: Math.round(discountAmount * 100) / 100,
          appliesTo: appliesTo,
          isFreeShipping: promoCode.discount_type === 'free_shipping',
          message: message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If not a hardcoded code, check database (if promo_codes table exists)
    try {
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', upperCode)
        .eq('is_active', true)
        .single();

      if (error || !promoCode) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Invalid or expired promo code' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate expiration
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Promo code has expired' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate usage limit
      if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Promo code usage limit reached' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate minimum order amount
      if (promoCode.minimum_order_amount && orderAmount < promoCode.minimum_order_amount) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `Minimum order amount of $${promoCode.minimum_order_amount} required` 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Calculate discount
      let discountAmount = 0;
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (orderAmount * promoCode.discount_value) / 100;
      } else {
        discountAmount = promoCode.discount_value;
      }

      return new Response(
        JSON.stringify({ 
          valid: true, 
          code: promoCode.code,
          discount_type: promoCode.discount_type,
          discount_value: promoCode.discount_value,
          discount_amount: Math.round(discountAmount * 100) / 100,
          message: `${promoCode.discount_type === 'percentage' ? promoCode.discount_value + '%' : '$' + promoCode.discount_value} discount applied!`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (dbError) {
      // If database query fails, return invalid (table might not exist yet)
      console.log('Database check failed, using test codes only:', dbError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired promo code' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Promo code validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});