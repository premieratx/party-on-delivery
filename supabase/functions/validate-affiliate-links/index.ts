import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active affiliates
    const { data: affiliates, error: affiliatesError } = await supabaseClient
      .from('affiliates')
      .select('id, affiliate_code, name, email')
      .eq('status', 'active')

    if (affiliatesError) {
      throw affiliatesError
    }

    // Get all active delivery apps  
    const { data: apps, error: appsError } = await supabaseClient
      .from('delivery_app_variations')
      .select('id, app_name, app_slug, short_path')
      .eq('is_active', true)

    if (appsError) {
      throw appsError
    }

    // Get all active cover pages
    const { data: coverPages, error: coverError } = await supabaseClient
      .from('cover_pages')
      .select('id, title, slug')
      .eq('is_active', true)

    if (coverError) {
      throw coverError
    }

    const validationResults = []
    const baseUrl = 'https://order.partyondelivery.com'

    // Test affiliate links
    for (const affiliate of affiliates || []) {
      const affiliateUrl = `${baseUrl}/${affiliate.affiliate_code}`
      
      try {
        const response = await fetch(affiliateUrl, { method: 'HEAD' })
        validationResults.push({
          type: 'affiliate',
          url: affiliateUrl,
          affiliate_code: affiliate.affiliate_code,
          affiliate_name: affiliate.name,
          affiliate_email: affiliate.email,
          status: response.status,
          valid: response.status === 200,
          tested_at: new Date().toISOString()
        })
      } catch (error) {
        validationResults.push({
          type: 'affiliate',
          url: affiliateUrl,
          affiliate_code: affiliate.affiliate_code,
          affiliate_name: affiliate.name,
          affiliate_email: affiliate.email,
          status: 'error',
          valid: false,
          error: error.message,
          tested_at: new Date().toISOString()
        })
      }
    }

    // Test app short links
    for (const app of apps || []) {
      if (app.short_path) {
        const appUrl = `${baseUrl}/${app.short_path}`
        
        try {
          const response = await fetch(appUrl, { method: 'HEAD' })
          validationResults.push({
            type: 'app_short_link',
            url: appUrl,
            app_name: app.app_name,
            app_slug: app.app_slug,
            short_path: app.short_path,
            status: response.status,
            valid: response.status === 200,
            tested_at: new Date().toISOString()
          })
        } catch (error) {
          validationResults.push({
            type: 'app_short_link',
            url: appUrl,
            app_name: app.app_name,
            app_slug: app.app_slug,
            short_path: app.short_path,
            status: 'error',
            valid: false,
            error: error.message,
            tested_at: new Date().toISOString()
          })
        }
      }
    }

    // Test cover page links
    for (const page of coverPages || []) {
      const pageUrl = `${baseUrl}/${page.slug}`
      
      try {
        const response = await fetch(pageUrl, { method: 'HEAD' })
        validationResults.push({
          type: 'cover_page',
          url: pageUrl,
          page_title: page.title,
          slug: page.slug,
          status: response.status,
          valid: response.status === 200,
          tested_at: new Date().toISOString()
        })
      } catch (error) {
        validationResults.push({
          type: 'cover_page',
          url: pageUrl,
          page_title: page.title,
          slug: page.slug,
          status: 'error',
          valid: false,
          error: error.message,
          tested_at: new Date().toISOString()
        })
      }
    }

    // Store validation results
    const { error: insertError } = await supabaseClient
      .from('link_validation_logs')
      .insert({
        validation_run_id: crypto.randomUUID(),
        results: validationResults,
        total_tested: validationResults.length,
        total_valid: validationResults.filter(r => r.valid).length,
        total_invalid: validationResults.filter(r => !r.valid).length
      })

    if (insertError) {
      console.error('Error storing validation results:', insertError)
    }

    // Check for specific issues and send alerts if needed
    const invalidLinks = validationResults.filter(r => !r.valid)
    
    if (invalidLinks.length > 0) {
      console.log('Invalid links detected:', invalidLinks)
      
      // Send admin notification for critical failures
      for (const link of invalidLinks) {
        if (link.type === 'affiliate') {
          await supabaseClient
            .from('admin_notifications')
            .insert({
              type: 'affiliate_link_failure',
              title: 'Affiliate Link Not Working',
              message: `Affiliate link for ${link.affiliate_name} (${link.affiliate_code}) is returning ${link.status}. URL: ${link.url}`,
              affiliate_id: null // We'd need to get this from the affiliates table
            })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_tested: validationResults.length,
        total_valid: validationResults.filter(r => r.valid).length,
        total_invalid: invalidLinks.length,
        invalid_links: invalidLinks,
        validation_results: validationResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Link validation error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})