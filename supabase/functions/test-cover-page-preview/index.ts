import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { slug } = await req.json();

    console.log(`🧪 Testing cover page preview for slug: ${slug}`);

    // Check if cover page exists
    const { data: coverPage, error: fetchError } = await supabase
      .from('cover_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (fetchError || !coverPage) {
      console.error('❌ Cover page not found:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cover page not found',
          slug: slug,
          debug: fetchError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    console.log('✅ Cover page found:', coverPage.title);

    // Test the actual preview URL
    const previewUrl = `https://order.partyondelivery.com/cover/${slug}`;
    
    try {
      const response = await fetch(previewUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Supabase-Functions-Test'
        }
      });

      const isAccessible = response.ok;
      
      console.log(`🌐 Preview URL test - Status: ${response.status}, OK: ${isAccessible}`);

      return new Response(
        JSON.stringify({
          success: true,
          coverPage: {
            id: coverPage.id,
            title: coverPage.title,
            slug: coverPage.slug,
            is_active: coverPage.is_active,
            affiliate_slug: coverPage.affiliate_slug
          },
          previewUrl,
          previewAccessible: isAccessible,
          httpStatus: response.status,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (urlError) {
      console.error('❌ Preview URL test failed:', urlError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Preview URL not accessible',
          coverPage: {
            id: coverPage.id,
            title: coverPage.title,
            slug: coverPage.slug
          },
          previewUrl,
          previewAccessible: false,
          urlError: urlError.message,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }

  } catch (error) {
    console.error('❌ Cover page test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});