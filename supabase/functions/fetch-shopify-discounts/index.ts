import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyDiscountCode {
  id: string
  code: string
  value: string
  value_type: 'fixed_amount' | 'percentage'
  usage_count: number
  usage_limit?: number
  created_at: string
  updated_at: string
  starts_at?: string
  ends_at?: string
  minimum_order_amount?: string
  applies_to_id?: string
  applies_to_resource: string
  title?: string
}

interface ShopifyPriceRule {
  id: string
  title: string
  value: string
  value_type: 'fixed_amount' | 'percentage'
  customer_selection: string
  target_type: string
  target_selection: string
  allocation_method: string
  once_per_customer: boolean
  usage_limit?: number
  starts_at: string
  ends_at?: string
  created_at: string
  updated_at: string
  prerequisite_subtotal_range?: {
    greater_than_or_equal_to: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== FETCH-SHOPIFY-DISCOUNTS FUNCTION START ===')
    
    // Get environment variables
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL')
    
    if (!shopifyAccessToken || !shopifyStoreUrl) {
      console.error('Missing Shopify credentials')
      return new Response(
        JSON.stringify({ error: 'Shopify credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Store URL: ${shopifyStoreUrl}`)
    console.log(`Access Token exists: ${!!shopifyAccessToken}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { includeExpired = false, activeOnly = true } = await req.json().catch(() => ({}))

    // Fetch price rules (discount rules)
    console.log('Fetching Shopify price rules...')
    const priceRulesResponse = await fetch(
      `https://${shopifyStoreUrl}/admin/api/2023-10/price_rules.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!priceRulesResponse.ok) {
      console.error('Price rules response failed:', priceRulesResponse.status)
      throw new Error(`Shopify price rules API error: ${priceRulesResponse.status}`)
    }

    const priceRulesData = await priceRulesResponse.json()
    console.log(`Found ${priceRulesData.price_rules?.length || 0} price rules`)

    // Filter price rules if activeOnly
    let priceRules = priceRulesData.price_rules || []
    if (activeOnly && !includeExpired) {
      const now = new Date().toISOString()
      priceRules = priceRules.filter((rule: ShopifyPriceRule) => {
        const isActive = new Date(rule.starts_at) <= new Date(now)
        const notExpired = !rule.ends_at || new Date(rule.ends_at) > new Date(now)
        return isActive && notExpired
      })
      console.log(`Filtered to ${priceRules.length} active price rules`)
    }

    // Fetch discount codes for each price rule
    const allDiscountCodes: any[] = []
    
    for (const priceRule of priceRules) {
      try {
        console.log(`Fetching discount codes for price rule: ${priceRule.title}`)
        
        const discountCodesResponse = await fetch(
          `https://${shopifyStoreUrl}/admin/api/2023-10/price_rules/${priceRule.id}/discount_codes.json?limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': shopifyAccessToken,
              'Content-Type': 'application/json',
            },
          }
        )

        if (discountCodesResponse.ok) {
          const discountCodesData = await discountCodesResponse.json()
          const codes = discountCodesData.discount_codes || []
          
          // Enrich discount codes with price rule information
          const enrichedCodes = codes.map((code: ShopifyDiscountCode) => ({
            ...code,
            price_rule_id: priceRule.id,
            price_rule_title: priceRule.title,
            price_rule_value: priceRule.value,
            price_rule_value_type: priceRule.value_type,
            minimum_order_amount: priceRule.prerequisite_subtotal_range?.greater_than_or_equal_to,
            starts_at: priceRule.starts_at,
            ends_at: priceRule.ends_at,
            usage_limit: priceRule.usage_limit,
            once_per_customer: priceRule.once_per_customer,
            target_type: priceRule.target_type,
            customer_selection: priceRule.customer_selection,
            // RecomSale specific data
            is_recomsale_code: priceRule.title?.toLowerCase().includes('recomsale') || 
                              priceRule.title?.toLowerCase().includes('recommend') ||
                              code.code?.toLowerCase().includes('recom'),
          }))
          
          allDiscountCodes.push(...enrichedCodes)
          console.log(`Added ${codes.length} discount codes from rule: ${priceRule.title}`)
        } else {
          console.warn(`Failed to fetch discount codes for price rule ${priceRule.id}: ${discountCodesResponse.status}`)
        }
      } catch (error) {
        console.error(`Error fetching discount codes for price rule ${priceRule.id}:`, error)
      }
    }

    // Store discount codes in Supabase for caching and integration
    if (allDiscountCodes.length > 0) {
      console.log(`Storing ${allDiscountCodes.length} discount codes in cache...`)
      
      // Upsert discount codes cache
      const { error: cacheError } = await supabase
        .from('shopify_discount_codes_cache')
        .upsert(
          allDiscountCodes.map(code => ({
            shopify_discount_id: code.id,
            shopify_price_rule_id: code.price_rule_id,
            code: code.code,
            title: code.price_rule_title,
            value: code.price_rule_value,
            value_type: code.price_rule_value_type,
            usage_count: code.usage_count || 0,
            usage_limit: code.usage_limit,
            minimum_order_amount: code.minimum_order_amount ? parseFloat(code.minimum_order_amount) : null,
            starts_at: code.starts_at,
            ends_at: code.ends_at,
            once_per_customer: code.once_per_customer || false,
            target_type: code.target_type,
            customer_selection: code.customer_selection,
            is_recomsale_code: code.is_recomsale_code || false,
            raw_data: code,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'shopify_discount_id',
            ignoreDuplicates: false
          }
        )

      if (cacheError) {
        console.error('Error caching discount codes:', cacheError)
      } else {
        console.log('✅ Successfully cached all discount codes')
      }
    }

    // Filter RecomSale codes specifically
    const recomSaleCodes = allDiscountCodes.filter(code => code.is_recomsale_code)
    
    console.log(`✅ Retrieved ${allDiscountCodes.length} total discount codes`)
    console.log(`✅ Found ${recomSaleCodes.length} RecomSale-related codes`)

    return new Response(
      JSON.stringify({
        success: true,
        total_codes: allDiscountCodes.length,
        recomsale_codes: recomSaleCodes.length,
        discount_codes: allDiscountCodes,
        recomsale_discount_codes: recomSaleCodes,
        cached_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error fetching Shopify discounts:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Shopify discount codes',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})