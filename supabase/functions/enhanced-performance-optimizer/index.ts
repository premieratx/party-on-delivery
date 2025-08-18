import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, enableCaching, cleanupExpired, rebuildIndexes } = await req.json();

    let results: any = { success: true, optimizations: [] };

    // Cleanup expired cache entries
    if (action === 'cleanup_cache' || cleanupExpired) {
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('cache')
        .delete()
        .lt('expires_at', Date.now());
        
      await supabase
        .from('shopify_products_cache')
        .delete()
        .lt('updated_at', expiredTime);

      results.optimizations.push('Cache cleanup completed');
    }

    // Security scan
    if (action === 'full_optimization' || req.json().securityScan) {
      // Verify admin access controls
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('email');
        
      const expectedAdmins = ['brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com'];
      const hasAllAdmins = expectedAdmins.every(email => 
        adminUsers?.some(admin => admin.email === email)
      );

      results.optimizations.push(hasAllAdmins ? 'Admin access verified' : 'Admin access needs attention');
    }

    // Performance optimizations
    if (enableCaching || action === 'full_optimization') {
      // Trigger cache refresh
      await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: true }
      });
      
      results.optimizations.push('Product cache refreshed');
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Optimization error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});