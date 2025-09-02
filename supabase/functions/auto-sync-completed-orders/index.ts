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

    console.log('[AUTO-SYNC] Starting real-time completed order sync');

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { orderId, action = 'sync_completed' } = body;

    if (action === 'sync_completed') {
      // Get the specific completed order or all recent ones
      let query = supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderId) {
        query = query.eq('id', orderId);
      } else {
        // Get orders from last 24 hours for full sync
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('created_at', yesterday.toISOString());
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('[AUTO-SYNC] Error fetching orders:', error);
        throw error;
      }

      console.log(`[AUTO-SYNC] Found ${orders?.length || 0} orders to sync`);

      if (orders && orders.length > 0) {
        await syncCompletedOrdersToSheet(googleSheetsApiKey, orders);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        synced: orders?.length || 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('[AUTO-SYNC] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function syncCompletedOrdersToSheet(apiKey: string, orders: any[]) {
  console.log('[AUTO-SYNC] Syncing to Google Sheets...');
  
  // Ensure the "Completed Orders" sheet exists
  await ensureSheetExists(apiKey, SPREADSHEET_ID, 'Completed Orders');
  
  // Get existing data to append to it
  const existingData = await getSheetData(apiKey, SPREADSHEET_ID, 'Completed Orders');
  
  // Convert orders to rows matching user's headers:
  // Date Order Placed, First Name, Last Name, Email, Phone, Order #, Order Total ($), Delivery Date, Delivery Time, Delivery Address
  const newRows = orders.map(order => {
    // We need to get customer info from customer_id lookup or session_id
    // For now, we'll extract what we can from available data
    const firstName = 'Customer'; // Will need customer lookup
    const lastName = order.customer_id ? `ID: ${order.customer_id.substring(0, 8)}` : 'Guest';
    const email = order.session_id || 'guest@example.com'; // Placeholder
    const phone = ''; // Not available in current structure
    
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
      new Date(order.created_at).toLocaleDateString(), // Date Order Placed
      firstName, // First Name
      lastName, // Last Name
      email, // Email
      phone, // Phone
      order.order_number || '', // Order #
      `$${(order.total_amount || 0).toFixed(2)}`, // Order Total ($)
      order.delivery_date || '', // Delivery Date
      order.delivery_time || '', // Delivery Time
      deliveryAddressText // Delivery Address
    ];
  });

  // Append new rows to existing data
  const allData = [...(existingData || []), ...newRows];
  
  // Update the sheet with all data
  await updateGoogleSheetRange(apiKey, SPREADSHEET_ID, 'Completed Orders', allData);
  
  console.log(`[AUTO-SYNC] Successfully synced ${newRows.length} completed orders`);
}

async function getSheetData(apiKey: string, spreadsheetId: string, sheetName: string) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[AUTO-SYNC] Could not get existing data: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.warn('[AUTO-SYNC] Error getting existing data:', error);
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
      console.log(`[AUTO-SYNC] Creating sheet: ${sheetName}`);
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
    console.error(`[AUTO-SYNC] Error ensuring sheet exists:`, error);
    // Don't throw - continue with sync attempt
  }
}