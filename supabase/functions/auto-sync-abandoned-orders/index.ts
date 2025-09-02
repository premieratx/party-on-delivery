import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Your specific spreadsheet ID
const SPREADSHEET_ID = '1P9Us5B6NMLE1I-e8XZWa9ZzgN5OAO7S9CI9DhnEtl5U';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleSheetsApiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;

    console.log('[HOURLY-SYNC] Starting abandoned orders sync');

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all abandoned orders from the last 2 hours (to ensure we don't miss any)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data: abandonedOrders, error } = await supabase
      .from('abandoned_orders')
      .select('*')
      .gte('abandoned_at', twoHoursAgo.toISOString())
      .order('abandoned_at', { ascending: false });

    if (error) {
      console.error('[HOURLY-SYNC] Error fetching abandoned orders:', error);
      throw error;
    }

    console.log(`[HOURLY-SYNC] Found ${abandonedOrders?.length || 0} abandoned orders to sync`);

    if (abandonedOrders && abandonedOrders.length > 0) {
      await syncAbandonedOrdersToSheet(googleSheetsApiKey, abandonedOrders);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: abandonedOrders?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('[HOURLY-SYNC] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function syncAbandonedOrdersToSheet(apiKey: string, orders: any[]) {
  console.log('[HOURLY-SYNC] Syncing abandoned orders to Google Sheets...');
  
  // Ensure the "Abandoned Orders" sheet exists
  await ensureSheetExists(apiKey, SPREADSHEET_ID, 'Abandoned Orders');
  
  // Get existing data to check for duplicates
  const existingData = await getSheetData(apiKey, SPREADSHEET_ID, 'Abandoned Orders');
  const existingIds = new Set(existingData.slice(1).map(row => row[0])); // Skip header row, get IDs
  
  // Convert orders to rows matching user's headers:
  // Date Ab. Order Started, First Name, Last Name, Email, Phone, Order #, Order Total ($), Delivery Date, Delivery Time, Delivery Address
  const newRows = orders
    .filter(order => !existingIds.has(order.id))
    .map(order => {
      // Parse customer name into first/last if available
      const customerName = order.customer_name || '';
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Parse delivery address
      let deliveryAddressText = '';
      if (order.delivery_address) {
        if (typeof order.delivery_address === 'string') {
          deliveryAddressText = order.delivery_address;
        } else if (typeof order.delivery_address === 'object') {
          const addr = order.delivery_address;
          deliveryAddressText = [addr.address_line_1, addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ');
        }
      }
      
      return [
        new Date(order.abandoned_at).toLocaleDateString(), // Date Ab. Order Started
        firstName, // First Name
        lastName, // Last Name
        order.customer_email || '', // Email
        order.customer_phone || '', // Phone
        order.session_id || '', // Order # (using session_id as order number for abandoned)
        `$${(order.total_amount || 0).toFixed(2)}`, // Order Total ($)
        order.delivery_date || '', // Delivery Date
        order.delivery_time || '', // Delivery Time
        deliveryAddressText // Delivery Address
      ];
    });

  if (newRows.length === 0) {
    console.log('[HOURLY-SYNC] No new abandoned orders to sync');
    return;
  }

  // Append new rows to existing data (skip header)
  const dataWithoutHeader = existingData.slice(1);
  const allData = [...dataWithoutHeader, ...newRows];
  
  // Update the sheet with all data (excluding header since it's already there)
  if (allData.length > 0) {
    await updateGoogleSheetRange(apiKey, SPREADSHEET_ID, 'Abandoned Orders', allData);
  }
  
  console.log(`[HOURLY-SYNC] Successfully synced ${newRows.length} new abandoned orders`);
}

async function getSheetData(apiKey: string, spreadsheetId: string, sheetName: string) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[HOURLY-SYNC] Could not get existing data: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.warn('[HOURLY-SYNC] Error getting existing data:', error);
    return [];
  }
}

async function updateGoogleSheetRange(apiKey: string, spreadsheetId: string, sheetName: string, data: any[][]) {
  if (data.length === 0) return;
  
  const range = `${sheetName}!A2:J${data.length + 1}`; // Skip header row, 10 columns total
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:update?valueInputOption=RAW&key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: data
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function ensureSheetExists(apiKey: string, spreadsheetId: string, sheetName: string) {
  try {
    // Get spreadsheet info to check if sheet exists
    const infoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const infoResponse = await fetch(infoUrl);
    
    if (!infoResponse.ok) {
      throw new Error(`Failed to get spreadsheet info: ${infoResponse.status}`);
    }
    
    const spreadsheetInfo = await infoResponse.json();
    const sheetExists = spreadsheetInfo.sheets?.some((sheet: any) => sheet.properties.title === sheetName);
    
    if (!sheetExists) {
      console.log(`[HOURLY-SYNC] Creating sheet: ${sheetName}`);
      // Create the sheet
      const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`;
      
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create sheet: ${createResponse.status} - ${errorText}`);
      }
    }
  } catch (error) {
    console.error(`[HOURLY-SYNC] Error ensuring sheet exists:`, error);
    // Don't throw - continue with sync attempt
  }
}