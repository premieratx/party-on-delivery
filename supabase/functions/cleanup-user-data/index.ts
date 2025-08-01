import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('cleanup-user-data function called');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { email } = body;
    
    if (!email) {
      console.error('No email provided');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Email is required' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('Cleaning up data for email:', email);

    // First, get the customer ID
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (customerError) {
      console.error('Error finding customer:', customerError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Error finding customer: ' + customerError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let deletedItems = {
      orders: 0,
      addresses: 0,
      customer: 0,
      profiles: 0,
      recentOrders: 0
    };

    if (customer) {
      console.log('Found customer ID:', customer.id);
      
      // Delete customer orders
      const { error: ordersError, count: ordersCount } = await supabase
        .from('customer_orders')
        .delete()
        .eq('customer_id', customer.id);

      if (ordersError) {
        console.error('Error deleting orders:', ordersError);
      } else {
        deletedItems.orders = ordersCount || 0;
        console.log('Deleted orders:', deletedItems.orders);
      }

      // Delete customer addresses
      const { error: addressesError, count: addressesCount } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('customer_id', customer.id);

      if (addressesError) {
        console.error('Error deleting addresses:', addressesError);
      } else {
        deletedItems.addresses = addressesCount || 0;
        console.log('Deleted addresses:', deletedItems.addresses);
      }

      // Delete customer record
      const { error: customerDeleteError, count: customerCount } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (customerDeleteError) {
        console.error('Error deleting customer:', customerDeleteError);
      } else {
        deletedItems.customer = customerCount || 0;
        console.log('Deleted customer:', deletedItems.customer);
      }
    }

    // Delete delivery addresses by email
    const { error: deliveryAddressError, count: deliveryCount } = await supabase
      .from('delivery_addresses')
      .delete()
      .eq('customer_email', email);

    if (deliveryAddressError) {
      console.error('Error deleting delivery addresses:', deliveryAddressError);
    } else {
      deletedItems.addresses += deliveryCount || 0;
      console.log('Deleted delivery addresses:', deliveryCount);
    }

    // Delete customer profiles by email
    const { error: profilesError, count: profilesCount } = await supabase
      .from('customer_profiles')
      .delete()
      .eq('email', email);

    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
    } else {
      deletedItems.profiles = profilesCount || 0;
      console.log('Deleted profiles:', deletedItems.profiles);
    }

    // Delete recent orders by email
    const { error: recentOrdersError, count: recentCount } = await supabase
      .from('recent_orders')
      .delete()
      .eq('customer_email', email);

    if (recentOrdersError) {
      console.error('Error deleting recent orders:', recentOrdersError);
    } else {
      deletedItems.recentOrders = recentCount || 0;
      console.log('Deleted recent orders:', deletedItems.recentOrders);
    }

    const response = {
      success: true,
      message: `Successfully cleaned up data for ${email}`,
      deletedItems
    };

    console.log('Cleanup complete:', response);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error in cleanup-user-data:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to cleanup user data' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});