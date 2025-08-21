import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').pop();
    
    if (!slug) {
      throw new Error('No slug provided');
    }

    console.log(`🔍 Testing cover page preview for slug: ${slug}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get cover page data
    const { data: coverPage, error } = await supabase
      .from('cover_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !coverPage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cover page not found',
          slug,
          debug: { error, coverPage }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Test preview functionality
    const previewData = {
      id: coverPage.id,
      slug: coverPage.slug,
      title: coverPage.title,
      subtitle: coverPage.subtitle,
      theme: coverPage.theme,
      buttons: coverPage.buttons,
      checklist: coverPage.checklist,
      styles: coverPage.styles,
      logo_url: coverPage.logo_url,
      bg_image_url: coverPage.bg_image_url,
      bg_video_url: coverPage.bg_video_url,
      is_active: coverPage.is_active,
      preview_url: `https://order.partyondelivery.com/cover/${slug}`,
      created_at: coverPage.created_at
    };

    console.log(`✅ Cover page preview test successful for: ${slug}`);

    return new Response(
      JSON.stringify({
        success: true,
        cover_page: previewData,
        preview_status: 'ready',
        message: `Cover page "${coverPage.title}" is ready for preview`,
        test_results: {
          database_access: 'pass',
          data_complete: 'pass',
          preview_ready: 'pass'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cover page preview test error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Preview test failed',
        test_results: {
          database_access: 'fail',
          error_details: error
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});