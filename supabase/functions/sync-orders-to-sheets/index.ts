import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  spreadsheetId: string;
  syncType: 'abandoned' | 'completed' | 'both';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleSheetsApiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Verify authenticated admin user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify admin via admin_users table
    const userEmail = userData.user.email || '';
    const { data: adminRows, error: adminErr } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', userEmail)
      .limit(1);

    if (adminErr || !adminRows || adminRows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<SyncRequest>;
    const { spreadsheetId, syncType = 'both' } = body;

    if (!spreadsheetId) {
      return new Response(JSON.stringify({ success: false, error: 'Spreadsheet ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const results: any = { success: true, synced: {} };

    // Sync abandoned orders
    if (syncType === 'abandoned' || syncType === 'both') {
      try {
        const { data: abandonedOrders, error } = await supabase
          .from('abandoned_orders')
          .select('*')
          .order('abandoned_at', { ascending: false });

        if (error) throw error;

        const headers = [
          'ID', 'Customer Name', 'Customer Email', 'Customer Phone', 
          'Delivery Address', 'Subtotal', 'Total Amount', 'Abandoned At',
          'Last Activity', 'Affiliate Code', 'Session ID', 'Cart Items Count'
        ];

        const rows = abandonedOrders.map(order => [
          order.id,
          order.customer_name || '',
          order.customer_email || '',
          order.customer_phone || '',
          typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address || {}),
          order.subtotal || 0,
          order.total_amount || 0,
          new Date(order.abandoned_at).toISOString(),
          new Date(order.last_activity_at).toISOString(),
          order.affiliate_code || '',
          order.session_id || '',
          Array.isArray(order.cart_items) ? order.cart_items.length : 0
        ]);

        await updateGoogleSheet(googleSheetsApiKey, spreadsheetId, 'Abandoned Orders', [headers, ...rows]);
        results.synced.abandonedOrders = abandonedOrders.length;
      } catch (error) {
        console.error('Error syncing abandoned orders:', error);
        results.errors = results.errors || {};
        results.errors.abandonedOrders = error.message;
      }
    }

    // Sync completed orders
    if (syncType === 'completed' || syncType === 'both') {
      try {
        const { data: completedOrders, error } = await supabase
          .from('customer_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const headers = [
          'ID', 'Order Number', 'Customer ID', 'Session ID', 'Status',
          'Subtotal', 'Delivery Fee', 'Total Amount', 'Delivery Date',
          'Delivery Time', 'Delivery Address', 'Special Instructions',
          'Affiliate Code', 'Is Group Order', 'Created At', 'Line Items Count'
        ];

        const rows = completedOrders.map(order => [
          order.id,
          order.order_number || '',
          order.customer_id || '',
          order.session_id || '',
          order.status || '',
          order.subtotal || 0,
          order.delivery_fee || 0,
          order.total_amount || 0,
          order.delivery_date || '',
          order.delivery_time || '',
          typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address || {}),
          order.special_instructions || '',
          order.affiliate_code || '',
          order.is_group_order || false,
          new Date(order.created_at).toISOString(),
          Array.isArray(order.line_items) ? order.line_items.length : 0
        ]);

        await updateGoogleSheet(googleSheetsApiKey, spreadsheetId, 'Completed Orders', [headers, ...rows]);
        results.synced.completedOrders = completedOrders.length;
      } catch (error) {
        console.error('Error syncing completed orders:', error);
        results.errors = results.errors || {};
        results.errors.completedOrders = error.message;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function updateGoogleSheet(apiKey: string, spreadsheetId: string, sheetName: string, data: any[][]) {
  // First, check if the sheet exists, if not create it
  await ensureSheetExists(apiKey, spreadsheetId, sheetName);
  
  // Clear existing data
  await clearSheet(apiKey, spreadsheetId, sheetName);
  
  // Update with new data
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear?key=${apiKey}`;
  
  await fetch(updateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add new data
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:update?valueInputOption=RAW&key=${apiKey}`;
  
  const response = await fetch(appendUrl, {
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
  // Get spreadsheet info to check if sheet exists
  const infoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  const infoResponse = await fetch(infoUrl);
  
  if (!infoResponse.ok) {
    throw new Error(`Failed to get spreadsheet info: ${infoResponse.status}`);
  }
  
  const spreadsheetInfo = await infoResponse.json();
  const sheetExists = spreadsheetInfo.sheets?.some((sheet: any) => sheet.properties.title === sheetName);
  
  if (!sheetExists) {
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
}

async function clearSheet(apiKey: string, spreadsheetId: string, sheetName: string) {
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear?key=${apiKey}`;
  
  const response = await fetch(clearUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Failed to clear sheet ${sheetName}: ${response.status}`);
  }
}