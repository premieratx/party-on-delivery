import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, action } = await req.json();

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (action === 'login') {
      // Verify admin credentials
      const { data: isValid, error } = await supabase.rpc('verify_admin_password', {
        input_email: email,
        input_password: password
      });

      if (error) {
        console.error('Admin verification error:', error);
        return new Response(
          JSON.stringify({ success: false, message: 'Authentication failed' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      if (isValid) {
        // Log successful admin login
        await supabase.rpc('log_security_event', {
          event_type: 'admin_login_success',
          user_email: email,
          details: { timestamp: new Date().toISOString(), ip: req.headers.get('x-forwarded-for') }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Login successful',
            admin_email: email
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        // Log failed login attempt
        await supabase.rpc('log_security_event', {
          event_type: 'admin_login_failed',
          user_email: email,
          details: { reason: 'invalid_credentials', timestamp: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});