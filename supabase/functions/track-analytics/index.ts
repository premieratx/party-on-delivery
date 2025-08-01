import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TRACK-ANALYTICS] Analytics tracking request started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      sessionId, 
      pagePath, 
      referrer, 
      userAgent, 
      userEmail 
    } = await req.json();

    const userIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    console.log('[TRACK-ANALYTICS] Tracking page view:', { sessionId, pagePath, userIP });

    // Check if this is a unique visitor
    const { data: existingVisitor } = await supabase
      .from('unique_visitors')
      .select('id, total_page_views')
      .eq('session_id', sessionId)
      .single();

    const isUniqueVisitor = !existingVisitor;

    // Insert page view
    const { error: pageViewError } = await supabase
      .from('page_views')
      .insert({
        session_id: sessionId,
        page_path: pagePath,
        referrer: referrer || null,
        user_agent: userAgent || null,
        user_ip: userIP,
        user_email: userEmail || null,
        is_unique_visitor: isUniqueVisitor
      });

    if (pageViewError) {
      console.error('[TRACK-ANALYTICS] Error inserting page view:', pageViewError);
    }

    // Update or insert unique visitor
    if (existingVisitor) {
      // Update existing visitor
      await supabase
        .from('unique_visitors')
        .update({
          last_visit: new Date().toISOString(),
          total_page_views: existingVisitor.total_page_views + 1,
          user_email: userEmail || existingVisitor.user_email
        })
        .eq('session_id', sessionId);
    } else {
      // Insert new unique visitor
      await supabase
        .from('unique_visitors')
        .insert({
          session_id: sessionId,
          user_ip: userIP,
          user_agent: userAgent || null,
          referrer: referrer || null,
          user_email: userEmail || null
        });
    }

    // Update daily analytics
    const { error: analyticsError } = await supabase
      .rpc('update_daily_analytics');

    if (analyticsError) {
      console.error('[TRACK-ANALYTICS] Error updating daily analytics:', analyticsError);
    }

    console.log('[TRACK-ANALYTICS] Analytics tracking completed successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[TRACK-ANALYTICS] Error in analytics tracking:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});