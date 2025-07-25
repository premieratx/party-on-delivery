import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderSMSRequest {
  orderData: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryAddress: string;
    totalAmount: number;
    lineItems: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
  };
  notifyCustomer?: boolean;
  notifyAdmin?: boolean;
  adminPhone?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[ORDER SMS] ${step}:`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting order SMS notifications');
    
    const { orderData, notifyCustomer = true, notifyAdmin = true, adminPhone }: OrderSMSRequest = await req.json();
    
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    if (!ghlApiKey) {
      logStep('Missing GHL API key');
      return new Response(
        JSON.stringify({ error: 'GHL API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];

    // Send SMS to customer
    if (notifyCustomer && orderData.customerPhone) {
      const itemsList = orderData.lineItems
        .slice(0, 3) // Limit to first 3 items to avoid SMS length limits
        .map(item => `• ${item.title} (${item.quantity}x)`)
        .join('\n');
      
      const moreItems = orderData.lineItems.length > 3 ? `\n...and ${orderData.lineItems.length - 3} more items` : '';

      const customerMessage = `🎉 ORDER CONFIRMED!

Order #${orderData.orderNumber}
${orderData.customerName || 'Customer'}

📦 ITEMS:
${itemsList}${moreItems}

📅 DELIVERY:
${orderData.deliveryDate} at ${orderData.deliveryTime}

📍 ADDRESS:
${orderData.deliveryAddress}

💰 TOTAL: $${orderData.totalAmount.toFixed(2)}

Thank you for choosing Party On Delivery! 🚚

Track your order: partyondelivery.com/customer/login`;

      logStep('Sending customer SMS', { 
        phone: orderData.customerPhone, 
        messageLength: customerMessage.length 
      });

      try {
        const customerResponse = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            type: 'SMS',
            phone: orderData.customerPhone,
            message: customerMessage
          })
        });

        if (customerResponse.ok) {
          const customerResult = await customerResponse.json();
          results.push({
            type: 'customer',
            success: true,
            messageId: customerResult.id,
            phone: orderData.customerPhone
          });
          logStep('Customer SMS sent successfully', customerResult);
        } else {
          const errorText = await customerResponse.text();
          logStep('Customer SMS failed', { status: customerResponse.status, error: errorText });
          results.push({
            type: 'customer',
            success: false,
            error: errorText,
            phone: orderData.customerPhone
          });
        }
      } catch (error) {
        logStep('Customer SMS exception', error);
        results.push({
          type: 'customer',
          success: false,
          error: error.message,
          phone: orderData.customerPhone
        });
      }
    }

    // Send SMS to admin/business owner
    if (notifyAdmin && adminPhone) {
      const adminItemsList = orderData.lineItems
        .map(item => `• ${item.title} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');

      const adminMessage = `🚨 NEW ORDER ALERT!

Order #${orderData.orderNumber}
Customer: ${orderData.customerName || 'Customer'}

📦 ITEMS:
${adminItemsList}

💰 TOTAL: $${orderData.totalAmount.toFixed(2)}

📅 DELIVERY:
${orderData.deliveryDate} at ${orderData.deliveryTime}

📍 ADDRESS:
${orderData.deliveryAddress}

📞 CUSTOMER PHONE:
${orderData.customerPhone}

🔗 Admin Dashboard: partyondelivery.com/admin`;

      logStep('Sending admin SMS', { 
        phone: adminPhone, 
        messageLength: adminMessage.length 
      });

      try {
        const adminResponse = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            type: 'SMS',
            phone: adminPhone,
            message: adminMessage
          })
        });

        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          results.push({
            type: 'admin',
            success: true,
            messageId: adminResult.id,
            phone: adminPhone
          });
          logStep('Admin SMS sent successfully', adminResult);
        } else {
          const errorText = await adminResponse.text();
          logStep('Admin SMS failed', { status: adminResponse.status, error: errorText });
          results.push({
            type: 'admin',
            success: false,
            error: errorText,
            phone: adminPhone
          });
        }
      } catch (error) {
        logStep('Admin SMS exception', error);
        results.push({
          type: 'admin',
          success: false,
          error: error.message,
          phone: adminPhone
        });
      }
    }

    // Determine overall success
    const successCount = results.filter(r => r.success).length;
    const totalAttempts = results.length;

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        results,
        summary: {
          attempted: totalAttempts,
          successful: successCount,
          failed: totalAttempts - successCount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    logStep('Error in send-order-sms function', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});