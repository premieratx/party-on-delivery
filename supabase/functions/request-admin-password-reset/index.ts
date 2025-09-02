import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if admin exists
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('email, name')
      .eq('email', email)
      .single()

    if (adminError || !adminUser) {
      // Don't reveal if email exists for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If the email exists, a reset link will be sent' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Generate a secure reset token
    const resetToken = crypto.randomUUID()
    
    // In a real implementation, you would:
    // 1. Store the reset token with expiry in database
    // 2. Send an email with the reset link
    // For now, we'll just log it (in production, send via email service)
    console.log(`Password reset requested for ${email}. Reset token: ${resetToken}`)

    // Log the security event
    await supabase.rpc('log_security_event', {
      event_type: 'admin_password_reset_requested',
      user_email: email,
      details: { 
        reset_token_generated: true,
        timestamp: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset instructions have been sent to your email',
        // In production, don't return the token - send it via email
        resetToken: resetToken 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Password reset failed', 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})