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
    const { name, phone, companyName, venmoHandle, email, deliveryAddress, isAdminCreated } = await req.json();

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

    // Check for duplicate names with different emails (for admin alerts)
    const { data: existingNames, error: nameCheckError } = await supabaseService
      .from('affiliates')
      .select('name, email, company_name')
      .eq('name', name)
      .neq('email', email);

    if (nameCheckError) {
      logStep('Error checking duplicate names', nameCheckError);
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
        venmo_handle: venmoHandle || null,
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

    // Create notifications
    try {
      // Create duplicate name notification if needed
      if (existingNames && existingNames.length > 0) {
        const duplicateEmails = existingNames.map(a => a.email).join(', ');
        await supabaseService
          .from('admin_notifications')
          .insert({
            type: 'duplicate_name',
            title: 'Duplicate Name Alert',
            message: `New affiliate "${name}" (${email}) has the same name as existing affiliate(s): ${duplicateEmails}`,
            affiliate_id: newAffiliate.id
          });
        logStep('Created duplicate name notification');
      }

      // Create new affiliate notification
      await supabaseService
        .from('admin_notifications')
        .insert({
          type: 'new_affiliate',
          title: 'New Affiliate Registered',
          message: `${name} from ${companyName} has joined the affiliate program with code ${affiliateCode}`,
          affiliate_id: newAffiliate.id
        });
      logStep('Created new affiliate notification');
      
    } catch (notificationError: any) {
      logStep('Error creating notifications (non-critical)', notificationError);
      // Don't fail the affiliate creation if notifications fail
    }

    logStep('Affiliate created successfully', { id: newAffiliate.id, code: affiliateCode });

    // Auto-create custom site for the affiliate
    try {
      const siteSlug = affiliateCode.toLowerCase();
      const siteName = `${companyName} - Custom Delivery Site`;
      
      const { data: customSite, error: siteError } = await supabaseService
        .from('custom_affiliate_sites')
        .insert({
          site_slug: siteSlug,
          site_name: siteName,
          business_name: companyName,
          delivery_address: deliveryAddress || {
            street: '',
            city: 'Austin',
            state: 'TX',
            zip_code: '',
            instructions: 'Default delivery area - please update in your affiliate dashboard'
          },
          custom_promo_code: null, // They can add this later if needed
          site_type: 'affiliate',
          affiliate_id: newAffiliate.id,
          is_active: true
        })
        .select('id')
        .single();

      if (siteError) {
        logStep('Error creating custom site (non-critical)', siteError);
      } else {
        logStep('Custom site created successfully', { siteId: customSite.id, slug: siteSlug });
        
        // Add default collections (liquor, beer, seltzers, cocktails, mixers-and-na)
        const defaultCollections = ['liquor', 'beer', 'seltzers', 'cocktails', 'mixers-and-na'];
        const collectionsData = defaultCollections.map((handle, index) => ({
          site_id: customSite.id,
          shopify_collection_handle: handle,
          display_order: index,
          is_enabled: true
        }));

        const { error: collectionsError } = await supabaseService
          .from('site_product_collections')
          .insert(collectionsData);

        if (collectionsError) {
          logStep('Error adding default collections (non-critical)', collectionsError);
        } else {
          logStep('Default collections added to custom site');
        }
      }
    } catch (siteCreationError: any) {
      logStep('Error in custom site creation (non-critical)', siteCreationError);
      // Don't fail the affiliate creation if site creation fails
    }

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
          commissionRate: newAffiliate.commission_rate,
          customSiteUrl: `${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://custom-domain.com'}/sites/${affiliateCode.toLowerCase()}`
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