import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderAlert {
  id: string;
  type: 'duplicate_orders' | 'group_order_activity' | 'high_value_order';
  title: string;
  message: string;
  orders: any[];
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ADMIN-ORDER-ALERTS] Processing request');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const alerts: OrderAlert[] = [];

    // Check for duplicate/similar orders on the same day
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysOrders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .gte('delivery_date', today)
      .lte('delivery_date', today)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    if (todaysOrders && todaysOrders.length > 0) {
      // Group orders by delivery address and time
      const addressGroups = new Map();
      
      todaysOrders.forEach(order => {
        if (order.delivery_address && order.delivery_time) {
          const key = `${order.delivery_address.street}-${order.delivery_address.city}-${order.delivery_time}`;
          if (!addressGroups.has(key)) {
            addressGroups.set(key, []);
          }
          addressGroups.get(key).push(order);
        }
      });

      // Find groups with multiple orders
      for (const [addressKey, orders] of addressGroups) {
        if (orders.length > 1) {
          // Check if they're already linked as group orders
          const shareTokens = new Set(orders.map(o => o.share_token).filter(Boolean));
          const isAlreadyGrouped = shareTokens.size === 1 && shareTokens.values().next().value;

          if (!isAlreadyGrouped) {
            alerts.push({
              id: `duplicate-${Date.now()}-${Math.random()}`,
              type: 'duplicate_orders',
              title: 'Potential Duplicate Orders Detected',
              message: `${orders.length} separate orders for the same delivery address and time on ${today}. Consider combining these orders.`,
              orders: orders,
              created_at: new Date().toISOString(),
              priority: 'medium'
            });
          }
        }
      }

      // Check for high-value orders
      todaysOrders.forEach(order => {
        if (order.total_amount && parseFloat(order.total_amount) > 500) {
          alerts.push({
            id: `high-value-${order.id}`,
            type: 'high_value_order',
            title: 'High-Value Order Alert',
            message: `Order #${order.order_number} has a value of $${parseFloat(order.total_amount).toFixed(2)}`,
            orders: [order],
            created_at: new Date().toISOString(),
            priority: 'high'
          });
        }
      });

      // Check for new group order activity
      const groupOrders = todaysOrders.filter(order => 
        order.is_group_order && 
        order.group_participants && 
        Array.isArray(order.group_participants) && 
        order.group_participants.length > 1
      );

      groupOrders.forEach(order => {
        const participantCount = order.group_participants.length;
        if (participantCount > 1) {
          alerts.push({
            id: `group-activity-${order.id}`,
            type: 'group_order_activity',
            title: 'Group Order Activity',
            message: `Group order #${order.order_number} has ${participantCount} participants with total value $${parseFloat(order.total_amount || 0).toFixed(2)}`,
            orders: [order],
            created_at: new Date().toISOString(),
            priority: 'low'
          });
        }
      });
    }

    // Store alerts in admin notifications table
    if (alerts.length > 0) {
      const notifications = alerts.map(alert => ({
        type: alert.type,
        title: alert.title,
        message: alert.message,
        is_read: false,
        created_at: alert.created_at
      }));

      const { error: insertError } = await supabase
        .from('admin_notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
      } else {
        console.log(`[ADMIN-ORDER-ALERTS] Created ${alerts.length} notifications`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      alertsCreated: alerts.length,
      alerts: alerts
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[ADMIN-ORDER-ALERTS] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});