import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[create-affiliate] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting affiliate creation');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep('User authenticated', { email: user.email });

    // Parse request body
    const { name, phone, companyName, email } = await req.json();

    if (!name || !companyName || !email) {
      throw new Error("Missing required fields: name, companyName, email");
    }

    logStep('Request data parsed', { name, companyName, email });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate affiliate code
    const { data: affiliateCodeData, error: codeError } = await supabaseService
      .rpc('generate_affiliate_code', { company_name: companyName });

    if (codeError) {
      logStep('Error generating affiliate code', codeError);
      throw new Error(`Failed to generate affiliate code: ${codeError.message}`);
    }

    const affiliateCode = affiliateCodeData;
    logStep('Generated affiliate code', affiliateCode);

    // Check if affiliate already exists
    const { data: existingAffiliate, error: checkError } = await supabaseService
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logStep('Error checking existing affiliate', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingAffiliate) {
      logStep('Affiliate already exists');
      throw new Error("An affiliate account already exists for this email");
    }

    // Create new affiliate
    const { data: newAffiliate, error: createError } = await supabaseService
      .from('affiliates')
      .insert({
        google_id: user.id,
        email: email,
        name: name,
        phone: phone || null,
        company_name: companyName,
        affiliate_code: affiliateCode,
        commission_rate: 5.00,
        total_sales: 0.00,
        total_commission: 0.00,
        commission_unpaid: 0.00,
        orders_count: 0,
        largest_order: 0.00,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      logStep('Error creating affiliate', createError);
      throw new Error(`Failed to create affiliate: ${createError.message}`);
    }

    logStep('Affiliate created successfully', { id: newAffiliate.id, code: affiliateCode });

    // TODO: Add Google Sheets integration here when needed
    // This would log the affiliate signup to a Google Sheet

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: newAffiliate.id,
          name: newAffiliate.name,
          companyName: newAffiliate.company_name,
          affiliateCode: newAffiliate.affiliate_code,
          commissionRate: newAffiliate.commission_rate
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in create-affiliate function', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});