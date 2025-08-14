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

  console.log('🚫 Lightning Sync DISABLED - no preloading')
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Lightning sync disabled',
      data: { products: [], collections: [] }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})