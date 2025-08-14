import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GENERATE-QUOTE-PDF] ${step}:`, details || '');
};

interface QuoteItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  category?: string;
}

interface QuoteData {
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  
  // Event Details
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventLocation: string;
  eventDescription?: string;
  
  // Quote Items & Pricing
  items: QuoteItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount: number;
  totalAmount: number;
  
  // Quote Metadata
  quoteNumber: string;
  expirationDate: string;
  notes?: string;
  createdBy: 'affiliate' | 'ai_agent' | 'admin';
  affiliateCode?: string;
}

const generateHTML = (quoteData: QuoteData): string => {
  const logoUrl = "https://acmlfzfliqupwxwoefdq.supabase.co/storage/v1/object/public/cover-assets/party-on-delivery-logo.png";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote ${quoteData.quoteNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #7C3AED;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          height: 60px;
        }
        .quote-info {
          text-align: right;
        }
        .quote-number {
          font-size: 24px;
          font-weight: bold;
          color: #7C3AED;
          margin: 0;
        }
        .quote-date {
          color: #666;
          margin: 5px 0 0 0;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #7C3AED;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .customer-event-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          display: inline-block;
          min-width: 100px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #7C3AED;
        }
        .items-table tr:hover {
          background-color: #f8f9fa;
        }
        .price-column {
          text-align: right;
        }
        .totals {
          float: right;
          width: 300px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .total-row.final {
          border-top: 2px solid #7C3AED;
          margin-top: 10px;
          padding-top: 10px;
          font-weight: bold;
          font-size: 18px;
          color: #7C3AED;
        }
        .notes {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #7C3AED;
          margin-top: 30px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .cta-section {
          background: linear-gradient(135deg, #7C3AED, #A855F7);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
        }
        .cta-section h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .cta-section p {
          margin: 0;
          opacity: 0.9;
        }
        @media print {
          body { padding: 0; }
          .cta-section { background: #7C3AED !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Party On Delivery" class="logo">
        <div class="quote-info">
          <h1 class="quote-number">Quote ${quoteData.quoteNumber}</h1>
          <p class="quote-date">Created: ${new Date().toLocaleDateString()}</p>
          <p class="quote-date">Expires: ${new Date(quoteData.expirationDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div class="customer-event-grid">
        <div class="section">
          <h2 class="section-title">Customer Information</h2>
          <div class="info-item">
            <span class="info-label">Name:</span>
            ${quoteData.customerName}
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            ${quoteData.customerEmail}
          </div>
          ${quoteData.customerPhone ? `
          <div class="info-item">
            <span class="info-label">Phone:</span>
            ${quoteData.customerPhone}
          </div>
          ` : ''}
          ${quoteData.customerCompany ? `
          <div class="info-item">
            <span class="info-label">Company:</span>
            ${quoteData.customerCompany}
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h2 class="section-title">Event Details</h2>
          <div class="info-item">
            <span class="info-label">Type:</span>
            ${quoteData.eventType}
          </div>
          ${quoteData.eventDate ? `
          <div class="info-item">
            <span class="info-label">Date:</span>
            ${new Date(quoteData.eventDate).toLocaleDateString()}
          </div>
          ` : ''}
          ${quoteData.eventTime ? `
          <div class="info-item">
            <span class="info-label">Time:</span>
            ${quoteData.eventTime}
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Guests:</span>
            ${quoteData.guestCount}
          </div>
          ${quoteData.eventLocation ? `
          <div class="info-item">
            <span class="info-label">Location:</span>
            ${quoteData.eventLocation}
          </div>
          ` : ''}
        </div>
      </div>

      ${quoteData.eventDescription ? `
      <div class="section">
        <h2 class="section-title">Event Description</h2>
        <p>${quoteData.eventDescription}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Quote Items</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th class="price-column">Unit Price</th>
              <th class="price-column">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quoteData.items.map(item => `
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity}</td>
              <td class="price-column">$${item.price.toFixed(2)}</td>
              <td class="price-column">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${quoteData.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Delivery Fee:</span>
            <span>$${quoteData.deliveryFee.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Sales Tax:</span>
            <span>$${quoteData.salesTax.toFixed(2)}</span>
          </div>
          ${quoteData.tipAmount > 0 ? `
          <div class="total-row">
            <span>Tip:</span>
            <span>$${quoteData.tipAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>Total:</span>
            <span>$${quoteData.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div style="clear: both;"></div>
      </div>

      <div class="cta-section">
        <h3>Ready to Book Your Event?</h3>
        <p>Contact us to confirm your order and schedule delivery for your special event!</p>
        <p><strong>Email:</strong> orders@partyondelivery.com | <strong>Phone:</strong> (737) 371-9700</p>
      </div>

      ${quoteData.notes ? `
      <div class="notes">
        <h3 style="margin-top: 0; color: #7C3AED;">Additional Notes</h3>
        <p style="margin-bottom: 0;">${quoteData.notes}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Party On Delivery</strong> - Premium Event Delivery Service</p>
        <p>www.partyondelivery.com | orders@partyondelivery.com | (737) 371-9700</p>
        <p>This quote is valid until ${new Date(quoteData.expirationDate).toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting quote PDF generation");
    
    const { quoteData }: { quoteData: QuoteData } = await req.json();
    
    if (!quoteData) {
      throw new Error("Quote data is required");
    }

    logStep("Generating HTML for quote", { quoteNumber: quoteData.quoteNumber });
    
    const htmlContent = generateHTML(quoteData);
    
    // Store quote in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data: storedQuote, error: storeError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteData.quoteNumber,
        customer_name: quoteData.customerName,
        customer_email: quoteData.customerEmail,
        customer_phone: quoteData.customerPhone,
        event_type: quoteData.eventType,
        event_date: quoteData.eventDate || null,
        event_time: quoteData.eventTime || null,
        guest_count: quoteData.guestCount,
        event_location: quoteData.eventLocation,
        items: quoteData.items,
        subtotal: quoteData.subtotal,
        delivery_fee: quoteData.deliveryFee,
        sales_tax: quoteData.salesTax,
        tip_amount: quoteData.tipAmount,
        total_amount: quoteData.totalAmount,
        expiration_date: quoteData.expirationDate,
        notes: quoteData.notes,
        created_by: quoteData.createdBy,
        affiliate_code: quoteData.affiliateCode,
        status: 'sent'
      })
      .select()
      .single();

    if (storeError) {
      logStep("Error storing quote", storeError);
    } else {
      logStep("Quote stored successfully", { id: storedQuote.id });
    }

    // Return HTML content for client-side PDF generation
    return new Response(
      JSON.stringify({
        success: true,
        quoteId: storedQuote?.id,
        htmlContent,
        quoteNumber: quoteData.quoteNumber,
        customerEmail: quoteData.customerEmail
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("Error generating quote PDF", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to generate quote PDF"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});