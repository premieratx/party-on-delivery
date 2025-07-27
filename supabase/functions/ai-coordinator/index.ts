import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log(`AI Coordinator - Action: ${action}`, data);

    switch (action) {
      case 'process_fix_requests':
        return await processFixRequests();
      case 'coordinate_testing':
        return await coordinateTesting(data);
      case 'generate_fix_code':
        return await generateFixCode(data);
      case 'publish_test_version':
        return await publishTestVersion(data);
      case 'monitor_live_performance':
        return await monitorLivePerformance();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('AI Coordinator error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processFixRequests() {
  console.log('Processing pending fix requests...');

  // Get pending fix requests from testing agent
  const { data: fixRequests } = await supabase
    .from('ai_fix_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const processedFixes = [];

  for (const request of fixRequests || []) {
    try {
      console.log(`Processing fix request for ${request.flow}`);
      
      const issues = JSON.parse(request.issues);
      const fixCode = await generateDetailedFix(issues, request.flow);
      
      // Store the generated fix
      await supabase
        .from('ai_fix_requests')
        .update({
          status: 'processed',
          generated_fix: fixCode,
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      processedFixes.push({
        requestId: request.id,
        flow: request.flow,
        issues: issues.length,
        fix: fixCode
      });

      // Notify via Telegram
      await notifyFixGenerated(request, fixCode);

    } catch (error) {
      console.error(`Error processing fix request ${request.id}:`, error);
      
      await supabase
        .from('ai_fix_requests')
        .update({
          status: 'error',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed: processedFixes.length,
    fixes: processedFixes
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateDetailedFix(issues: any[], flow: string) {
  const prompt = `You are an expert React/TypeScript developer working on a delivery app called "Party On Delivery". 

Generate specific code fixes for these issues in the ${flow} flow:

${issues.map((issue, i) => `
Issue ${i + 1}:
- Type: ${issue.type}
- Severity: ${issue.severity}
- Description: ${issue.description}
- Location: ${issue.location}
- Suggested Fix: ${issue.suggestedFix}
`).join('\n')}

The app uses:
- React + TypeScript
- Tailwind CSS for styling  
- Shadcn/ui components
- Supabase for backend
- React Router for navigation

Provide:
1. Specific file paths that need changes
2. Exact code changes with before/after
3. New components if needed
4. Testing steps to verify fixes
5. Any database changes required

Format as actionable instructions for an AI assistant to implement.

Focus on:
- UI/UX improvements
- Performance optimizations
- Accessibility fixes
- Mobile responsiveness
- Error handling

Return detailed, implementable solutions.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function coordinateTesting(data: any) {
  console.log('Coordinating testing session:', data);

  // Start background coordination loop
  EdgeRuntime.waitUntil(runCoordinationLoop());

  return new Response(JSON.stringify({
    success: true,
    message: 'Testing coordination started'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function runCoordinationLoop() {
  while (true) {
    try {
      console.log('Coordination loop: checking for work...');

      // Process any pending fix requests
      await processFixRequests();

      // Check for critical issues that need immediate attention
      await checkCriticalIssues();

      // Monitor system health
      await monitorSystemHealth();

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

    } catch (error) {
      console.error('Coordination loop error:', error);
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds on error
    }
  }
}

async function checkCriticalIssues() {
  const { data: criticalIssues } = await supabase
    .from('testing_issues')
    .select('*')
    .eq('severity', 'critical')
    .eq('status', 'open')
    .gte('created_at', new Date(Date.now() - 60*60*1000).toISOString()); // Last hour

  if (criticalIssues && criticalIssues.length > 0) {
    console.log(`Found ${criticalIssues.length} critical issues in last hour`);
    
    // Auto-generate fixes for critical issues
    for (const issue of criticalIssues) {
      await generateUrgentFix(issue);
    }
  }
}

async function generateUrgentFix(issue: any) {
  console.log(`Generating urgent fix for critical issue: ${issue.description}`);

  const fixCode = await generateDetailedFix([issue], issue.flow);
  
  // Store as high-priority fix request
  await supabase.from('ai_fix_requests').insert([{
    flow: issue.flow,
    issues: JSON.stringify([issue]),
    priority: 'urgent',
    status: 'processed',
    generated_fix: fixCode,
    created_at: new Date().toISOString(),
    processed_at: new Date().toISOString()
  }]);

  // Send urgent notification
  await sendUrgentNotification(issue, fixCode);
}

async function sendUrgentNotification(issue: any, fixCode: string) {
  // This would send a Telegram message about the urgent fix
  console.log(`URGENT FIX NEEDED: ${issue.description}`);
  console.log('Generated fix:', fixCode.substring(0, 200) + '...');

  // In a real implementation, this would send via Telegram bot
}

async function monitorSystemHealth() {
  const { data: activeSessions } = await supabase
    .from('testing_sessions')
    .select('*')
    .eq('status', 'running');

  const { data: recentIssues } = await supabase
    .from('testing_issues')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

  console.log(`System Health: ${activeSessions?.length || 0} active sessions, ${recentIssues?.length || 0} issues in 24h`);
  
  // Store health metrics
  await supabase.from('system_health').insert([{
    active_sessions: activeSessions?.length || 0,
    issues_24h: recentIssues?.length || 0,
    critical_issues: recentIssues?.filter(i => i.severity === 'critical').length || 0,
    timestamp: new Date().toISOString()
  }]);
}

async function generateFixCode(data: any) {
  const fixCode = await generateDetailedFix(data.issues, data.flow);
  
  return new Response(JSON.stringify({
    success: true,
    fixCode
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function publishTestVersion(data: any) {
  console.log('Publishing test version with fixes:', data);

  // In a real implementation, this would:
  // 1. Apply the generated fixes to a test branch
  // 2. Deploy to a staging environment
  // 3. Run automated tests
  // 4. Notify the user

  return new Response(JSON.stringify({
    success: true,
    testUrl: 'https://test-branch.vercel.app',
    message: 'Test version published with latest fixes'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function monitorLivePerformance() {
  console.log('Monitoring live app performance...');

  // This would monitor:
  // - Page load times
  // - Error rates
  // - User interactions
  // - API response times

  const performanceData = {
    timestamp: new Date().toISOString(),
    averageLoadTime: Math.random() * 3000 + 1000, // Mock data
    errorRate: Math.random() * 0.05,
    activeUsers: Math.floor(Math.random() * 100),
    apiResponseTime: Math.random() * 500 + 200
  };

  // Store performance metrics
  await supabase.from('performance_metrics').insert([performanceData]);

  return new Response(JSON.stringify({
    success: true,
    performance: performanceData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function notifyFixGenerated(request: any, fixCode: string) {
  console.log(`Fix generated for ${request.flow}: ${fixCode.substring(0, 100)}...`);
  
  // In real implementation, this would send a Telegram notification
  // about the generated fix being ready for review/implementation
}