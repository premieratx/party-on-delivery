// Deno Deploy Edge Function: admin-cleanup
// Provides admin-only cleanup operations (clear abandoned orders, delete test data)
// Uses Supabase service role for privileged deletes, but requires authenticated admin user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  action: 'clear_abandoned' | 'delete_all_test_data';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create a Supabase client with service role and forward auth header for getUser()
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Verify authenticated user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify admin via admin_users table
    const userEmail = userData.user.email || '';
    const { data: adminRows, error: adminErr } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', userEmail)
      .limit(1);

    if (adminErr || !adminRows || adminRows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<CleanupRequest>;
    const action = body.action;

    if (action === 'clear_abandoned') {
      const { error } = await supabase.from('abandoned_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, cleared: 'abandoned_orders' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'delete_all_test_data') {
      // Safe, non-customer-critical tables to clear by default
      const tables = [
        'abandoned_orders',
        'ai_testing_issues',
        'ai_testing_sessions',
        'ai_coordinator_logs',
        'optimization_logs',
        'automation_sessions',
        'master_automation_sessions',
        'admin_notifications',
      ];

      const results: Record<string, any> = {};
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results[table] = error ? { success: false, error: error.message } : { success: true };
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
