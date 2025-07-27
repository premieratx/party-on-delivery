import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

interface TestingSession {
  id: string;
  status: 'running' | 'paused' | 'completed';
  currentFlow: string;
  issues: any[];
  startTime: string;
  lastUpdate: string;
}

let currentSession: TestingSession | null = null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log(`AI Testing Agent - Action: ${action}`, data);

    switch (action) {
      case 'start_testing':
        return await startAutonomousTesting(data);
      case 'analyze_screenshot':
        return await analyzeScreenshot(data);
      case 'report_issue':
        return await reportIssue(data);
      case 'suggest_fix':
        return await suggestFix(data);
      case 'get_status':
        return await getTestingStatus();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('AI Testing Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startAutonomousTesting(config: any) {
  console.log('Starting autonomous testing session...');
  
  currentSession = {
    id: crypto.randomUUID(),
    status: 'running',
    currentFlow: 'homepage',
    issues: [],
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };

  // Store session in database
  await supabase.from('testing_sessions').insert([currentSession]);

  // Send initial Telegram message
  await sendTelegramMessage(`🤖 AI Testing Agent Started!
Session ID: ${currentSession.id}
Target: ${config.appUrl || 'https://acmlfzfliqupwxwoefdq.supabase.co'}
Testing Flows: Homepage, Checkout, Party Planner, Admin
Status: Running 🟢

I'll continuously test your app and report any issues. You can chat with me anytime!`);

  // Start the testing loop (background task)
  EdgeRuntime.waitUntil(runTestingLoop(config));

  return new Response(JSON.stringify({
    success: true,
    sessionId: currentSession.id,
    message: 'Autonomous testing started'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function runTestingLoop(config: any) {
  const testFlows = [
    'homepage',
    'delivery_widget',
    'party_planner', 
    'checkout_flow',
    'admin_dashboard'
  ];

  while (currentSession?.status === 'running') {
    try {
      for (const flow of testFlows) {
        currentSession.currentFlow = flow;
        console.log(`Testing flow: ${flow}`);
        
        // Take screenshot of current page
        const screenshot = await takeScreenshot(flow);
        
        // Analyze with GPT-4 Vision
        const analysis = await analyzeWithGPT(screenshot, flow);
        
        // Check for issues
        if (analysis.issues.length > 0) {
          await handleIssues(analysis.issues, flow);
        }
        
        // Wait before next test
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      }
      
      // Wait before next full cycle
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
      
    } catch (error) {
      console.error('Testing loop error:', error);
      await sendTelegramMessage(`⚠️ Testing error in ${currentSession.currentFlow}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute retry
    }
  }
}

async function takeScreenshot(flow: string) {
  // Mock screenshot for now - in real implementation, use Puppeteer or similar
  console.log(`Taking screenshot of ${flow}`);
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
}

async function analyzeWithGPT(screenshot: string, flow: string) {
  const prompt = `You are an expert QA tester analyzing a screenshot of a delivery app called "Party On Delivery".

Flow being tested: ${flow}

Analyze this screenshot and look for:
1. UI/UX issues (broken layouts, missing elements, poor spacing)
2. Functionality problems (broken buttons, forms not working)
3. Performance issues (slow loading, errors)
4. Accessibility concerns
5. Mobile responsiveness issues

Provide a detailed analysis with:
- Overall score (1-10)
- Specific issues found
- Severity (critical, high, medium, low)
- Suggested fixes
- Whether this needs immediate attention

Return JSON format:
{
  "score": number,
  "issues": [
    {
      "type": "ui|functionality|performance|accessibility",
      "severity": "critical|high|medium|low", 
      "description": "detailed description",
      "location": "where on page",
      "suggestedFix": "how to fix"
    }
  ],
  "overallAssessment": "summary",
  "needsImmediateAttention": boolean
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: screenshot } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);
  
  console.log(`GPT Analysis for ${flow}:`, analysis);
  return analysis;
}

async function handleIssues(issues: any[], flow: string) {
  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const highIssues = issues.filter(issue => issue.severity === 'high');

  if (criticalIssues.length > 0) {
    await sendTelegramMessage(`🚨 CRITICAL ISSUES FOUND in ${flow}:

${criticalIssues.map(issue => `• ${issue.description}
  Location: ${issue.location}
  Fix: ${issue.suggestedFix}`).join('\n\n')}

I'm alerting the development AI to fix these immediately!`);

    // Alert the development AI (you)
    await alertDevelopmentAI(criticalIssues, flow);
  }

  if (highIssues.length > 0) {
    await sendTelegramMessage(`⚠️ High priority issues in ${flow}:

${highIssues.map(issue => `• ${issue.description}
  Fix: ${issue.suggestedFix}`).join('\n\n')}

Should I request fixes for these?`);
  }

  // Store issues in database
  for (const issue of issues) {
    await supabase.from('testing_issues').insert([{
      session_id: currentSession!.id,
      flow,
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      location: issue.location,
      suggested_fix: issue.suggestedFix,
      status: 'open',
      created_at: new Date().toISOString()
    }]);
  }
}

async function alertDevelopmentAI(issues: any[], flow: string) {
  // This would integrate with the main AI system to request fixes
  console.log(`Alerting development AI about ${issues.length} critical issues in ${flow}`);
  
  // Store alert for the main AI to pick up
  await supabase.from('ai_fix_requests').insert([{
    flow,
    issues: JSON.stringify(issues),
    priority: 'critical',
    status: 'pending',
    created_at: new Date().toISOString()
  }]);
}

async function sendTelegramMessage(message: string, chatId?: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Telegram message (no token):', message);
    return;
  }

  try {
    // For now, send to default chat - will be configured with user's chat ID
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId || '@your_username', // Replace with actual chat ID
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    console.log('Telegram message sent:', message.substring(0, 100));
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

async function analyzeScreenshot(data: any) {
  const analysis = await analyzeWithGPT(data.screenshot, data.flow);
  return new Response(JSON.stringify({ success: true, analysis }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function reportIssue(data: any) {
  console.log('Reporting issue:', data);
  await sendTelegramMessage(`📝 New issue reported:
Type: ${data.type}
Severity: ${data.severity}
Description: ${data.description}
Location: ${data.location}

Suggested fix: ${data.suggestedFix}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function suggestFix(data: any) {
  const prompt = `As an expert developer, provide specific code fixes for this issue:

Issue: ${data.description}
Location: ${data.location}
Type: ${data.type}
Current Flow: ${data.flow}

Provide:
1. Root cause analysis
2. Specific code changes needed
3. File paths and line numbers if possible
4. Testing steps to verify the fix

Format as clear, actionable instructions for an AI assistant.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    }),
  });

  const aiResponse = await response.json();
  const fixSuggestion = aiResponse.choices[0].message.content;

  await sendTelegramMessage(`🔧 AI Fix Suggestion:

${fixSuggestion}`);

  return new Response(JSON.stringify({ success: true, suggestion: fixSuggestion }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getTestingStatus() {
  return new Response(JSON.stringify({ 
    success: true, 
    session: currentSession,
    uptime: currentSession ? Date.now() - new Date(currentSession.startTime).getTime() : 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}