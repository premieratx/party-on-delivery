import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { OrderConfirmationEmail } from './_templates/order-confirmation.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  orderNumber?: string;
  stripeSessionId?: string;
  customerEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber, stripeSessionId, customerEmail }: EmailRequest = await req.json();

    // Create Supabase client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order details
    let orderQuery;
    if (stripeSessionId) {
      orderQuery = supabaseAdmin
        .from('customer_orders')
        .select('*')
        .eq('stripe_session_id', stripeSessionId);
    } else if (orderNumber) {
      orderQuery = supabaseAdmin
        .from('customer_orders')
        .select('*')
        .eq('order_number', orderNumber);
    } else {
      throw new Error('Order number or stripe session ID required');
    }

    const { data: order, error: orderError } = await orderQuery.single();
    if (orderError) throw orderError;

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (customerError) throw customerError;

    // Generate share URL
    const shareUrl = `${req.headers.get('origin') || 'https://partyondelivery.com'}/join/${order.share_token}`;

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(OrderConfirmationEmail, {
        customerName: customer.first_name || 'Customer',
        orderNumber: order.order_number,
        orderItems: order.line_items || [],
        totalAmount: order.total_amount,
        deliveryDate: order.delivery_date,
        deliveryTime: order.delivery_time,
        deliveryAddress: order.delivery_address,
        shareUrl: shareUrl,
        groupOrderName: order.group_order_name || `${customer.first_name}'s Order`,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'Party On Delivery <orders@partyondelivery.com>',
      to: [customerEmail || customer.email],
      subject: `Order Confirmed #${order.order_number} - Party On Delivery`,
      html: emailHtml,
    });

    console.log('Order confirmation email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      orderNumber: order.order_number 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);