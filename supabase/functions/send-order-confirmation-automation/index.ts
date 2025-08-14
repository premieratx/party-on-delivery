import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[ORDER-CONFIRMATION-AUTOMATION] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, orderData } = await req.json();
    
    if (!orderId || !orderData) {
      throw new Error("Order ID and order data are required");
    }

    logStep('Processing order confirmation automation', { orderId, orderData });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract customer information
    const customerEmail = orderData.delivery_address?.email || orderData.customer_email;
    const customerName = orderData.delivery_address?.name || orderData.customer_name || 'Customer';
    const customerPhone = orderData.delivery_address?.phone || orderData.customer_phone;
    const orderNumber = orderData.order_number;
    const totalAmount = orderData.total_amount;
    const deliveryDate = orderData.delivery_date;
    const deliveryTime = orderData.delivery_time;

    logStep('Customer details extracted', {
      customerEmail,
      customerName,
      customerPhone,
      orderNumber,
      totalAmount
    });

    // Prepare SMS message
    const smsMessage = `🎉 Order Confirmed! Hi ${customerName}, your order #${orderNumber} ($${totalAmount}) has been received. ${deliveryDate ? `Delivery scheduled for ${deliveryDate}` : 'We\'ll contact you to schedule delivery'}. Thank you for choosing us!`;

    // Prepare email content
    const emailSubject = `Order Confirmation #${orderNumber}`;
    const emailContent = `
      <h2>Thank you for your order, ${customerName}!</h2>
      <p>Your order #${orderNumber} has been confirmed.</p>
      <p><strong>Order Total:</strong> $${totalAmount}</p>
      ${deliveryDate ? `<p><strong>Delivery Date:</strong> ${deliveryDate}</p>` : ''}
      ${deliveryTime ? `<p><strong>Delivery Time:</strong> ${deliveryTime}</p>` : ''}
      <p>We'll contact you shortly to confirm all delivery details.</p>
      <p>Thank you for choosing us!</p>
    `;

    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null }
    };

    // Send SMS via GHL if phone number is available
    if (customerPhone) {
      try {
        logStep('Sending SMS confirmation', { phone: customerPhone });
        
        const smsResponse = await supabase.functions.invoke('send-ghl-sms', {
          body: {
            phone: customerPhone,
            message: smsMessage,
            type: 'order_confirmation'
          }
        });

        if (smsResponse.error) {
          throw new Error(smsResponse.error.message);
        }

        results.sms.success = true;
        logStep('SMS sent successfully');
        
      } catch (smsError: any) {
        logStep('SMS sending failed', smsError);
        results.sms.error = smsError.message;
      }
    } else {
      logStep('No phone number provided, skipping SMS');
    }

    // Send email confirmation if email is available
    if (customerEmail) {
      try {
        logStep('Sending email confirmation', { email: customerEmail });
        
        const emailResponse = await supabase.functions.invoke('send-order-confirmation-email', {
          body: {
            to: customerEmail,
            subject: emailSubject,
            html: emailContent,
            orderData: {
              orderNumber,
              customerName,
              totalAmount,
              deliveryDate,
              deliveryTime,
              lineItems: orderData.line_items || []
            }
          }
        });

        if (emailResponse.error) {
          throw new Error(emailResponse.error.message);
        }

        results.email.success = true;
        logStep('Email sent successfully');
        
      } catch (emailError: any) {
        logStep('Email sending failed', emailError);
        results.email.error = emailError.message;
      }
    } else {
      logStep('No email provided, skipping email');
    }

    // Log the automation results
    const { error: logError } = await supabase
      .from('automation_logs')
      .insert({
        order_id: orderId,
        automation_type: 'order_confirmation',
        sms_sent: results.sms.success,
        email_sent: results.email.success,
        sms_error: results.sms.error,
        email_error: results.email.error,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        created_at: new Date().toISOString()
      });

    if (logError) {
      logStep('Failed to log automation results', logError);
    }

    logStep('Order confirmation automation completed', results);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        results,
        message: 'Order confirmation automation completed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in order confirmation automation', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to process order confirmation automation",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});