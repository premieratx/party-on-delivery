import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[TEST-SYNC] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== STARTING SYNC FUNCTION TEST ===');

    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!googleSheetsApiKey) {
      logStep('ERROR: GOOGLE_SHEETS_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "GOOGLE_SHEETS_API_KEY not configured",
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    logStep('Google Sheets API key found, length:', googleSheetsApiKey.length);

    const SHEET_ID = "1eWrTf1BKWlXTBWlYAIiQTfmYAE4hT1_wM27Pjiyk8xc";
    
    // Test a simple API call to verify the key works
    const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${googleSheetsApiKey}`;
    logStep('Testing Google Sheets API access with URL:', testUrl.replace(googleSheetsApiKey, 'HIDDEN_KEY'));
    
    const testResponse = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    logStep('Test API response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      logStep('Test API failed:', { status: testResponse.status, error: errorText });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Google Sheets API test failed: ${testResponse.status} - ${errorText}`,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const testResult = await testResponse.json();
    logStep('Test API success, sheet title:', testResult.properties?.title);

    logStep('=== SYNC FUNCTION TEST COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Google Sheets API test successful",
        sheetTitle: testResult.properties?.title,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('CRITICAL ERROR in sync function:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Critical error: ${error.message}`,
        errorName: error.name,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});