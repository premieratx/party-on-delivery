import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("➕ Seeding sample discount codes...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      console.error("❌ Missing Supabase credentials in environment");
      return new Response(
        JSON.stringify({ success: false, error: "Missing Supabase env vars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      // no body provided, proceed with defaults
    }

    const providedCodes = Array.isArray(body?.codes) ? body.codes : null;

    const defaultCodes = [
      {
        code: "WELCOME10",
        title: "Welcome 10% Off",
        value: "10",
        value_type: "percentage",
        minimum_order_amount: null,
        usage_count: 0,
        usage_limit: null,
        starts_at: now.toISOString(),
        ends_at: addDays(90),
        once_per_customer: false,
        is_recomsale_code: false,
      },
      {
        code: "SAVE5",
        title: "$5 Off Orders $25+",
        value: "5",
        value_type: "fixed_amount",
        minimum_order_amount: 25,
        usage_count: 0,
        usage_limit: null,
        starts_at: now.toISOString(),
        ends_at: addDays(60),
        once_per_customer: false,
        is_recomsale_code: false,
      },
      {
        code: "RECOM15",
        title: "RecomSale 15% Off",
        value: "15",
        value_type: "percentage",
        minimum_order_amount: null,
        usage_count: 0,
        usage_limit: null,
        starts_at: now.toISOString(),
        ends_at: addDays(60),
        once_per_customer: false,
        is_recomsale_code: true,
      },
    ];

    const codesToUpsert = (providedCodes ?? defaultCodes).map((c: any) => ({
      ...c,
      code: String(c.code || '').toUpperCase(),
    }));

    const { data, error } = await supabase
      .from('shopify_discount_codes_cache')
      .upsert(codesToUpsert, { onConflict: 'code' })
      .select();

    if (error) {
      console.error('❌ Upsert error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`✅ Seeded/updated ${data?.length ?? 0} codes`);

    return new Response(
      JSON.stringify({ success: true, count: data?.length ?? 0, codes: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("🚨 Seed function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});