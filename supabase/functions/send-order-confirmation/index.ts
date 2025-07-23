import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-ORDER-CONFIRMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const {
      orderDetails,
      customerInfo,
      deliveryInfo,
      cartItems,
      paymentInfo,
      shopifyOrderInfo
    } = await req.json();

    logStep("Order confirmation request received", { 
      orderNumber: shopifyOrderInfo?.orderNumber,
      customerEmail: customerInfo?.email 
    });

    // Initialize Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(resendKey);

    // Format cart items for email
    const itemsHtml = cartItems.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title || item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Format delivery date
    const deliveryDate = new Date(deliveryInfo.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - Party On Delivery</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmation</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${shopifyOrderInfo?.orderNumber || 'Processing'}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #667eea; margin-top: 0;">Thank you for your order!</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Delivery Information</h3>
              <p><strong>Date:</strong> ${deliveryDate}</p>
              <p><strong>Time:</strong> ${deliveryInfo.timeSlot}</p>
              <p><strong>Address:</strong> ${deliveryInfo.address}</p>
              ${deliveryInfo.instructions ? `<p><strong>Instructions:</strong> ${deliveryInfo.instructions}</p>` : ''}
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Customer Information</h3>
              <p><strong>Name:</strong> ${customerInfo.name}</p>
              <p><strong>Email:</strong> ${customerInfo.email}</p>
              <p><strong>Phone:</strong> ${customerInfo.phone}</p>
            </div>
            
            <h3 style="color: #333;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 15px; text-align: left; border-bottom: 2px solid #667eea;">Product</th>
                  <th style="padding: 15px; text-align: center; border-bottom: 2px solid #667eea;">Qty</th>
                  <th style="padding: 15px; text-align: right; border-bottom: 2px solid #667eea;">Price</th>
                  <th style="padding: 15px; text-align: right; border-bottom: 2px solid #667eea;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="border-top: 2px solid #667eea; padding-top: 20px; margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span><strong>Subtotal:</strong></span>
                <span><strong>$${paymentInfo.subtotal.toFixed(2)}</strong></span>
              </div>
              ${paymentInfo.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #28a745;">
                  <span><strong>Discount (${paymentInfo.discountCode}):</strong></span>
                  <span><strong>-$${paymentInfo.discountAmount.toFixed(2)}</strong></span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span><strong>Delivery Fee:</strong></span>
                <span><strong>$${paymentInfo.deliveryFee.toFixed(2)}</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span><strong>Sales Tax:</strong></span>
                <span><strong>$${paymentInfo.salesTax.toFixed(2)}</strong></span>
              </div>
              ${paymentInfo.tipAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span><strong>Driver Tip:</strong></span>
                  <span><strong>$${paymentInfo.tipAmount.toFixed(2)}</strong></span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 20px 0; padding-top: 15px; border-top: 1px solid #ddd; font-size: 18px;">
                <span><strong>Total:</strong></span>
                <span><strong>$${paymentInfo.total.toFixed(2)}</strong></span>
              </div>
            </div>

            <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #333;">Shopify Integration Details</h3>
              <p><strong>Shopify Order ID:</strong> ${shopifyOrderInfo?.shopifyOrderId || 'Processing'}</p>
              <p><strong>Order Number:</strong> ${shopifyOrderInfo?.orderNumber || 'Processing'}</p>
              <p><strong>Status:</strong> Confirmed & Sent to Shopify</p>
              <p><strong>Inventory:</strong> Updated in Shopify</p>
              ${paymentInfo.discountCode ? `<p><strong>Affiliate Code:</strong> ${paymentInfo.discountCode} (Tracked in Shopify)</p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #ddd;">
              <p style="color: #666;">Thank you for choosing Party On Delivery!</p>
              <p style="color: #666;">Questions? Contact us at brian@partyondelivery.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Party On Delivery <brian@partyondelivery.com>",
      to: [customerInfo.email],
      subject: `Order Confirmation #${shopifyOrderInfo?.orderNumber || 'Processing'} - Party On Delivery`,
      html: emailHtml,
    });

    // Send notification email to brian@partyondelivery.com
    const notificationEmailResponse = await resend.emails.send({
      from: "Party On Delivery <brian@partyondelivery.com>",
      to: ["brian@partyondelivery.com"],
      subject: `New Order #${shopifyOrderInfo?.orderNumber || 'Processing'} - ${customerInfo.name}`,
      html: emailHtml,
    });

    logStep("Emails sent successfully", { 
      customerEmailId: customerEmailResponse.data?.id,
      notificationEmailId: notificationEmailResponse.data?.id 
    });

    return new Response(JSON.stringify({ 
      success: true,
      customerEmailId: customerEmailResponse.data?.id,
      notificationEmailId: notificationEmailResponse.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-order-confirmation", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});