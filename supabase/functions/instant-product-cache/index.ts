// COMPLETELY DISABLED - FORCE CLEAN BUILD v2025_01_14_21_10
// This function is disabled to prevent all preloading

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🚫 Instant cache DISABLED - no preloading')
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Instant cache disabled',
      data: { products: [], collections: [] }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})