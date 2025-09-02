import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    console.log(`🔐 Admin login attempt for: ${email}`);
    
    if (!email || !password) {
      console.log(`❌ Missing credentials`);
      return new Response(JSON.stringify({ success: false, message: "Email and password are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin password using the RPC function
    console.log(`🔍 Verifying admin password for: ${email}`);
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_admin_password', { input_email: email, input_password: password });

    if (verifyError) {
      console.log(`❌ Password verification error:`, verifyError);
      return new Response(JSON.stringify({ success: false, message: "Authentication error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    if (!isValid) {
      console.log(`❌ Invalid credentials for: ${email}`);
      return new Response(JSON.stringify({ success: false, message: "Invalid email or password" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Fetch admin details
    console.log(`✅ Password verified, fetching admin details`);
    const { data: admin, error: detailsError } = await supabase
      .from('admin_users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (detailsError || !admin) {
      console.log(`❌ Failed to fetch admin details:`, detailsError);
      return new Response(JSON.stringify({ success: false, message: "Authentication error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Set admin context for RLS policies
    await supabase.rpc('set_admin_context', { admin_email: email });
    
    console.log(`🎉 Admin login successful for: ${email}`);
    return new Response(JSON.stringify({ 
      success: true, 
      admin,
      message: "Login successful"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error(`💥 Admin login error:`, e);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Authentication failed",
      error: e.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
