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
    console.log('=== CHECKING GOOGLE SHEET TABS ===');

    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!googleSheetsApiKey) {
      throw new Error("GOOGLE_SHEETS_API_KEY not configured");
    }

    const SHEET_ID = "1eWrTf1BKWlXTBWlYAIiQTfmYAE4hT1_wM27Pjiyk8xc";

    // Get sheet metadata to see what tabs exist
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${googleSheetsApiKey}`;
    
    console.log('Fetching sheet metadata...');
    const metadataResponse = await fetch(metadataUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.log('Metadata fetch failed:', errorText);
      throw new Error(`Failed to get sheet metadata: ${errorText}`);
    }

    const metadata = await metadataResponse.json();
    console.log('Sheet title:', metadata.properties?.title);
    
    const sheets = metadata.sheets || [];
    console.log('Found tabs:', sheets.map((s: any) => s.properties?.title));

    // Try to write to the first available tab as a test
    const firstTabName = sheets[0]?.properties?.title || 'Sheet1';
    console.log('Attempting to write to first tab:', firstTabName);

    const testData = [
      ['Test Column 1', 'Test Column 2', 'Test Column 3'],
      ['Data 1', 'Data 2', 'Data 3'],
      ['More Data 1', 'More Data 2', 'More Data 3']
    ];

    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(firstTabName)}:A:C?valueInputOption=RAW&key=${googleSheetsApiKey}`;
    
    console.log('Writing test data...');
    const writeResponse = await fetch(writeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: testData
      })
    });

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      console.log('Write test failed:', errorText);
      throw new Error(`Write test failed: ${errorText}`);
    }

    const writeResult = await writeResponse.json();
    console.log('Write test successful:', writeResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully checked sheet and wrote test data",
        sheetTitle: metadata.properties?.title,
        availableTabs: sheets.map((s: any) => s.properties?.title),
        testWriteResult: writeResult,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.log('ERROR in sheet check:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to check sheet",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});