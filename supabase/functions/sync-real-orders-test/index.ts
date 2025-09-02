import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SYNCING ONE REAL ORDER FROM EACH CATEGORY ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleSheetsApiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;
    const SPREADSHEET_ID = '1P9Us5B6NMLE1I-e8XZWa9ZzgN5OAO7S9CI9DhnEtl5U';

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get one real completed order
    const { data: completedOrders, error: completedError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('status', 'completed')
      .limit(1);

    if (completedError) {
      throw completedError;
    }

    // Get one real abandoned order
    const { data: abandonedOrders, error: abandonedError } = await supabase
      .from('abandoned_orders')
      .select('*')
      .limit(1);

    if (abandonedError) {
      throw abandonedError;
    }

    console.log(`Found ${completedOrders?.length || 0} completed order and ${abandonedOrders?.length || 0} abandoned order`);

    // Sync completed order
    if (completedOrders && completedOrders.length > 0) {
      await syncCompletedOrdersToSheet(googleSheetsApiKey, SPREADSHEET_ID, completedOrders);
    }

    // Sync abandoned order
    if (abandonedOrders && abandonedOrders.length > 0) {
      await syncAbandonedOrdersToSheet(googleSheetsApiKey, SPREADSHEET_ID, abandonedOrders);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: {
        completed: completedOrders?.length || 0,
        abandoned: abandonedOrders?.length || 0
      },
      orderDetails: {
        completed: completedOrders?.[0] || null,
        abandoned: abandonedOrders?.[0] || null
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('ERROR in sync:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function syncCompletedOrdersToSheet(apiKey: string, spreadsheetId: string, orders: any[]) {
  console.log('Syncing completed orders to Google Sheets...');
  
  // Headers for Completed Orders tab
  const headers = ['Date Order Placed', 'First Name', 'Last Name', 'Email', 'Phone', 'Order #', 'Order Total ($)', 'Delivery Date', 'Delivery Time', 'Delivery Address'];
  
  const dataRows = orders.map(order => {
    // For real orders, we need to extract customer info differently since we don't have customer_name
    // Using session_id or placeholder data for now
    const firstName = 'Customer';
    const lastName = order.session_id ? `(${order.session_id.substring(0, 8)})` : 'Guest';
    const email = 'customer@example.com'; // Would need customer lookup
    const phone = '555-0000'; // Would need customer lookup
    
    // Parse delivery address
    let deliveryAddressText = '';
    if (order.delivery_address) {
      if (typeof order.delivery_address === 'string') {
        deliveryAddressText = order.delivery_address;
      } else if (typeof order.delivery_address === 'object') {
        const addr = order.delivery_address;
        deliveryAddressText = [addr.street, addr.city, addr.zip].filter(Boolean).join(', ');
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

  const allData = [headers, ...dataRows];
  
  // Update the Completed Orders sheet
  await updateGoogleSheetRange(apiKey, spreadsheetId, 'Completed Orders', allData);
  console.log(`Successfully synced ${dataRows.length} completed order`);
}

async function syncAbandonedOrdersToSheet(apiKey: string, spreadsheetId: string, orders: any[]) {
  console.log('Syncing abandoned orders to Google Sheets...');
  
  // Headers for Abandoned Orders tab
  const headers = ['Date Ab. Order Started', 'First Name', 'Last Name', 'Email', 'Phone', 'Order #', 'Order Total ($)', 'Delivery Date', 'Delivery Time', 'Delivery Address'];
  
  const dataRows = orders.map(order => {
    // Parse customer name from abandoned orders (which has customer_name field)
    const customerName = order.customer_name || '';
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Guest';
    
    // Parse delivery address
    let deliveryAddressText = order.delivery_address || '';
    
    return [
      new Date(order.abandoned_at).toLocaleDateString(), // Date Ab. Order Started
      firstName, // First Name
      lastName, // Last Name
      order.customer_email || '', // Email
      order.customer_phone || '', // Phone
      order.session_id || '', // Order # (using session_id)
      `$${(order.total_amount || 0).toFixed(2)}`, // Order Total ($)
      '', // Delivery Date (not set for abandoned orders)
      '', // Delivery Time (not set for abandoned orders)
      deliveryAddressText // Delivery Address
    ];
  });

  const allData = [headers, ...dataRows];
  
  // Update the Abandoned Orders sheet
  await updateGoogleSheetRange(apiKey, spreadsheetId, 'Abandoned Orders', allData);
  console.log(`Successfully synced ${dataRows.length} abandoned order`);
}

async function updateGoogleSheetRange(apiKey: string, spreadsheetId: string, sheetName: string, data: any[][]) {
  if (data.length === 0) return;
  
  const range = `${sheetName}!A1:J${data.length}`; // Include headers
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