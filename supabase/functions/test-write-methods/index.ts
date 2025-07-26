import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TRYING DIFFERENT WRITE METHOD ===');

    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!googleSheetsApiKey) {
      throw new Error("GOOGLE_SHEETS_API_KEY not configured");
    }

    const SHEET_ID = "1eWrTf1BKWlXTBWlYAIiQTfmYAE4hT1_wM27Pjiyk8xc";

    const testData = [
      ['Order Date', 'Order Number', 'Customer', 'Total'],
      ['2025-07-26', '3515', 'Test Customer', '$16.21'],
      ['2025-07-24', '3509', 'Test Customer', '$5.90']
    ];

    // Try method 1: Update instead of append
    console.log('Method 1: Trying UPDATE to Completed Orders...');
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Completed%20Orders!A1:D3?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: testData
      })
    });

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('UPDATE method successful:', result);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully synced data using UPDATE method",
          method: "UPDATE",
          result: result,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const updateError = await updateResponse.text();
    console.log('UPDATE failed:', updateError);

    // Try method 2: Append to range
    console.log('Method 2: Trying APPEND...');
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Completed%20Orders:append?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    const appendResponse = await fetch(appendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: testData
      })
    });

    if (appendResponse.ok) {
      const result = await appendResponse.json();
      console.log('APPEND method successful:', result);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully synced data using APPEND method",
          method: "APPEND", 
          result: result,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const appendError = await appendResponse.text();
    console.log('APPEND failed:', appendError);

    // Try method 3: Different range format
    console.log('Method 3: Trying simple range format...');
    const simpleUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Completed%20Orders!A1?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    const simpleResponse = await fetch(simpleUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: testData
      })
    });

    if (simpleResponse.ok) {
      const result = await simpleResponse.json();
      console.log('Simple range method successful:', result);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully synced data using simple range method",
          method: "SIMPLE_RANGE",
          result: result,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const simpleError = await simpleResponse.text();
    console.log('Simple range failed:', simpleError);

    // All methods failed
    throw new Error(`All write methods failed. Last error: ${simpleError}`);

  } catch (error: any) {
    console.log('ERROR in write test:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Write permission issue: ${error.message}. Your API key can read but not write to the sheet.`,
        solution: "You need to either: 1) Make the sheet editable by anyone with the link, or 2) Use a service account and share the sheet with the service account email",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});