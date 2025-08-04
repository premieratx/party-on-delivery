import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      session_id, 
      cart_items, 
      customer_email, 
      customer_name, 
      customer_phone, 
      delivery_address,
      subtotal,
      total_amount,
      affiliate_code 
    } = await req.json()

    console.log('🛒 Tracking abandoned cart for session:', session_id)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if cart has items
    if (!cart_items || cart_items.length === 0) {
      console.log('No cart items to track')
      return new Response(
        JSON.stringify({ success: true, message: 'No items to track' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get affiliate ID if affiliate code provided
    let affiliate_id = null
    if (affiliate_code) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliate_code)
        .single()
      
      affiliate_id = affiliate?.id
    }

    // Insert or update abandoned order
    const { data, error } = await supabase
      .from('abandoned_orders')
      .upsert({
        session_id,
        cart_items,
        customer_email,
        customer_name,
        customer_phone,
        delivery_address,
        subtotal: subtotal || 0,
        total_amount: total_amount || 0,
        affiliate_code,
        affiliate_id,
        last_activity_at: new Date().toISOString(),
        abandoned_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })

    if (error) {
      console.error('Error tracking abandoned cart:', error)
      throw error
    }

    console.log('✅ Abandoned cart tracked successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        abandoned_order_id: data?.id || 'updated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error tracking abandoned cart:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})