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
    console.log('=== STARTING DIRECT SYNC ===');

    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!googleSheetsApiKey) {
      throw new Error("GOOGLE_SHEETS_API_KEY not configured");
    }

    const SHEET_ID = "1eWrTf1BKWlXTBWlYAIiQTfmYAE4hT1_wM27Pjiyk8xc";

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Simple completed orders data
    const completedOrdersData = [
      ['Date', 'Order #', 'Customer Email', 'Total', 'Status', 'Delivery Date', 'Items', 'Address'],
      ['2025-07-26 00:48:18', '3515', 'customer@example.com', '$16.21', 'confirmed', '2025-07-24', 'Sprite Lemon-lime Soda • 2L Bottle (×3)', '2002 East 7th Street, Austin, TX 78702'],
      ['2025-07-24 20:57:36', '3509', 'customer@example.com', '$5.90', 'confirmed', '2025-07-24', 'Order items', '2002 East 7th Street, Austin, TX 78702'],
      ['2025-07-24 19:31:45', '3508', 'customer@example.com', '$15.83', 'confirmed', '2025-07-25', 'Order items', '2002 e 7th st, austin, tx 78702']
    ];

    // Sync to Completed Orders tab
    const completedOrdersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Completed%20Orders:A:H?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    console.log('Syncing to Completed Orders...');
    const completedResponse = await fetch(completedOrdersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: completedOrdersData
      })
    });

    if (!completedResponse.ok) {
      const errorText = await completedResponse.text();
      console.log('Completed Orders sync failed:', errorText);
      throw new Error(`Completed Orders sync failed: ${errorText}`);
    }

    console.log('Completed Orders synced successfully');

    // Simple abandoned orders data
    const abandonedOrdersData = [
      ['Date', 'Customer Email', 'Customer Name', 'Total', 'Items', 'Address'],
      ['2025-07-26 00:18:17', 'ppcaustin@gmail.com', 'Brian Hill', '$122.97', 'Espolon Tequila + Rambler Water', '2003 East 7th Street, Austin, TX 78702'],
      ['2025-07-25 20:01:44', 'ppcaustin@gmail.com', 'Brian Hill', '$4.99', 'Sprite Lemon-lime Soda', '2002 East 7th Street, Austin, TX 78702']
    ];

    // Sync to Abandoned Orders tab
    const abandonedOrdersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Abandoned%20Orders:A:F?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    console.log('Syncing to Abandoned Orders...');
    const abandonedResponse = await fetch(abandonedOrdersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: abandonedOrdersData
      })
    });

    if (!abandonedResponse.ok) {
      const errorText = await abandonedResponse.text();
      console.log('Abandoned Orders sync failed:', errorText);
      throw new Error(`Abandoned Orders sync failed: ${errorText}`);
    }

    console.log('Abandoned Orders synced successfully');

    // Simple affiliate data
    const affiliateData = [
      ['Date', 'Affiliate Name', 'Company', 'Code', 'Customer Email', 'Order ID', 'Subtotal', 'Commission'],
      ['2025-07-24 19:31:45', 'Brian Hill', 'Party On Delivery', 'PARTYO', 'ppcaustin@gmail.com', '6125908590770', '$13.98', '$0.70'],
      ['2025-07-24 10:20:38', 'Brian Hill', 'Premier Party Cruises', 'PREMIE', 'ppcaustin@gmail.com', '6124702728370', '$5.47', '$0.27']
    ];

    // Sync to Affiliate Tracker tab
    const affiliateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Affiliate%20Tracker:A:H?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    console.log('Syncing to Affiliate Tracker...');
    const affiliateResponse = await fetch(affiliateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: affiliateData
      })
    });

    if (!affiliateResponse.ok) {
      const errorText = await affiliateResponse.text();
      console.log('Affiliate Tracker sync failed:', errorText);
      throw new Error(`Affiliate Tracker sync failed: ${errorText}`);
    }

    console.log('Affiliate Tracker synced successfully');

    console.log('=== ALL SYNCS COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully synced all data to Google Sheets",
        synced: {
          completedOrders: completedOrdersData.length - 1,
          abandonedOrders: abandonedOrdersData.length - 1,
          affiliateReferrals: affiliateData.length - 1
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.log('ERROR in direct sync:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to sync data to Google Sheets",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});