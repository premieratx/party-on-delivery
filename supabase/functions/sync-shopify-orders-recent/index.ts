import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  contact_email?: string;
  customer?: {
    id?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
  };
  line_items: Array<{
    id: number;
    product_id?: number;
    variant_id?: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const days: number = Math.max(1, Math.min(Number(body.days) || 3, 14));
    const customerEmail: string | undefined = body.customerEmail || undefined;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const created_at_min = since.toISOString();

    const rawShopUrl = Deno.env.get("SHOPIFY_STORE_URL");
    const token = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    if (!rawShopUrl || !token) {
      throw new Error("Shopify credentials are not configured");
    }

    // Ensure URL has proper protocol
    const shopUrl = rawShopUrl.startsWith('http') ? rawShopUrl : `https://${rawShopUrl}`;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch recent orders (limit 250 within window)
    const endpoint = `${shopUrl}/admin/api/2024-01/orders.json?status=any&created_at_min=${encodeURIComponent(created_at_min)}&limit=250&fields=id,order_number,created_at,total_price,subtotal_price,contact_email,customer,shipping_address,line_items`;
    const res = await fetch(endpoint, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Shopify fetch error', res.status, text);
      return new Response(JSON.stringify({ success: false, error: `Shopify error ${res.status}`, details: text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const json = await res.json();
    const orders: ShopifyOrder[] = (json.orders || []) as ShopifyOrder[];

    // Optional filter by email
    const filtered = customerEmail
      ? orders.filter(o => (o.contact_email || o.customer?.email || '').toLowerCase() === customerEmail.toLowerCase())
      : orders;

    let upserts = 0;

    for (const order of filtered) {
      const email = (order.contact_email || order.customer?.email || '').trim();
      if (!email) continue; // skip orders without email

      const first_name = order.customer?.first_name || null;
      const last_name = order.customer?.last_name || null;
      const phone = order.customer?.phone || null;

      // Upsert customer by email
      const { error: custErr } = await supabase
        .from('customers')
        .upsert({
          email,
          name: [first_name, last_name].filter(Boolean).join(' ') || null,
          first_name,
          last_name,
          phone,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

      if (custErr) console.warn('Customer upsert error', custErr);

      // Map line items
      const line_items = (order.line_items || []).map(li => ({
        id: String(li.id),
        product_id: li.product_id ? String(li.product_id) : undefined,
        variant_id: li.variant_id ? String(li.variant_id) : undefined,
        title: li.title,
        quantity: li.quantity,
        price: Number(li.price)
      }));

      // Build delivery address with embedded email used by dashboards
      const delivery_address = {
        email,
        street: order.shipping_address?.address1 || '',
        address2: order.shipping_address?.address2 || '',
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.province || '',
        zip_code: order.shipping_address?.zip || ''
      } as any;

      // Check if order exists by shopify_order_id or order_number
      const { data: existing } = await supabase
        .from('customer_orders')
        .select('id')
        .or(`shopify_order_id.eq.${order.id},order_number.eq.${order.order_number}`)
        .limit(1)
        .maybeSingle();

      const payload: any = {
        order_number: String(order.order_number),
        shopify_order_id: String(order.id),
        status: 'confirmed',
        subtotal: Number(order.subtotal_price || order.total_price || 0),
        total_amount: Number(order.total_price || 0),
        delivery_date: order.created_at ? new Date(order.created_at).toISOString().slice(0,10) : null,
        delivery_time: null,
        delivery_address,
        line_items,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error: updErr } = await supabase
          .from('customer_orders')
          .update(payload)
          .eq('id', existing.id);
        if (updErr) console.warn('Order update error', updErr);
        else upserts++;
      } else {
        const { error: insErr } = await supabase
          .from('customer_orders')
          .insert({ ...payload, created_at: new Date(order.created_at || Date.now()).toISOString() });
        if (insErr) console.warn('Order insert error', insErr);
        else upserts++;
      }
    }

    return new Response(JSON.stringify({ success: true, synced: upserts, checked: filtered.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (e: any) {
    console.error('sync-shopify-orders-recent error', e);
    return new Response(JSON.stringify({ success: false, error: e.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
