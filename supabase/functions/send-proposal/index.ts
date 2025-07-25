import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailProposalRequest {
  email: string;
  proposal: {
    eventType: string;
    events: Array<{
      eventName: string;
      numberOfPeople: number;
      drinkerType: string;
      budget: number;
      eventDuration: number;
      drinkTypes: string[];
      recommendations: {
        beerCans: number;
        wineBottles: number;
        liquorBottles: number;
        cocktailKits: number;
      };
      selectedItems: Array<{
        category: string;
        items: Array<{
          title: string;
          quantity: number;
          price: number;
        }>;
        totalCost: number;
      }>;
    }>;
    totalBudget: number;
    totalSpent: number;
  };
}

const formatProposalEmail = (proposal: EmailProposalRequest['proposal']) => {
  const eventTypeDisplay = proposal.eventType === 'wedding party' ? 'Wedding Celebration' : 
    proposal.eventType.charAt(0).toUpperCase() + proposal.eventType.slice(1);

  let emailContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333;">
      <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 Your Party Planning Proposal</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${eventTypeDisplay}</p>
      </div>
      
      <div style="padding: 30px 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #495057;">📊 Budget Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Total Budget:</strong> $${proposal.totalBudget.toFixed(2)}
            </div>
            <div>
              <strong>Total Selected:</strong> $${proposal.totalSpent.toFixed(2)}
            </div>
          </div>
          <div style="margin-top: 10px; padding: 10px; background: ${proposal.totalSpent <= proposal.totalBudget ? '#d4edda' : '#f8d7da'}; border-radius: 5px; color: ${proposal.totalSpent <= proposal.totalBudget ? '#155724' : '#721c24'};">
            <strong>${proposal.totalSpent <= proposal.totalBudget ? 'Within Budget! 🎯' : `Over Budget by $${(proposal.totalSpent - proposal.totalBudget).toFixed(2)} ⚠️`}</strong>
          </div>
        </div>
  `;

  proposal.events.forEach((event, index) => {
    emailContent += `
      <div style="margin-bottom: 40px; border: 1px solid #e9ecef; border-radius: 10px; overflow: hidden;">
        <div style="background: #6c757d; color: white; padding: 15px 20px;">
          <h3 style="margin: 0; font-size: 20px;">${event.eventName}</h3>
        </div>
        
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${event.numberOfPeople}</div>
              <div style="font-size: 12px; color: #6c757d;">People</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${event.eventDuration}</div>
              <div style="font-size: 12px; color: #6c757d;">Hours</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #6c757d; text-transform: capitalize;">${event.drinkerType}</div>
              <div style="font-size: 12px; color: #6c757d;">Drinkers</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #6c757d;">$${event.budget}</div>
              <div style="font-size: 12px; color: #6c757d;">Budget</div>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px 0; color: #495057;">🍻 Recommended Quantities</h4>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
              ${event.recommendations.beerCans > 0 ? `<div><strong>${event.recommendations.beerCans}</strong><br><small>Beer Cans</small></div>` : ''}
              ${event.recommendations.wineBottles > 0 ? `<div><strong>${event.recommendations.wineBottles}</strong><br><small>Wine Bottles</small></div>` : ''}
              ${event.recommendations.liquorBottles > 0 ? `<div><strong>${event.recommendations.liquorBottles}</strong><br><small>Liquor Bottles</small></div>` : ''}
              ${event.recommendations.cocktailKits > 0 ? `<div><strong>${event.recommendations.cocktailKits}</strong><br><small>Cocktail Kits</small></div>` : ''}
            </div>
          </div>
    `;

    if (event.selectedItems && event.selectedItems.length > 0) {
      emailContent += `
        <h4 style="margin: 20px 0 10px 0; color: #495057;">🛒 Selected Products</h4>
      `;
      
      event.selectedItems.forEach(category => {
        emailContent += `
          <div style="margin-bottom: 15px;">
            <h5 style="margin: 0 0 8px 0; color: #6c757d; text-transform: capitalize;">${category.category} - $${category.totalCost.toFixed(2)}</h5>
            <div style="margin-left: 15px;">
        `;
        
        category.items.forEach(item => {
          emailContent += `
            <div style="margin-bottom: 5px; padding: 5px 0; border-bottom: 1px solid #f8f9fa;">
              <strong>${item.quantity}x</strong> ${item.title} - $${(item.price * item.quantity).toFixed(2)}
            </div>
          `;
        });
        
        emailContent += `</div></div>`;
      });
    }

    emailContent += `</div></div>`;
  });

  emailContent += `
        <div style="text-align: center; padding: 30px 20px; background: #f8f9fa; border-radius: 10px;">
          <h3 style="margin: 0 0 15px 0; color: #495057;">Ready to Party? 🎉</h3>
          <p style="margin: 0 0 20px 0; color: #6c757d;">Your proposal is ready! Visit Party on Delivery to place your order.</p>
          <a href="https://partyondelivery.com" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Shop Now</a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
        <p>This proposal was generated by Party on Delivery's Party Planner</p>
      </div>
    </div>
  `;

  return emailContent;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, proposal }: EmailProposalRequest = await req.json();

    if (!email || !proposal) {
      return new Response(
        JSON.stringify({ error: "Email and proposal data are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = formatProposalEmail(proposal);
    const eventTypeDisplay = proposal.eventType === 'wedding party' ? 'Wedding Celebration' : 
      proposal.eventType.charAt(0).toUpperCase() + proposal.eventType.slice(1);

    const emailResponse = await resend.emails.send({
      from: "Party on Delivery <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 Your ${eventTypeDisplay} Planning Proposal - Party on Delivery`,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Proposal sent successfully!",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-proposal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);