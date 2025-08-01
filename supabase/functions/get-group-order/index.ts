import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shareToken } = await req.json();

    console.log('🎯 get-group-order: Looking for token:', shareToken);

    if (!shareToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Share token is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Use our robust database function to find the group order
    const { data, error } = await supabase.rpc('get_group_order_details', {
      p_share_token: shareToken
    });

    console.log('🎯 get-group-order: Database response:', { data, error });

    if (error) {
      console.error('🎯 get-group-order: Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${error.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // The function returns a JSON object with success/error info
    if (!data?.success) {
      console.log('🎯 get-group-order: Group order not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data?.error || 'Group order not found',
          searched_token: shareToken
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log('🎯 get-group-order: SUCCESS! Found order:', data.order?.order_number);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: data.order 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('🎯 get-group-order: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});