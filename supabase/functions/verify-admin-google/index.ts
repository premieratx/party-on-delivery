import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🔍 Admin verification request received')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()
    
    if (!email) {
      console.log('❌ No email provided')
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'No email provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Verifying admin status for: ${email}`)

    // Check if user is admin
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error)
      return new Response(
        JSON.stringify({ isAdmin: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAdmin = !!adminUser
    console.log(`${isAdmin ? '✅' : '❌'} Admin verification result for ${email}: ${isAdmin}`)

    if (isAdmin) {
      // Set admin context for RLS policies
      await supabase.rpc('set_admin_context', { admin_email: email })
      console.log('🔑 Admin context set successfully')
    }

    return new Response(
      JSON.stringify({ 
        isAdmin,
        adminUser: isAdmin ? adminUser : null 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Verification error:', error)
    return new Response(
      JSON.stringify({ isAdmin: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})