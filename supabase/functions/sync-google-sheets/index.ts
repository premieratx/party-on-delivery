import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GOOGLE-SHEETS-SYNC] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting Google Sheets sync");

    const { type, data } = await req.json();
    
    if (!type || !data) {
      throw new Error("Type and data are required");
    }

    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!googleSheetsApiKey) {
      throw new Error("Google Sheets API key not configured");
    }

    // POD Delivery App Sheet ID (you'll need to create this sheet and share it publicly)
    const SHEET_ID = "1H8vQxFzPrL9kN2mX5cZ8dA6fE3gH4iJ7kL0mN9oP2qR3"; // Replace with actual sheet ID
    
    let range = "";
    let values: any[][] = [];

    switch (type) {
      case "completed_order":
        range = "Completed Orders!A:M";
        values = [[
          new Date().toISOString(),
          data.orderNumber,
          data.customerName,
          data.customerEmail,
          data.customerPhone,
          data.deliveryDate,
          data.deliveryTime,
          data.deliveryAddress,
          data.subtotal,
          data.deliveryFee,
          data.salesTax,
          data.totalAmount,
          data.affiliateCode || ''
        ]];
        break;

      case "abandoned_order":
        range = "Abandoned Orders!A:L";
        values = [[
          new Date().toISOString(),
          data.sessionId,
          data.customerName || '',
          data.customerEmail || '',
          data.customerPhone || '',
          data.deliveryAddress || '',
          data.subtotal || 0,
          data.totalAmount || 0,
          data.affiliateCode || '',
          JSON.stringify(data.cartItems || []),
          data.abandonedAt,
          data.lastActivityAt
        ]];
        break;

      case "affiliate_referral":
        range = "Affiliates!A:H";
        values = [[
          new Date().toISOString(),
          data.affiliateCode,
          data.affiliateName,
          data.orderNumber,
          data.customerEmail,
          data.subtotal,
          data.commissionAmount,
          data.totalCommissionEarned
        ]];
        break;

      default:
        throw new Error(`Unknown sync type: ${type}`);
    }

    // Append data to Google Sheets
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API error: ${errorText}`);
    }

    const result = await response.json();
    logStep("Data synced to Google Sheets", { type, updatedRows: result.updates.updatedRows });

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} synced to Google Sheets`,
        updatedRows: result.updates.updatedRows
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("Error syncing to Google Sheets", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to sync to Google Sheets"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});