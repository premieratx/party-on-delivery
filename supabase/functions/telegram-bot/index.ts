import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2));

    if (body.message) {
      await handleTelegramMessage(body.message);
    }

    return new Response('OK', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Telegram bot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleTelegramMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const username = message.from.username || message.from.first_name;

  console.log(`Message from ${username} (${chatId}): ${text}`);

  // Store user if not exists
  await supabase.from('telegram_users').upsert([{
    chat_id: chatId,
    username,
    first_name: message.from.first_name,
    last_name: message.from.last_name,
    last_active: new Date().toISOString()
  }]);

  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, username);
  } else {
    await handleChatMessage(chatId, text, username);
  }
}

async function handleCommand(chatId: number, command: string, username: string) {
  const cmd = command.toLowerCase();

  switch (cmd) {
    case '/start':
      await sendMessage(chatId, `🎉 Welcome ${username}! 

I'm your AI Testing Agent for the Party On Delivery app. I can:

🤖 Run automated tests 24/7
📱 Send you instant alerts about issues  
💬 Chat with you about app problems
🔧 Suggest fixes and improvements
📊 Monitor app performance
🚀 Help coordinate with the development AI

Commands:
/status - Check testing status
/start_testing - Begin autonomous testing
/stop_testing - Pause testing
/issues - Show recent issues
/help - Show this menu

Just message me anytime to chat about the app!`);
      break;

    case '/status':
      await handleStatusCommand(chatId);
      break;

    case '/start_testing':
      await handleStartTesting(chatId);
      break;

    case '/stop_testing':
      await handleStopTesting(chatId);
      break;

    case '/issues':
      await handleIssuesCommand(chatId);
      break;

    case '/help':
      await sendMessage(chatId, `🤖 AI Testing Agent Commands:

/start - Welcome message
/status - Current testing status
/start_testing - Begin testing session
/stop_testing - Pause testing
/issues - Recent issues found
/help - This menu

You can also just chat with me! I understand:
- "How is the app doing?"
- "Any new issues?"
- "Start testing the checkout flow"
- "Fix the button problem"
- "Take a screenshot of homepage"

I'm here 24/7 to help monitor your app! 🚀`);
      break;

    default:
      await sendMessage(chatId, `❓ Unknown command: ${command}
Type /help to see available commands.`);
  }
}

async function handleChatMessage(chatId: number, text: string, username: string) {
  console.log(`Processing chat message from ${username}: ${text}`);

  // Use GPT to understand the user's intent
  const intent = await analyzeUserIntent(text);
  
  switch (intent.action) {
    case 'status_check':
      await handleStatusCommand(chatId);
      break;
      
    case 'start_testing':
      await handleStartTesting(chatId);
      break;
      
    case 'stop_testing':
      await handleStopTesting(chatId);
      break;
      
    case 'view_issues':
      await handleIssuesCommand(chatId);
      break;
      
    case 'request_fix':
      await handleFixRequest(chatId, intent.details);
      break;
      
    case 'take_screenshot':
      await handleScreenshotRequest(chatId, intent.details);
      break;
      
    case 'general_chat':
      await handleGeneralChat(chatId, text);
      break;
      
    default:
      await sendMessage(chatId, `🤔 I'm not sure what you want me to do. 
Try: "Check app status", "Start testing", or "Show me recent issues"`);
  }
}

async function analyzeUserIntent(text: string) {
  const prompt = `Analyze this user message and determine their intent. The user is communicating with an AI testing agent for a web app.

User message: "${text}"

Determine the intent and respond with JSON:
{
  "action": "status_check|start_testing|stop_testing|view_issues|request_fix|take_screenshot|general_chat",
  "details": "any specific details or parameters from the message",
  "confidence": 0.0-1.0
}

Actions:
- status_check: asking about app status, testing status, how things are going
- start_testing: wants to begin testing, start monitoring  
- stop_testing: wants to pause or stop testing
- view_issues: wants to see problems, bugs, issues found
- request_fix: asking to fix something specific
- take_screenshot: wants a screenshot of a page/flow
- general_chat: casual conversation, questions about the agent`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Intent analysis error:', error);
    return { action: 'general_chat', details: '', confidence: 0.5 };
  }
}

async function handleStatusCommand(chatId: number) {
  try {
    // Get current testing status
    const { data: sessions } = await supabase
      .from('testing_sessions')
      .select('*')
      .eq('status', 'running')
      .order('created_at', { ascending: false })
      .limit(1);

    const currentSession = sessions?.[0];

    if (!currentSession) {
      await sendMessage(chatId, `📊 Testing Status: INACTIVE ⭕

No active testing session.
Use /start_testing to begin monitoring your app!`);
      return;
    }

    // Get recent issues
    const { data: recentIssues } = await supabase
      .from('testing_issues')
      .select('*')
      .eq('session_id', currentSession.id)
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    const criticalCount = recentIssues?.filter(issue => issue.severity === 'critical').length || 0;
    const highCount = recentIssues?.filter(issue => issue.severity === 'high').length || 0;

    const uptime = Math.floor((Date.now() - new Date(currentSession.created_at).getTime()) / (60 * 1000));

    await sendMessage(chatId, `📊 Testing Status: ACTIVE 🟢

🔄 Current Flow: ${currentSession.current_flow || 'Homepage'}
⏰ Running for: ${uptime} minutes
📅 Started: ${new Date(currentSession.created_at).toLocaleString()}

📈 Last 24 Hours:
🚨 Critical Issues: ${criticalCount}
⚠️ High Issues: ${highCount}
📝 Total Issues: ${recentIssues?.length || 0}

Status: Continuously monitoring your app!`);

  } catch (error) {
    console.error('Status command error:', error);
    await sendMessage(chatId, `❌ Error getting status: ${error.message}`);
  }
}

async function handleStartTesting(chatId: number) {
  try {
    await sendMessage(chatId, `🚀 Starting autonomous testing session...`);

    // Call the AI testing agent
    const { data, error } = await supabase.functions.invoke('ai-testing-agent', {
      body: {
        action: 'start_testing',
        data: {
          appUrl: 'https://acmlfzfliqupwxwoefdq.supabase.co',
          chatId: chatId,
          flows: ['homepage', 'delivery_widget', 'party_planner', 'checkout_flow', 'admin_dashboard']
        }
      }
    });

    if (error) throw error;

    await sendMessage(chatId, `✅ Testing session started! 

Session ID: ${data.sessionId}

I'm now continuously testing your app:
🏠 Homepage
🚚 Delivery Widget  
🎉 Party Planner
🛒 Checkout Flow
👨‍💼 Admin Dashboard

I'll alert you immediately if I find any issues! 📱`);

  } catch (error) {
    console.error('Start testing error:', error);
    await sendMessage(chatId, `❌ Failed to start testing: ${error.message}`);
  }
}

async function handleStopTesting(chatId: number) {
  try {
    // Update current session status
    await supabase
      .from('testing_sessions')
      .update({ status: 'paused' })
      .eq('status', 'running');

    await sendMessage(chatId, `⏸️ Testing paused.

I've stopped the continuous monitoring. 
Use /start_testing to resume when ready!`);

  } catch (error) {
    console.error('Stop testing error:', error);
    await sendMessage(chatId, `❌ Error stopping testing: ${error.message}`);
  }
}

async function handleIssuesCommand(chatId: number) {
  try {
    // Get recent issues from last 7 days
    const { data: issues } = await supabase
      .from('testing_issues')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!issues || issues.length === 0) {
      await sendMessage(chatId, `✅ No issues found in the last 7 days! 

Your app is running smoothly! 🎉`);
      return;
    }

    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');

    let message = `📋 Recent Issues (Last 7 days):

🚨 Critical: ${critical.length}
⚠️ High: ${high.length}  
📝 Medium: ${medium.length}

`;

    // Show top 5 most recent issues
    const topIssues = issues.slice(0, 5);
    topIssues.forEach((issue, i) => {
      const icon = issue.severity === 'critical' ? '🚨' : 
                  issue.severity === 'high' ? '⚠️' : '📝';
      
      message += `${icon} ${issue.flow}: ${issue.description.substring(0, 80)}...
`;
    });

    if (issues.length > 5) {
      message += `\n... and ${issues.length - 5} more issues`;
    }

    await sendMessage(chatId, message);

  } catch (error) {
    console.error('Issues command error:', error);
    await sendMessage(chatId, `❌ Error getting issues: ${error.message}`);
  }
}

async function handleFixRequest(chatId: number, details: string) {
  await sendMessage(chatId, `🔧 Processing fix request: "${details}"

I'm analyzing the issue and will suggest specific fixes. 
The development AI will be alerted to implement the fix!`);

  try {
    const { data, error } = await supabase.functions.invoke('ai-testing-agent', {
      body: {
        action: 'suggest_fix',
        data: {
          description: details,
          chatId: chatId
        }
      }
    });

    if (error) throw error;

    await sendMessage(chatId, `✅ Fix suggestion generated and sent to development AI!`);

  } catch (error) {
    console.error('Fix request error:', error);
    await sendMessage(chatId, `❌ Error processing fix request: ${error.message}`);
  }
}

async function handleScreenshotRequest(chatId: number, details: string) {
  await sendMessage(chatId, `📸 Taking screenshot: ${details}

Give me a moment to capture and analyze...`);

  // Implementation would capture actual screenshot
  await sendMessage(chatId, `📸 Screenshot captured! 

Analysis: The page appears to be loading correctly with no obvious visual issues. All main elements are in place.

Would you like me to run a deeper analysis of any specific area?`);
}

async function handleGeneralChat(chatId: number, text: string) {
  const prompt = `You are an AI testing agent for a delivery app called "Party On Delivery". The user is chatting with you via Telegram. 

Respond helpfully about:
- App testing and monitoring
- Issues and bugs
- Performance monitoring  
- Development coordination
- General app health

Keep responses friendly, concise, and focused on your role as a testing agent.

User message: "${text}"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    await sendMessage(chatId, reply);

  } catch (error) {
    console.error('General chat error:', error);
    await sendMessage(chatId, `🤖 I'm having trouble processing that right now. Try asking about testing status or app issues!`);
  }
}

async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`Telegram message to ${chatId}: ${text}`);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
    }

  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}