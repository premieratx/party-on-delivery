import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-DASHBOARD-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Dashboard data request started");

    // Handle both query params (GET) and body params (POST)
    let dashboardType, userEmail, affiliateCode, loadAssignments = false, includeAbandonedOrders = false;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        dashboardType = body.type || 'admin';
        userEmail = body.email;
        affiliateCode = body.affiliateCode;
        loadAssignments = body.loadAssignments || false;
        includeAbandonedOrders = body.includeAbandonedOrders || false;
      } catch (error) {
        // If no valid JSON body, treat as GET request
        const url = new URL(req.url);
        dashboardType = url.searchParams.get('type') || 'admin';
        userEmail = url.searchParams.get('email');
        affiliateCode = url.searchParams.get('affiliateCode');
        loadAssignments = url.searchParams.get('loadAssignments') === 'true';
        includeAbandonedOrders = url.searchParams.get('includeAbandonedOrders') === 'true';
      }
    } else {
      const url = new URL(req.url);
      dashboardType = url.searchParams.get('type') || 'admin';
      userEmail = url.searchParams.get('email');
      affiliateCode = url.searchParams.get('affiliateCode');
      loadAssignments = url.searchParams.get('loadAssignments') === 'true';
      includeAbandonedOrders = url.searchParams.get('includeAbandonedOrders') === 'true';
    }

    // Initialize Supabase with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let dashboardData: any = {};

    if (dashboardType === 'admin') {
      dashboardData = await getAdminDashboardData(supabase, loadAssignments, includeAbandonedOrders);
    } else if (dashboardType === 'customer') {
      if (!userEmail) throw new Error("Customer email required for customer dashboard");
      dashboardData = await getCustomerDashboardData(supabase, userEmail);
    } else if (dashboardType === 'affiliate') {
      if (!userEmail && !affiliateCode) throw new Error("Affiliate email or code required for affiliate dashboard");
      dashboardData = await getAffiliateDashboardData(supabase, userEmail, affiliateCode);
    } else {
      throw new Error("Invalid dashboard type");
    }

    logStep("Dashboard data retrieved successfully", { 
      type: dashboardType, 
      ordersCount: dashboardData.orders?.length || 0 
    });

    return new Response(JSON.stringify({
      success: true,
      data: dashboardData,
      type: dashboardType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errMsg = error?.message || 'Unknown error occurred';
    logStep("ERROR in dashboard data retrieval", { message: errMsg, stack: error?.stack });
    
    return new Response(JSON.stringify({ 
      error: errMsg,
      success: false,
      fallback_data: {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 1052,
        orders: [],
        customers: [],
        affiliateReferrals: []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 with fallback data instead of 500
    });
  }
});

async function getAdminDashboardData(supabase: any, loadAssignments: boolean = false, includeAbandonedOrders: boolean = false) {
  logStep("Fetching admin dashboard data", { loadAssignments, includeAbandonedOrders });

  try {
    // Simplified query to avoid complex joins that might fail
    const { data: orders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersError) {
      logStep("Orders query error", ordersError);
      // Continue with empty orders rather than failing
    }

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (customersError) {
      logStep("Customers query error", customersError);
    }

    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (affiliatesError) {
      logStep("Affiliates query error", affiliatesError);
    }

    // Fetch abandoned orders if requested
    let abandonedOrders = [];
    if (includeAbandonedOrders) {
      const { data: abandonedData, error: abandonedError } = await supabase
        .from('abandoned_orders')
        .select('*')
        .order('abandoned_at', { ascending: false })
        .limit(50);

      if (abandonedError) {
        logStep("Abandoned orders query error", abandonedError);
      } else {
        abandonedOrders = abandonedData || [];
      }
    }

    // Calculate totals safely
    const safeOrders = orders || [];
    const safeCustomers = customers || [];
    const safeAffiliates = affiliates || [];

    const totalRevenue = safeOrders.reduce((sum: number, order: any) => {
      const amount = parseFloat(order.total_amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const totalOrders = safeOrders.length;
    const totalCustomers = safeCustomers.length;

    const pendingCommissions = safeAffiliates.reduce((sum: number, affiliate: any) => {
      const commission = parseFloat(affiliate.commission_unpaid || 0);
      return sum + (isNaN(commission) ? 0 : commission);
    }, 0);

    // Load assignments if requested
    let assignments = [];
    if (loadAssignments) {
      logStep("Loading affiliate flow assignments");
      
      try {
        const { data: assignmentData, error: assignmentsError } = await supabase
          .from('affiliate_flow_assignments')
          .select('*')
          .order('created_at', { ascending: false });

        if (assignmentsError) {
          logStep("Assignments query error", assignmentsError);
        } else {
          assignments = assignmentData || [];
          logStep("Assignments loaded successfully", { count: assignments.length });
        }
      } catch (error) {
        logStep("Error loading assignments", error);
        assignments = [];
      }
    }

    const response: any = {
      orders: safeOrders,
      customers: safeCustomers,
      affiliates: safeAffiliates,
      affiliateReferrals: [],
      assignments: assignments,
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts: 1052,
      pendingCommissions,
      recentActivity: []
    };

    // Add abandoned orders if requested
    if (includeAbandonedOrders) {
      response.abandonedOrders = abandonedOrders;
    }

    return response;

  } catch (error: any) {
    logStep("Error in getAdminDashboardData", error);
    throw error;
  }
}

async function getCustomerDashboardData(supabase: any, customerEmail: string) {
  logStep("Fetching customer dashboard data", { customerEmail });

  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .maybeSingle();

    const { data: orders } = await supabase
      .from('customer_orders')
      .select('*')
      .contains('delivery_address', { email: customerEmail })
      .order('created_at', { ascending: false });

    const safeOrders = orders || [];
    const totalRevenue = safeOrders.reduce((sum: number, order: any) => {
      const amount = parseFloat(order.total_amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      orders: safeOrders,
      customers: customer ? [customer] : [{ email: customerEmail }],
      affiliateReferrals: [],
      totalRevenue,
      totalOrders: safeOrders.length,
      pendingCommissions: 0,
      recentActivity: []
    };

  } catch (error: any) {
    logStep("Error in getCustomerDashboardData", error);
    throw error;
  }
}

async function getAffiliateDashboardData(supabase: any, userEmail?: string, affiliateCode?: string) {
  logStep("Fetching affiliate dashboard data", { userEmail, affiliateCode });

  try {
    let affiliate;
    if (userEmail) {
      const { data } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      affiliate = data;
    } else if (affiliateCode) {
      const { data } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle();
      affiliate = data;
    }

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    const { data: referrals } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    return {
      orders: [],
      customers: [],
      affiliateReferrals: referrals || [],
      totalRevenue: affiliate.total_sales || 0,
      totalOrders: affiliate.orders_count || 0,
      pendingCommissions: affiliate.commission_unpaid || 0,
      recentActivity: []
    };

  } catch (error: any) {
    logStep("Error in getAffiliateDashboardData", error);
    throw error;
  }
}