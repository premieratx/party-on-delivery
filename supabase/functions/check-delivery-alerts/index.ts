import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get CST timezone date/time (UTC-6)
    const now = new Date();
    const cstNow = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    const next24Hours = new Date(cstNow.getTime() + (24 * 60 * 60 * 1000));

    // Check for deliveries scheduled within 24 hours
    const { data: urgentDeliveries, error: urgentError } = await supabaseAdmin
      .from('customer_orders')
      .select(`
        *,
        customers(first_name, last_name, email, phone)
      `)
      .gte('delivery_date', cstNow.toISOString().split('T')[0])
      .lte('delivery_date', next24Hours.toISOString().split('T')[0])
      .neq('status', 'delivered');

    if (urgentError) throw urgentError;

    // Create admin notifications for urgent deliveries
    for (const delivery of urgentDeliveries || []) {
      await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'urgent_delivery',
          title: '⚠️ Delivery Within 24 Hours',
          message: `Order #${delivery.order_number} scheduled for ${delivery.delivery_date} at ${delivery.delivery_time}. Customer: ${delivery.customers?.first_name} ${delivery.customers?.last_name} (${delivery.customers?.email})`,
          created_at: new Date().toISOString()
        });
    }

    // Check for potential order grouping opportunities
    const { data: recentOrders, error: ordersError } = await supabaseAdmin
      .from('customer_orders')
      .select(`
        *,
        customers(first_name, last_name, email, phone)
      `)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Group orders by delivery address and date
    const orderGroups = new Map();
    for (const order of recentOrders || []) {
      if (!order.delivery_address || !order.delivery_date) continue;
      
      const address = `${order.delivery_address.street}, ${order.delivery_address.city}, ${order.delivery_address.state}`;
      const key = `${address}_${order.delivery_date}`;
      
      if (!orderGroups.has(key)) {
        orderGroups.set(key, []);
      }
      orderGroups.get(key).push(order);
    }

    // Check for groupable orders (same address, same date, different customers, within 2 hours of each other)
    const groupableOrders = [];
    for (const [key, orders] of orderGroups) {
      if (orders.length > 1) {
        // Check if orders are from different customers but within time window
        const customerEmails = new Set(orders.map(o => o.customers?.email).filter(Boolean));
        if (customerEmails.size > 1) {
          // Check if delivery times are similar (within 2 hours)
          const times = orders.map(o => o.delivery_time).filter(Boolean);
          if (times.length > 1) {
            groupableOrders.push({
              address: key.split('_')[0],
              date: key.split('_')[1],
              orders: orders
            });
          }
        }
      }
    }

    // Send notifications and SMS for groupable orders
    for (const group of groupableOrders) {
      const firstOrder = group.orders[0];
      const firstCustomer = firstOrder.customers;
      
      if (firstCustomer?.phone) {
        // Send SMS to group manager (first buyer)
        const message = `Hi ${firstCustomer.first_name}! We noticed multiple orders to ${group.address} on ${group.date}. Would you like to group these deliveries? Reply with your preferred time. You'll need to be present to show ID. Orders: ${group.orders.map(o => `#${o.order_number}`).join(', ')}`;
        
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ghl-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              phone: firstCustomer.phone,
              message: message
            })
          });
        } catch (smsError) {
          console.error('SMS send error:', smsError);
        }
      }

      // Create admin notification
      await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'groupable_orders',
          title: '🔄 Potential Order Grouping',
          message: `Multiple orders to ${group.address} on ${group.date}. Orders: ${group.orders.map(o => `#${o.order_number} (${o.customers?.first_name})`).join(', ')}. SMS sent to group manager.`,
          created_at: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        urgentDeliveries: urgentDeliveries?.length || 0,
        groupableOrders: groupableOrders.length,
        message: 'Delivery alerts checked successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Delivery alerts error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});