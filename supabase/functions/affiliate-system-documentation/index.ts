import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const documentation = {
      system_name: "Affiliate Customer Flow Management System",
      version: "1.0.0",
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      
      overview: {
        purpose: "Complete affiliate marketing system with customer journey tracking and commission management",
        key_features: [
          "Independent component creation (Cover Pages, Delivery Apps, Post-Checkout Pages)",
          "Customer Flow Configuration connecting components into complete journeys",
          "Affiliate assignment with custom URL slugs for tracking",
          "Session-based affiliate attribution throughout customer journey",
          "Commission tracking and promotional offers (free shipping, discounts)",
          "Direct shareable URLs for affiliate marketing campaigns"
        ]
      },

      system_architecture: {
        core_components: {
          cover_pages: {
            description: "Landing pages that start customer journeys",
            database_table: "cover_pages",
            key_fields: ["id", "title", "slug", "is_active", "styles", "buttons"],
            creation_method: "Independent creation via Cover Page Creator",
            usage: "First touchpoint in customer flows, customizable branding and CTAs"
          },
          
          delivery_apps: {
            description: "Product catalog and ordering interfaces",
            database_table: "delivery_app_variations", 
            key_fields: ["id", "app_name", "app_slug", "hero_title", "hero_subtitle", "is_homepage"],
            creation_method: "Independent creation via Delivery App Creator",
            usage: "Core shopping experience, one can be set as default homepage"
          },
          
          post_checkout_pages: {
            description: "Custom thank you and post-purchase experience pages",
            database_table: "post_checkout_pages (to be created)",
            key_fields: ["id", "title", "slug", "content", "branding"],
            creation_method: "Independent creation via Post-Checkout Creator",
            usage: "Final step in customer journey, affiliate branding opportunity"
          },
          
          customer_flows: {
            description: "Configuration connecting components into complete user journeys",
            database_table: "customer_flows",
            key_fields: ["id", "name", "slug", "cover_page_id", "delivery_app_id", "post_checkout_id", "is_active", "is_default"],
            creation_method: "Admin-only creation via Customer Flow Manager",
            usage: "Defines complete customer journey path"
          },
          
          affiliate_flow_assignments: {
            description: "Assignment of affiliates to flows with custom tracking URLs",
            database_table: "affiliate_flow_assignments", 
            key_fields: ["id", "customer_flow_id", "affiliate_id", "share_slug", "free_shipping", "discount_type", "discount_percentage", "discount_dollar_amount"],
            creation_method: "Admin assignment via Flow Assignment Manager",
            usage: "Creates trackable affiliate marketing campaigns"
          }
        }
      },

      affiliate_tracking_system: {
        url_structure: {
          flow_urls: "order.partyondelivery.com/flow/{share_slug}",
          direct_affiliate: "order.partyondelivery.com/{affiliate_code}",
          app_affiliate: "order.partyondelivery.com/{app_short_path}/{affiliate_code}"
        },
        
        tracking_flow: {
          step_1: "User clicks affiliate URL with share_slug",
          step_2: "AffiliateFlowLanding component loads assignment from database",
          step_3: "Affiliate tracking initiated via useAffiliateTracking hook",
          step_4: "Session storage stores affiliate data and promotional offers",
          step_5: "User redirected to appropriate flow component (cover page or delivery app)",
          step_6: "Affiliate attribution persists through entire session until checkout",
          step_7: "Commission tracking recorded in affiliate_order_tracking table"
        },
        
        session_management: {
          primary_hook: "useAffiliateTracking",
          storage_keys: ["affiliate-tracking", "affiliate-promo", "affiliate-flow-state"],
          tracking_data: {
            affiliate_slug: "For commission attribution",
            session_id: "Unique session identifier", 
            cover_page_id: "Flow component tracking",
            promotional_offers: "Free shipping and discount data"
          }
        }
      },

      database_relationships: {
        affiliates: {
          related_tables: ["affiliate_flow_assignments", "affiliate_order_tracking", "affiliate_referrals"],
          relationship_type: "one-to-many",
          key_connections: "Track all affiliate activities and commissions"
        },
        
        customer_flows: {
          related_tables: ["cover_pages", "delivery_app_variations", "post_checkout_pages", "affiliate_flow_assignments"],
          relationship_type: "many-to-one with components, one-to-many with assignments",
          key_connections: "Central hub connecting all journey components"
        },
        
        affiliate_flow_assignments: {
          related_tables: ["customer_flows", "affiliates"],
          relationship_type: "many-to-one with both",
          key_connections: "Junction table enabling multiple affiliates per flow"
        }
      },

      admin_workflow: {
        component_creation: {
          step_1: "Create Cover Pages independently (optional)",
          step_2: "Create Delivery Apps independently (required)",
          step_3: "Create Post-Checkout Pages independently (optional)", 
          step_4: "Set one Delivery App as default homepage",
          note: "All components created independently, no dependencies"
        },
        
        flow_configuration: {
          step_1: "Create Customer Flow via Customer Flow Manager",
          step_2: "Assign cover page, delivery app, and post-checkout page to flow",
          step_3: "Set flow as active",
          step_4: "Optionally set as default flow",
          note: "Admin-only operation, connects independent components"
        },
        
        affiliate_assignment: {
          step_1: "Select existing customer flow",
          step_2: "Select existing affiliate (must be created separately)",
          step_3: "Generate custom share_slug for tracking",
          step_4: "Configure promotional offers (free shipping, discounts)",
          step_5: "System generates shareable URL: order.partyondelivery.com/flow/{share_slug}",
          note: "Creates trackable marketing campaigns for affiliates"
        }
      },

      technical_implementation: {
        key_components: {
          "CustomerFlowManager": "Admin interface for flow creation and management",
          "AffiliateFlowLanding": "URL handler for affiliate flow entry points", 
          "useAffiliateTracking": "Session tracking and attribution management",
          "AffiliateFlowAssignmentManager": "Admin interface for affiliate assignments"
        },
        
        routing: {
          "/flow/:shareSlug": "Entry point for affiliate customer flows",
          "/admin": "Admin dashboard with flow management tabs",
          "/app/:appSlug": "Individual delivery app interfaces",
          "/cover/:coverSlug": "Individual cover page interfaces"
        },
        
        session_persistence: {
          sessionStorage: "Temporary affiliate tracking data",
          localStorage: "Cross-tab affiliate flow state",
          url_parameters: "aff parameter for affiliate code transmission"
        }
      },

      promotional_system: {
        free_shipping: {
          configuration: "Boolean flag in affiliate_flow_assignments",
          implementation: "Stored in session, applied during checkout",
          tracking: "Logged for commission calculation adjustments"
        },
        
        discounts: {
          types: ["percentage", "dollar", "both"],
          configuration: "discount_type, discount_percentage, discount_dollar_amount fields",
          implementation: "Applied automatically during affiliate checkout sessions",
          validation: "Admin-configured, system-applied"
        }
      },

      security_considerations: {
        affiliate_verification: "Active status checking before flow assignment loading",
        session_validation: "Affiliate tracking data validation and sanitization", 
        admin_permissions: "Flow creation and assignment restricted to admin users",
        url_security: "Share slug uniqueness enforced, collision prevention"
      },

      recovery_procedures: {
        system_restoration: "All configuration stored in Supabase tables",
        data_backup: "Regular database backups include all affiliate and flow data",
        component_recreation: "Independent components can be recreated without affecting others",
        flow_reconstruction: "Customer flows can be rebuilt from component references"
      },

      future_enhancements: {
        analytics_integration: "Enhanced tracking of affiliate performance metrics",
        automated_payouts: "Commission calculation and payout automation",
        multi_tier_commissions: "Hierarchical affiliate program support",
        ab_testing: "Flow component A/B testing capabilities"
      },

      critical_files: {
        components: [
          "src/components/admin/CustomerFlowManager.tsx",
          "src/components/admin/AffiliateFlowAssignmentManager.tsx", 
          "src/pages/AffiliateFlowLanding.tsx",
          "src/hooks/useAffiliateTracking.ts"
        ],
        database_tables: [
          "customer_flows",
          "affiliate_flow_assignments", 
          "affiliates",
          "cover_pages",
          "delivery_app_variations",
          "affiliate_order_tracking"
        ]
      }
    };

    // Store documentation in database
    const { error: insertError } = await supabase
      .from('system_documentation')
      .upsert({
        system_name: documentation.system_name,
        version: documentation.version,
        documentation_data: documentation,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'system_name'
      });

    if (insertError) {
      console.error('Error storing documentation:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentation,
        message: "Affiliate Customer Flow Management System documentation generated and stored"
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in affiliate-system-documentation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
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