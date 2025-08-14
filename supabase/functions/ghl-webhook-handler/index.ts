import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface GHLWebhookPayload {
  type: string;
  id: string;
  locationId: string;
  contactId?: string;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}

interface AutomationTrigger {
  id: string;
  name: string;
  trigger_type: 'order_created' | 'order_completed' | 'customer_signup' | 'cart_abandoned' | 'payment_failed';
  conditions: any;
  actions: AutomationAction[];
  is_active: boolean;
}

interface AutomationAction {
  type: 'send_sms' | 'send_email' | 'add_to_pipeline' | 'create_task' | 'add_tag' | 'wait';
  delay_minutes?: number;
  template?: string;
  pipeline_id?: string;
  tag_name?: string;
  task_title?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[GHL-WEBHOOK] ${step}:`, details || '');
};

const triggerAutomation = async (triggerType: string, eventData: any) => {
  try {
    logStep('Triggering automation', { triggerType, eventData });

    // Get active automations for this trigger type
    const { data: automations, error } = await supabase
      .from('ghl_automations')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true);

    if (error) {
      logStep('Error fetching automations', error);
      return;
    }

    if (!automations || automations.length === 0) {
      logStep('No active automations found for trigger', triggerType);
      return;
    }

    // Process each automation
    for (const automation of automations) {
      await processAutomation(automation, eventData);
    }

  } catch (error) {
    logStep('Error triggering automation', error);
  }
};

const processAutomation = async (automation: AutomationTrigger, eventData: any) => {
  try {
    logStep('Processing automation', { automationId: automation.id, name: automation.name });

    // Check conditions
    if (automation.conditions && !evaluateConditions(automation.conditions, eventData)) {
      logStep('Automation conditions not met', automation.id);
      return;
    }

    // Execute actions
    for (const action of automation.actions) {
      await executeAction(action, eventData, automation);
    }

    // Log automation execution
    await supabase.from('ghl_automation_logs').insert({
      automation_id: automation.id,
      trigger_data: eventData,
      status: 'completed',
      executed_at: new Date().toISOString()
    });

  } catch (error) {
    logStep('Error processing automation', { automationId: automation.id, error });
    
    // Log failed execution
    await supabase.from('ghl_automation_logs').insert({
      automation_id: automation.id,
      trigger_data: eventData,
      status: 'failed',
      error_message: error.message,
      executed_at: new Date().toISOString()
    });
  }
};

const evaluateConditions = (conditions: any, eventData: any): boolean => {
  // Simple condition evaluation - can be extended
  if (conditions.min_order_amount && eventData.total_amount < conditions.min_order_amount) {
    return false;
  }
  
  if (conditions.customer_type && eventData.customer_type !== conditions.customer_type) {
    return false;
  }

  if (conditions.product_categories && conditions.product_categories.length > 0) {
    const orderCategories = eventData.line_items?.map((item: any) => item.category) || [];
    const hasRequiredCategory = conditions.product_categories.some((cat: string) => 
      orderCategories.includes(cat)
    );
    if (!hasRequiredCategory) return false;
  }

  return true;
};

const executeAction = async (action: AutomationAction, eventData: any, automation: AutomationTrigger) => {
  try {
    logStep('Executing action', { type: action.type, automationId: automation.id });

    // Apply delay if specified
    if (action.delay_minutes && action.delay_minutes > 0) {
      logStep('Action has delay, scheduling for later', { delay: action.delay_minutes });
      // In a real implementation, you'd use a job queue or scheduler
      // For now, we'll execute immediately but log the intended delay
    }

    switch (action.type) {
      case 'send_sms':
        await sendAutomatedSMS(action, eventData);
        break;
      
      case 'send_email':
        await sendAutomatedEmail(action, eventData);
        break;
      
      case 'add_to_pipeline':
        await addToPipeline(action, eventData);
        break;
      
      case 'create_task':
        await createTask(action, eventData);
        break;
      
      case 'add_tag':
        await addTag(action, eventData);
        break;
      
      case 'wait':
        logStep('Wait action executed', { delay: action.delay_minutes });
        break;
      
      default:
        logStep('Unknown action type', action.type);
    }

  } catch (error) {
    logStep('Error executing action', { action: action.type, error });
    throw error;
  }
};

const sendAutomatedSMS = async (action: AutomationAction, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  const phone = eventData.customer_phone || eventData.delivery_address?.phone;
  if (!phone) {
    logStep('No phone number available for SMS automation');
    return;
  }

  // Template replacement
  let message = action.template || "Thank you for your order!";
  message = message.replace(/\{customer_name\}/g, eventData.customer_name || 'Customer');
  message = message.replace(/\{order_number\}/g, eventData.order_number || '');
  message = message.replace(/\{total_amount\}/g, eventData.total_amount || '');
  message = message.replace(/\{delivery_date\}/g, eventData.delivery_date || '');

  const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

  const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      type: "SMS",
      contactId: null,
      phone: formattedPhone,
      message: message
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL SMS API error: ${error.message}`);
  }

  logStep('Automated SMS sent successfully', { phone: formattedPhone });
};

const sendAutomatedEmail = async (action: AutomationAction, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  const email = eventData.customer_email || eventData.delivery_address?.email;
  if (!email) {
    logStep('No email available for email automation');
    return;
  }

  // Template replacement
  let subject = "Thank you for your order!";
  let htmlContent = action.template || "<p>Thank you for your order!</p>";
  
  htmlContent = htmlContent.replace(/\{customer_name\}/g, eventData.customer_name || 'Customer');
  htmlContent = htmlContent.replace(/\{order_number\}/g, eventData.order_number || '');
  htmlContent = htmlContent.replace(/\{total_amount\}/g, eventData.total_amount || '');

  // Use GHL Email API
  const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      type: "Email",
      contactId: null,
      email: email,
      subject: subject,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Email API error: ${error.message}`);
  }

  logStep('Automated email sent successfully', { email });
};

const addToPipeline = async (action: AutomationAction, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  // First, find or create contact
  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId || !action.pipeline_id) {
    logStep('Missing contactId or pipeline_id for pipeline action');
    return;
  }

  // Add contact to pipeline
  const response = await fetch(`https://services.leadconnectorhq.com/pipelines/${action.pipeline_id}/opportunities`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      contactId: contactId,
      name: `Order ${eventData.order_number || 'New Order'}`,
      monetaryValue: eventData.total_amount || 0,
      source: "Party on Delivery App"
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Pipeline API error: ${error.message}`);
  }

  logStep('Contact added to pipeline successfully', { contactId, pipelineId: action.pipeline_id });
};

const createTask = async (action: AutomationAction, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId) {
    logStep('Missing contactId for task creation');
    return;
  }

  const taskTitle = action.task_title || `Follow up on order ${eventData.order_number}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow

  const response = await fetch("https://services.leadconnectorhq.com/tasks", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      contactId: contactId,
      title: taskTitle,
      dueDate: dueDate.toISOString(),
      completed: false
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Task API error: ${error.message}`);
  }

  logStep('Task created successfully', { contactId, title: taskTitle });
};

const addTag = async (action: AutomationAction, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId || !action.tag_name) {
    logStep('Missing contactId or tag_name for tag action');
    return;
  }

  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      tags: [action.tag_name]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Tag API error: ${error.message}`);
  }

  logStep('Tag added successfully', { contactId, tag: action.tag_name });
};

const findOrCreateContact = async (eventData: any): Promise<string | null> => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) return null;

  const email = eventData.customer_email || eventData.delivery_address?.email;
  const phone = eventData.customer_phone || eventData.delivery_address?.phone;
  
  if (!email && !phone) {
    logStep('No email or phone for contact creation');
    return null;
  }

  try {
    // Search for existing contact
    let searchUrl = "https://services.leadconnectorhq.com/contacts/search/duplicate";
    const searchParams = new URLSearchParams();
    
    if (email) searchParams.append('email', email);
    if (phone) searchParams.append('phone', phone);
    
    searchUrl += `?${searchParams.toString()}`;

    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Version": "2021-07-28"
      }
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.contact && searchResult.contact.id) {
        logStep('Found existing contact', searchResult.contact.id);
        return searchResult.contact.id;
      }
    }

    // Create new contact
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`) : undefined;
    
    const createResponse = await fetch("https://services.leadconnectorhq.com/contacts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        firstName: eventData.customer_name?.split(' ')[0] || 'Customer',
        lastName: eventData.customer_name?.split(' ').slice(1).join(' ') || '',
        email: email,
        phone: formattedPhone,
        source: "Party on Delivery App"
      })
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      logStep('Created new contact', createResult.contact.id);
      return createResult.contact.id;
    }

  } catch (error) {
    logStep('Error finding/creating contact', error);
  }

  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: GHLWebhookPayload = await req.json();
    
    logStep('Received GHL webhook', payload);

    // Store webhook for audit trail
    await supabase.from('ghl_webhook_logs').insert({
      webhook_type: payload.type,
      payload: payload,
      received_at: new Date().toISOString()
    });

    // Process based on webhook type
    switch (payload.type) {
      case 'InboundMessage':
        logStep('Processing inbound message webhook');
        // Handle incoming messages - could trigger customer service automations
        await triggerAutomation('customer_message', payload.data);
        break;

      case 'OutboundMessage':
        logStep('Processing outbound message webhook');
        // Track sent messages
        break;

      case 'ContactCreate':
        logStep('Processing contact create webhook');
        await triggerAutomation('customer_signup', payload.data);
        break;

      case 'ContactUpdate':
        logStep('Processing contact update webhook');
        break;

      default:
        logStep('Unhandled webhook type', payload.type);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully",
        type: payload.type,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error processing webhook', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to process webhook",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});