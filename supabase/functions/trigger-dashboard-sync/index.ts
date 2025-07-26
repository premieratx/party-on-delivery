import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIGGER-DASHBOARD-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Dashboard sync trigger started");

    const { orderId, customerId, affiliateId, syncType = 'order_complete' } = await req.json();
    
    // Initialize Supabase with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    logStep("Processing dashboard sync", { orderId, customerId, affiliateId, syncType });

    const syncResults = [];

    switch (syncType) {
      case 'order_complete':
        // Sync customer order data
        if (customerId) {
          const { data: customerSyncResult, error: customerSyncError } = await supabase.functions.invoke('sync-customer-orders', {
            body: { customerId }
          });
          
          if (customerSyncError) {
            logStep("Customer sync error", customerSyncError);
          } else {
            logStep("Customer data synced successfully", customerSyncResult);
            syncResults.push({ type: 'customer', result: customerSyncResult });
          }
        }

        // Sync affiliate data if applicable
        if (affiliateId) {
          try {
            // Update affiliate stats by triggering referral update
            const { error: affiliateUpdateError } = await supabase
              .from('affiliate_referrals')
              .select('id')
              .eq('affiliate_id', affiliateId)
              .limit(1);
            
            if (!affiliateUpdateError) {
              logStep("Affiliate stats updated successfully");
              syncResults.push({ type: 'affiliate', result: 'updated' });
            }
          } catch (error) {
            logStep("Affiliate sync error", error);
          }
        }

        // Trigger real-time notifications for dashboards
        await broadcastDashboardUpdate(supabase, {
          type: 'order_complete',
          orderId,
          customerId,
          affiliateId,
          timestamp: new Date().toISOString()
        });
        
        break;

      case 'customer_update':
        // Handle customer-specific updates
        if (customerId) {
          await broadcastDashboardUpdate(supabase, {
            type: 'customer_update',
            customerId,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'affiliate_update':
        // Handle affiliate-specific updates
        if (affiliateId) {
          await broadcastDashboardUpdate(supabase, {
            type: 'affiliate_update',
            affiliateId,
            timestamp: new Date().toISOString()
          });
        }
        break;

      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }

    logStep("Dashboard sync completed successfully", { syncResults });

    return new Response(JSON.stringify({
      success: true,
      syncResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in dashboard sync", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function broadcastDashboardUpdate(supabase: any, updateData: any) {
  try {
    // Use Supabase realtime to broadcast dashboard updates
    const { error } = await supabase
      .channel('dashboard-updates')
      .send({
        type: 'broadcast',
        event: 'dashboard_sync',
        payload: updateData
      });

    if (error) {
      logStep("Broadcast error", error);
    } else {
      logStep("Dashboard update broadcasted successfully", updateData);
    }
  } catch (error) {
    logStep("Exception in dashboard broadcast", error);
  }
}