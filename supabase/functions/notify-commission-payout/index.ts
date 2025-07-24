import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[notify-commission-payout] ${step}:`, details || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting commission payout notification');

    // Parse request body
    const { 
      affiliateId,
      amount,
      referralIds,
      payoutMethod = 'email' 
    } = await req.json();

    if (!affiliateId || !amount || !referralIds) {
      throw new Error("Missing required fields");
    }

    logStep('Request data parsed', { affiliateId, amount, referralIds: referralIds.length, payoutMethod });

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get affiliate information
    const { data: affiliate, error: affiliateError } = await supabaseService
      .from('affiliates')
      .select('email, name, company_name')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      logStep('Affiliate not found', { affiliateId });
      throw new Error("Affiliate not found");
    }

    // Get referral details
    const { data: referrals, error: referralsError } = await supabaseService
      .from('affiliate_referrals')
      .select('order_id, customer_email, subtotal, commission_amount, order_date')
      .in('id', referralIds);

    if (referralsError) {
      logStep('Error fetching referrals', referralsError);
      throw new Error("Failed to fetch referrals");
    }

    // Create commission payout record
    const { data: payout, error: payoutError } = await supabaseService
      .from('commission_payouts')
      .insert({
        affiliate_id: affiliateId,
        amount: amount,
        referral_ids: referralIds,
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError) {
      logStep('Error creating payout record', payoutError);
      throw new Error("Failed to create payout record");
    }

    // Mark referrals as included in payout
    const { error: updateError } = await supabaseService
      .from('affiliate_referrals')
      .update({ paid_out: true })
      .in('id', referralIds);

    if (updateError) {
      logStep('Error updating referrals', updateError);
    }

    // Send notification email
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const emailData = {
          from: 'Party On Delivery <noreply@partyondelivery.com>',
          to: [affiliate.email],
          subject: `Commission Payout Ready - $${amount.toFixed(2)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4F46E5;">Commission Payout Ready</h1>
              
              <p>Dear ${affiliate.name},</p>
              
              <p>Your commission payout is ready! Here are the details:</p>
              
              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Payout Summary</h3>
                <ul>
                  <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
                  <li><strong>Company:</strong> ${affiliate.company_name}</li>
                  <li><strong>Orders:</strong> ${referrals?.length || 0} referrals</li>
                  <li><strong>Payout ID:</strong> ${payout.id}</li>
                </ul>
              </div>
              
              ${referrals && referrals.length > 0 ? `
                <h3>Orders Included</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #F9FAFB;">
                      <th style="border: 1px solid #E5E7EB; padding: 8px; text-align: left;">Order ID</th>
                      <th style="border: 1px solid #E5E7EB; padding: 8px; text-align: left;">Date</th>
                      <th style="border: 1px solid #E5E7EB; padding: 8px; text-align: right;">Order Value</th>
                      <th style="border: 1px solid #E5E7EB; padding: 8px; text-align: right;">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${referrals.map(ref => `
                      <tr>
                        <td style="border: 1px solid #E5E7EB; padding: 8px;">${ref.order_id}</td>
                        <td style="border: 1px solid #E5E7EB; padding: 8px;">${new Date(ref.order_date).toLocaleDateString()}</td>
                        <td style="border: 1px solid #E5E7EB; padding: 8px; text-align: right;">$${ref.subtotal.toFixed(2)}</td>
                        <td style="border: 1px solid #E5E7EB; padding: 8px; text-align: right;">$${ref.commission_amount.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}
              
              <p>We will process your payout within 3-5 business days. You will receive another email once the payment has been sent.</p>
              
              <p>If you have any questions, please contact us at support@partyondelivery.com</p>
              
              <p>Thank you for being a valued affiliate partner!</p>
              
              <p>Best regards,<br>The Party On Delivery Team</p>
            </div>
          `
        };

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (emailResponse.ok) {
          logStep('Payout notification email sent successfully');
        } else {
          const emailError = await emailResponse.text();
          logStep('Failed to send payout notification email', { error: emailError });
        }
      }
    } catch (emailError) {
      logStep('Error sending payout notification email', emailError);
    }

    logStep('Commission payout notification completed', { payoutId: payout.id });

    return new Response(
      JSON.stringify({
        success: true,
        payout: {
          id: payout.id,
          amount: amount,
          status: payout.status
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in notify-commission-payout function', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to process payout notification"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});