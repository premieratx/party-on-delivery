import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[verify-admin] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting admin verification');

    // Parse request body
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    logStep('Request data parsed', { email });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if email exists in admin_users table
    const { data: adminUser, error: adminError } = await supabaseService
      .from('admin_users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      logStep('Error checking admin user', adminError);
      throw new Error("Database error");
    }

    const isAdmin = !!adminUser;
    logStep('Admin check completed', { email, isAdmin });

    // Set admin context for RLS policies if user is admin
    if (isAdmin) {
      const { error: contextError } = await supabaseService.rpc('set_admin_context', {
        admin_email: email
      });
      
      if (contextError) {
        logStep('Error setting admin context', contextError);
        // Continue anyway, as this is not critical for verification
      } else {
        logStep('Admin context set successfully', { email });
      }
    }

    return new Response(
      JSON.stringify({
        isAdmin,
        admin: isAdmin ? {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name
        } : null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in verify-admin function', error);
    return new Response(
      JSON.stringify({ 
        isAdmin: false,
        message: error.message || "Verification failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});