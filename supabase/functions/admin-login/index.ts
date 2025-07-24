import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[admin-login] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting admin login');

    // Parse request body
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    logStep('Request data parsed', { email });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin credentials using PostgreSQL's crypt function
    const { data: adminUser, error: authError } = await supabaseService
      .from('admin_users')
      .select('id, email, name')
      .eq('email', email)
      .eq('password_hash', supabaseService.rpc('crypt', { 
        password: password, 
        salt: supabaseService.rpc('get_password_hash', { user_email: email }) 
      }))
      .single();

    // Simplified approach - check if admin exists and verify password with crypt
    const { data: checkUser, error: checkError } = await supabaseService
      .rpc('verify_admin_password', { 
        input_email: email, 
        input_password: password 
      });

    if (checkError) {
      logStep('Error verifying admin password', checkError);
      // Create the verification function if it doesn't exist
      const { error: createFunctionError } = await supabaseService.sql`
        CREATE OR REPLACE FUNCTION verify_admin_password(input_email text, input_password text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          stored_hash text;
        BEGIN
          SELECT password_hash INTO stored_hash 
          FROM admin_users 
          WHERE email = input_email;
          
          IF stored_hash IS NULL THEN
            RETURN false;
          END IF;
          
          RETURN stored_hash = crypt(input_password, stored_hash);
        END;
        $$;
      `;

      if (createFunctionError) {
        logStep('Error creating verification function', createFunctionError);
        throw new Error("Authentication system error");
      }

      // Try again
      const { data: retryCheck, error: retryError } = await supabaseService
        .rpc('verify_admin_password', { 
          input_email: email, 
          input_password: password 
        });

      if (retryError || !retryCheck) {
        logStep('Authentication failed', { email });
        throw new Error("Invalid email or password");
      }
    } else if (!checkUser) {
      logStep('Authentication failed', { email });
      throw new Error("Invalid email or password");
    }

    // Get admin user details
    const { data: adminDetails, error: detailsError } = await supabaseService
      .from('admin_users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (detailsError) {
      logStep('Error fetching admin details', detailsError);
      throw new Error("Authentication error");
    }

    logStep('Admin authenticated successfully', { email: adminDetails.email });

    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: adminDetails.id,
          email: adminDetails.email,
          name: adminDetails.name
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in admin-login function', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Authentication failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      }
    );
  }
});