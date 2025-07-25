import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-DASHBOARD-DATA] ${step}${detailsStr}`);
};

interface DashboardData {
  orders: any[];
  customers: any[];
  affiliateReferrals: any[];
  totalRevenue: number;
  totalOrders: number;
  pendingCommissions: number;
  recentActivity: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Dashboard data request started");

    // Handle both query params (GET) and body params (POST)
    let dashboardType, userEmail, affiliateCode;
    
    if (req.method === 'POST') {
      const body = await req.json();
      dashboardType = body.type || 'admin';
      userEmail = body.email;
      affiliateCode = body.affiliateCode;
    } else {
      const url = new URL(req.url);
      dashboardType = url.searchParams.get('type') || 'admin';
      userEmail = url.searchParams.get('email');
      affiliateCode = url.searchParams.get('affiliateCode');
    }

    // Initialize Supabase with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let dashboardData: Partial<DashboardData> = {};

    switch (dashboardType) {
      case 'admin':
        dashboardData = await getAdminDashboardData(supabase);
        break;
      
      case 'customer':
        if (!userEmail) throw new Error("Customer email required for customer dashboard");
        dashboardData = await getCustomerDashboardData(supabase, userEmail);
        break;
      
      case 'affiliate':
        if (!userEmail && !affiliateCode) throw new Error("Affiliate email or code required for affiliate dashboard");
        dashboardData = await getAffiliateDashboardData(supabase, userEmail, affiliateCode);
        break;
      
      default:
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in dashboard data retrieval", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getAdminDashboardData(supabase: any): Promise<DashboardData> {
  logStep("Fetching admin dashboard data");

  // Get all orders with customer details
  const { data: orders, error: ordersError } = await supabase
    .from('customer_orders')
    .select(`
      *,
      customers!inner(
        id,
        email,
        first_name,
        last_name,
        phone,
        total_orders,
        total_spent
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (ordersError) throw ordersError;

  // Get all customers with stats
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (customersError) throw customersError;

  // Get affiliate referrals with affiliate details
  const { data: affiliateReferrals, error: referralsError } = await supabase
    .from('affiliate_referrals')
    .select(`
      *,
      affiliates!inner(
        id,
        name,
        company_name,
        email,
        affiliate_code,
        commission_rate
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (referralsError) throw referralsError;

  // Calculate totals
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const pendingCommissions = affiliateReferrals
    .filter((ref: any) => !ref.paid_out)
    .reduce((sum: number, ref: any) => sum + parseFloat(ref.commission_amount || 0), 0);

  // Get recent activity (last 10 orders and referrals combined)
  const recentActivity = [
    ...orders.slice(0, 5).map((order: any) => ({
      type: 'order',
      id: order.id,
      description: `Order #${order.order_number} - ${order.customers?.first_name} ${order.customers?.last_name}`,
      amount: order.total_amount,
      date: order.created_at,
      customer: order.customers
    })),
    ...affiliateReferrals.slice(0, 5).map((ref: any) => ({
      type: 'referral',
      id: ref.id,
      description: `Referral by ${ref.affiliates?.name} (${ref.affiliates?.affiliate_code})`,
      amount: ref.commission_amount,
      date: ref.created_at,
      affiliate: ref.affiliates
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return {
    orders,
    customers,
    affiliateReferrals,
    totalRevenue,
    totalOrders,
    pendingCommissions,
    recentActivity
  };
}

async function getCustomerDashboardData(supabase: any, customerEmail: string): Promise<DashboardData> {
  logStep("Fetching customer dashboard data", { customerEmail });

  // Get customer info
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', customerEmail)
    .single();

  if (customerError) throw customerError;

  // Get customer's orders
  const { data: orders, error: ordersError } = await supabase
    .from('customer_orders')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  // Get recent addresses
  const { data: addresses, error: addressesError } = await supabase
    .from('delivery_addresses')
    .select('*')
    .eq('customer_email', customerEmail)
    .order('last_used_at', { ascending: false });

  const totalRevenue = customer.total_spent || 0;
  const totalOrders = customer.total_orders || 0;

  const recentActivity = orders.slice(0, 10).map((order: any) => ({
    type: 'order',
    id: order.id,
    description: `Order #${order.order_number}`,
    amount: order.total_amount,
    date: order.created_at,
    status: order.status,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time
  }));

  return {
    orders,
    customers: [{ ...customer, addresses: addresses || [] }],
    affiliateReferrals: [],
    totalRevenue,
    totalOrders,
    pendingCommissions: 0,
    recentActivity
  };
}

async function getAffiliateDashboardData(supabase: any, userEmail?: string, affiliateCode?: string): Promise<DashboardData> {
  logStep("Fetching affiliate dashboard data", { userEmail, affiliateCode });

  // Get affiliate info
  let affiliate;
  if (userEmail) {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', userEmail)
      .single();
    if (error) throw error;
    affiliate = data;
  } else if (affiliateCode) {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .single();
    if (error) throw error;
    affiliate = data;
  }

  if (!affiliate) throw new Error("Affiliate not found");

  // Get affiliate's referrals with order details
  const { data: affiliateReferrals, error: referralsError } = await supabase
    .from('affiliate_referrals')
    .select(`
      *,
      customer_orders!left(
        id,
        order_number,
        status,
        delivery_date,
        delivery_time,
        created_at
      )
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false });

  if (referralsError) throw referralsError;

  // Get commission payouts
  const { data: payouts, error: payoutsError } = await supabase
    .from('commission_payouts')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false });

  const totalRevenue = affiliate.total_sales || 0;
  const totalOrders = affiliate.orders_count || 0;
  const pendingCommissions = affiliate.commission_unpaid || 0;

  const recentActivity = [
    ...affiliateReferrals.slice(0, 10).map((ref: any) => ({
      type: 'referral',
      id: ref.id,
      description: `Commission earned from order ${ref.customer_orders?.order_number || ref.order_id}`,
      amount: ref.commission_amount,
      date: ref.created_at,
      orderNumber: ref.customer_orders?.order_number,
      paidOut: ref.paid_out
    })),
    ...(payouts || []).slice(0, 5).map((payout: any) => ({
      type: 'payout',
      id: payout.id,
      description: `Commission payout of $${payout.amount}`,
      amount: payout.amount,
      date: payout.created_at,
      status: payout.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

  return {
    orders: affiliateReferrals.map(ref => ref.customer_orders).filter(Boolean),
    customers: [],
    affiliateReferrals,
    totalRevenue,
    totalOrders,
    pendingCommissions,
    recentActivity
  };
}