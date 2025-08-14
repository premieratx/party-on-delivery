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

const logStep = (step: string, details?: any) => {
  console.log(`[GHL-AUTOMATION-TRIGGER] ${step}:`, details || '');
};

// Function to trigger automations from the app
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
      throw error;
    }

    if (!automations || automations.length === 0) {
      logStep('No active automations found for trigger', triggerType);
      return { triggered: 0, message: 'No active automations found' };
    }

    let triggeredCount = 0;
    const results = [];

    // Process each automation
    for (const automation of automations) {
      try {
        const result = await processAutomation(automation, eventData);
        results.push(result);
        if (result.success) triggeredCount++;
      } catch (error) {
        logStep('Error processing automation', { automationId: automation.id, error });
        results.push({ 
          automationId: automation.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      triggered: triggeredCount,
      total: automations.length,
      results: results,
      message: `Successfully triggered ${triggeredCount} out of ${automations.length} automations`
    };

  } catch (error) {
    logStep('Error triggering automation', error);
    throw error;
  }
};

const processAutomation = async (automation: any, eventData: any) => {
  try {
    logStep('Processing automation', { automationId: automation.id, name: automation.name });

    // Check conditions
    if (automation.conditions && !evaluateConditions(automation.conditions, eventData)) {
      logStep('Automation conditions not met', automation.id);
      return { 
        automationId: automation.id, 
        success: false, 
        reason: 'conditions_not_met' 
      };
    }

    // Execute actions
    const actionResults = [];
    for (const action of automation.actions || []) {
      try {
        await executeAction(action, eventData, automation);
        actionResults.push({ type: action.type, success: true });
      } catch (error) {
        logStep('Action execution failed', { action: action.type, error });
        actionResults.push({ 
          type: action.type, 
          success: false, 
          error: error.message 
        });
      }
    }

    // Log automation execution
    await supabase.from('ghl_automation_logs').insert({
      automation_id: automation.id,
      trigger_data: eventData,
      status: 'completed',
      action_results: actionResults,
      executed_at: new Date().toISOString()
    });

    return { 
      automationId: automation.id, 
      success: true, 
      actionsExecuted: actionResults.length,
      actionResults: actionResults
    };

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

    throw error;
  }
};

const evaluateConditions = (conditions: any, eventData: any): boolean => {
  try {
    // Order amount conditions
    if (conditions.min_order_amount && eventData.total_amount < conditions.min_order_amount) {
      return false;
    }
    
    if (conditions.max_order_amount && eventData.total_amount > conditions.max_order_amount) {
      return false;
    }

    // Customer type conditions
    if (conditions.customer_type && eventData.customer_type !== conditions.customer_type) {
      return false;
    }

    // Product category conditions
    if (conditions.required_categories && conditions.required_categories.length > 0) {
      const orderCategories = eventData.line_items?.map((item: any) => item.category) || [];
      const hasRequiredCategory = conditions.required_categories.some((cat: string) => 
        orderCategories.includes(cat)
      );
      if (!hasRequiredCategory) return false;
    }

    // Delivery date conditions
    if (conditions.delivery_date_range) {
      const deliveryDate = new Date(eventData.delivery_date);
      const today = new Date();
      const daysDiff = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (conditions.delivery_date_range.min_days && daysDiff < conditions.delivery_date_range.min_days) {
        return false;
      }
      
      if (conditions.delivery_date_range.max_days && daysDiff > conditions.delivery_date_range.max_days) {
        return false;
      }
    }

    // Time-based conditions
    if (conditions.time_restrictions) {
      const now = new Date();
      const hour = now.getHours();
      
      if (conditions.time_restrictions.start_hour && hour < conditions.time_restrictions.start_hour) {
        return false;
      }
      
      if (conditions.time_restrictions.end_hour && hour > conditions.time_restrictions.end_hour) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logStep('Error evaluating conditions', error);
    return false;
  }
};

const executeAction = async (action: any, eventData: any, automation: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  if (!ghlApiKey) throw new Error("GHL_API_KEY not configured");

  logStep('Executing action', { type: action.type, automationId: automation.id });

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
    
    case 'create_opportunity':
      await createOpportunity(action, eventData);
      break;

    case 'send_internal_notification':
      await sendInternalNotification(action, eventData);
      break;
    
    default:
      logStep('Unknown action type', action.type);
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

const sendAutomatedSMS = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  
  const phone = eventData.customer_phone || eventData.delivery_address?.phone;
  if (!phone) {
    throw new Error('No phone number available for SMS automation');
  }

  // Template replacement
  let message = action.template || "Thank you for your order!";
  message = replaceTemplateVariables(message, eventData);

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

const sendAutomatedEmail = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  
  const email = eventData.customer_email || eventData.delivery_address?.email;
  if (!email) {
    throw new Error('No email available for email automation');
  }

  let subject = action.subject || "Thank you for your order!";
  let htmlContent = action.template || "<p>Thank you for your order!</p>";
  
  subject = replaceTemplateVariables(subject, eventData);
  htmlContent = replaceTemplateVariables(htmlContent, eventData);

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

const addToPipeline = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId || !action.pipeline_id) {
    throw new Error('Missing contactId or pipeline_id for pipeline action');
  }

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

const createTask = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId) {
    throw new Error('Missing contactId for task creation');
  }

  const taskTitle = action.task_title || `Follow up on order ${eventData.order_number}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (action.due_days || 1));

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
      completed: false,
      description: action.description || ''
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Task API error: ${error.message}`);
  }

  logStep('Task created successfully', { contactId, title: taskTitle });
};

const addTag = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId || !action.tag_name) {
    throw new Error('Missing contactId or tag_name for tag action');
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

const createOpportunity = async (action: any, eventData: any) => {
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  const contactId = await findOrCreateContact(eventData);
  
  if (!contactId) {
    throw new Error('Missing contactId for opportunity creation');
  }

  const response = await fetch("https://services.leadconnectorhq.com/opportunities", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlApiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      contactId: contactId,
      name: action.opportunity_name || `Order ${eventData.order_number}`,
      monetaryValue: eventData.total_amount || 0,
      pipelineId: action.pipeline_id,
      pipelineStageId: action.stage_id,
      source: "Party on Delivery App"
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GHL Opportunity API error: ${error.message}`);
  }

  logStep('Opportunity created successfully', { contactId });
};

const sendInternalNotification = async (action: any, eventData: any) => {
  // Send internal notification via SMS or email to team members
  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  
  if (!action.notification_recipients || !action.notification_recipients.length) {
    throw new Error('No notification recipients specified');
  }

  const message = replaceTemplateVariables(
    action.template || `New order alert: ${eventData.order_number}`,
    eventData
  );

  for (const recipient of action.notification_recipients) {
    if (recipient.type === 'sms' && recipient.phone) {
      const formattedPhone = recipient.phone.startsWith('+') ? recipient.phone : `+1${recipient.phone.replace(/\D/g, '')}`;
      
      await fetch("https://services.leadconnectorhq.com/conversations/messages", {
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
          message: `[INTERNAL] ${message}`
        })
      });
    }
  }

  logStep('Internal notifications sent');
};

const replaceTemplateVariables = (template: string, eventData: any): string => {
  return template
    .replace(/\{customer_name\}/g, eventData.customer_name || 'Customer')
    .replace(/\{order_number\}/g, eventData.order_number || '')
    .replace(/\{total_amount\}/g, eventData.total_amount || '')
    .replace(/\{delivery_date\}/g, eventData.delivery_date || '')
    .replace(/\{delivery_time\}/g, eventData.delivery_time || '')
    .replace(/\{delivery_address\}/g, eventData.delivery_address?.street || '')
    .replace(/\{customer_phone\}/g, eventData.customer_phone || eventData.delivery_address?.phone || '')
    .replace(/\{customer_email\}/g, eventData.customer_email || eventData.delivery_address?.email || '')
    .replace(/\{item_count\}/g, eventData.line_items?.length || '0')
    .replace(/\{payment_status\}/g, eventData.payment_status || '')
    .replace(/\{current_date\}/g, new Date().toLocaleDateString())
    .replace(/\{current_time\}/g, new Date().toLocaleTimeString());
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
        source: "Party on Delivery App",
        tags: ["Party on Delivery Customer"]
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
    const { trigger_type, event_data } = await req.json();
    
    if (!trigger_type || !event_data) {
      throw new Error("trigger_type and event_data are required");
    }

    logStep('Processing automation trigger', { trigger_type, event_data });

    const result = await triggerAutomation(trigger_type, event_data);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error processing automation trigger', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to process automation trigger",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});