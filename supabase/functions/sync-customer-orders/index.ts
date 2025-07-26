import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SYNC-CUSTOMER-ORDERS] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting customer order sync');

    const { customerEmail } = await req.json();

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    logStep('Request data parsed', { customerEmail });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all customer orders for this email
    const { data: orders, error: ordersError } = await supabaseService
      .from('customer_orders')
      .select('*')
      .or(`customer_id.in.(select id from customers where email='${customerEmail}'),session_id.in.(select unnest(session_tokens) from customers where email='${customerEmail}')`);

    if (ordersError) {
      logStep('Error fetching customer orders', ordersError);
      throw new Error("Failed to fetch customer orders");
    }

    // Get or create customer record
    let { data: customer, error: customerError } = await supabaseService
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      logStep('Error fetching customer', customerError);
      throw new Error("Failed to fetch customer");
    }

    if (!customer) {
      // Create customer record
      const { data: newCustomer, error: createError } = await supabaseService
        .from('customers')
        .insert({
          email: customerEmail,
          total_orders: 0,
          total_spent: 0,
          session_tokens: []
        })
        .select()
        .single();

      if (createError) {
        logStep('Error creating customer', createError);
        throw new Error("Failed to create customer");
      }

      customer = newCustomer;
    }

    // Calculate totals from orders
    const totalOrders = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;

    // Update customer totals
    const { error: updateError } = await supabaseService
      .from('customers')
      .update({
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (updateError) {
      logStep('Error updating customer totals', updateError);
      throw new Error("Failed to update customer totals");
    }

    // Update orders that don't have customer_id set
    const ordersWithoutCustomerId = orders?.filter(order => !order.customer_id) || [];
    
    if (ordersWithoutCustomerId.length > 0) {
      const { error: linkError } = await supabaseService
        .from('customer_orders')
        .update({ customer_id: customer.id })
        .in('id', ordersWithoutCustomerId.map(order => order.id));

      if (linkError) {
        logStep('Error linking orders to customer', linkError);
      } else {
        logStep('Linked orders to customer', { count: ordersWithoutCustomerId.length });
      }
    }

    logStep('Customer sync completed', { 
      customerEmail, 
      totalOrders, 
      totalSpent: totalSpent.toFixed(2),
      linkedOrders: ordersWithoutCustomerId.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          totalOrders,
          totalSpent
        },
        linkedOrders: ordersWithoutCustomerId.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in sync-customer-orders function', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Sync failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});