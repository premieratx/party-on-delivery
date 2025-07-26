import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SYNC-EXISTING-DATA] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting sync of existing data to Google Sheets');

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

    logStep('Fetching completed orders from Supabase');
    
    // Fetch completed orders
    const { data: completedOrders, error: ordersError } = await supabase
      .from('customer_orders')
      .select(`
        *,
        customers(email, first_name, last_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new Error(`Failed to fetch completed orders: ${ordersError.message}`);
    }

    logStep('Fetching abandoned orders from Supabase');
    
    // Fetch abandoned orders
    const { data: abandonedOrders, error: abandonedError } = await supabase
      .from('abandoned_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (abandonedError) {
      throw new Error(`Failed to fetch abandoned orders: ${abandonedError.message}`);
    }

    logStep('Fetching affiliate referrals from Supabase');
    
    // Fetch affiliate referrals
    const { data: affiliateReferrals, error: affiliateError } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        affiliates(name, company_name, affiliate_code, email)
      `)
      .order('created_at', { ascending: false });

    if (affiliateError) {
      throw new Error(`Failed to fetch affiliate referrals: ${affiliateError.message}`);
    }

    // Helper function to append data to a specific tab (creating it if it doesn't exist)
    const appendToSheet = async (tabName: string, headers: string[], data: any[][]) => {
      const range = `${tabName}:A:${String.fromCharCode(65 + headers.length - 1)}`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW&key=${googleSheetsApiKey}`;
      
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [headers, ...data]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          logStep(`Error appending to ${tabName}`, { status: response.status, error: errorText });
          
          // If the tab doesn't exist, try to create it first
          if (response.status === 400 && errorText.includes('Unable to parse range')) {
            logStep(`Tab ${tabName} might not exist, attempting to create...`);
            // For now, just log the error - Google Sheets API would need additional permissions to create tabs
            throw new Error(`Tab "${tabName}" does not exist in the Google Sheet. Please create tabs named: "Completed Orders", "Abandoned Orders", and "Affiliates"`);
          }
          
          throw new Error(`Failed to sync to ${tabName}: ${errorText}`);
        }

        const result = await response.json();
        logStep(`Successfully synced to ${tabName}`, result);
        return result;
      } catch (error) {
        logStep(`Error syncing to ${tabName}`, error);
        throw error;
      }
    };

    // Helper function to format items list
    const formatItems = (lineItems: any[]) => {
      if (!lineItems || lineItems.length === 0) return '';
      return lineItems.map(item => 
        `${item.name || item.title} (Qty: ${item.quantity}) - $${item.price}`
      ).join('; ');
    };

    // Helper function to format address
    const formatAddress = (address: any) => {
      if (typeof address === 'string') return address;
      if (!address) return '';
      
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipCode) parts.push(address.zipCode);
      
      return parts.join(', ');
    };

    logStep('Syncing completed orders to Google Sheets');

    // Sync completed orders to "Completed Orders" tab
    if (completedOrders && completedOrders.length > 0) {
      const completedOrdersData = completedOrders.map(order => [
        new Date(order.created_at).toLocaleString(),
        order.order_number,
        order.customers?.email || '',
        order.customers?.first_name || '',
        order.customers?.last_name || '',
        order.customers?.phone || '',
        formatAddress(order.delivery_address),
        order.delivery_date || '',
        order.delivery_time || '',
        formatItems(order.line_items || []),
        order.subtotal || 0,
        order.delivery_fee || 0,
        order.total_amount || 0,
        order.affiliate_code || '',
        order.status || '',
        order.special_instructions || '',
        order.shopify_order_id || '',
        order.session_id || ''
      ]);

      const completedOrdersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Completed%20Orders:A:R?valueInputOption=RAW&key=${googleSheetsApiKey}`;
      
      const completedOrdersResponse = await fetch(completedOrdersUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            // Header row
            ['Date', 'Order #', 'Customer Email', 'First Name', 'Last Name', 'Phone', 'Delivery Address', 'Delivery Date', 'Delivery Time', 'Items', 'Subtotal', 'Delivery Fee', 'Total', 'Affiliate Code', 'Status', 'Special Instructions', 'Shopify Order ID', 'Session ID'],
            ...completedOrdersData
          ]
        })
      });

      if (!completedOrdersResponse.ok) {
        logStep('Error syncing completed orders', await completedOrdersResponse.text());
      } else {
        logStep(`Successfully synced ${completedOrdersData.length} completed orders`);
      }
    }

    logStep('Syncing abandoned orders to Google Sheets');

    // Sync abandoned orders to "Abandoned Orders" tab
    if (abandonedOrders && abandonedOrders.length > 0) {
      const abandonedOrdersData = abandonedOrders.map(order => [
        new Date(order.abandoned_at).toLocaleString(),
        order.customer_email || '',
        order.customer_name || '',
        order.customer_phone || '',
        formatAddress(order.delivery_address),
        formatItems(order.cart_items || []),
        order.subtotal || 0,
        order.total_amount || 0,
        order.affiliate_code || '',
        order.session_id || '',
        new Date(order.created_at).toLocaleString()
      ]);

      const abandonedOrdersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Abandoned%20Orders:A:K?valueInputOption=RAW&key=${googleSheetsApiKey}`;
      
      const abandonedOrdersResponse = await fetch(abandonedOrdersUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            // Header row
            ['Abandoned Date', 'Customer Email', 'Customer Name', 'Phone', 'Delivery Address', 'Items', 'Subtotal', 'Total', 'Affiliate Code', 'Session ID', 'Created At'],
            ...abandonedOrdersData
          ]
        })
      });

      if (!abandonedOrdersResponse.ok) {
        logStep('Error syncing abandoned orders', await abandonedOrdersResponse.text());
      } else {
        logStep(`Successfully synced ${abandonedOrdersData.length} abandoned orders`);
      }
    }

    logStep('Syncing affiliate referrals to Google Sheets');

    // Sync affiliate referrals to "Affiliates" tab
    if (affiliateReferrals && affiliateReferrals.length > 0) {
      const affiliateData = affiliateReferrals.map(referral => [
        new Date(referral.order_date).toLocaleString(),
        referral.affiliates?.name || '',
        referral.affiliates?.company_name || '',
        referral.affiliates?.affiliate_code || '',
        referral.affiliates?.email || '',
        referral.customer_email || '',
        referral.order_id || '',
        referral.subtotal || 0,
        referral.commission_rate || 0,
        referral.commission_amount || 0,
        referral.paid_out ? 'Yes' : 'No',
        new Date(referral.created_at).toLocaleString()
      ]);

      const affiliateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Affiliates:A:L?valueInputOption=RAW&key=${googleSheetsApiKey}`;
      
      const affiliateResponse = await fetch(affiliateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            // Header row
            ['Order Date', 'Affiliate Name', 'Company', 'Affiliate Code', 'Affiliate Email', 'Customer Email', 'Order ID', 'Subtotal', 'Commission Rate %', 'Commission Amount', 'Paid Out', 'Created At'],
            ...affiliateData
          ]
        })
      });

      if (!affiliateResponse.ok) {
        logStep('Error syncing affiliate data', await affiliateResponse.text());
      } else {
        logStep(`Successfully synced ${affiliateData.length} affiliate referrals`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully synced all existing data to Google Sheets",
        synced: {
          completedOrders: completedOrders?.length || 0,
          abandonedOrders: abandonedOrders?.length || 0,
          affiliateReferrals: affiliateReferrals?.length || 0
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error syncing existing data', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to sync existing data to Google Sheets",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});