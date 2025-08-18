import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface CacheEntry {
  key: string;
  data: any;
  expires_at: string;
}

class SafeCacheManager {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async safeUpsert(entry: CacheEntry): Promise<boolean> {
    try {
      // First try to update existing entry
      const { data: existing, error: selectError } = await this.supabase
        .from('cache')
        .select('id')
        .eq('key', entry.key)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing cache:', selectError);
        return false;
      }

      if (existing) {
        // Update existing entry
        const { error: updateError } = await this.supabase
          .from('cache')
          .update({
            data: entry.data,
            expires_at: entry.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating cache:', updateError);
          return false;
        }
      } else {
        // Insert new entry with retry logic for constraint violations
        let retries = 3;
        while (retries > 0) {
          const { error: insertError } = await this.supabase
            .from('cache')
            .insert(entry);

          if (!insertError) {
            break; // Success
          }

          if (insertError.code === '23505') { // Unique constraint violation
            console.log(`Cache key constraint violation, retrying... (${retries} left)`);
            retries--;
            
            if (retries === 0) {
              // Final attempt: try update instead
              const { error: finalUpdateError } = await this.supabase
                .from('cache')
                .update({
                  data: entry.data,
                  expires_at: entry.expires_at,
                  updated_at: new Date().toISOString()
                })
                .eq('key', entry.key);

              if (finalUpdateError) {
                console.error('Final cache update failed:', finalUpdateError);
                return false;
              }
            } else {
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            }
          } else {
            console.error('Other cache insert error:', insertError);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Cache operation failed:', error);
      return false;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('cache')
        .select('data, expires_at')
        .eq('key', key)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error getting cache:', error);
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Cache cleanup error:', error);
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const cacheManager = new SafeCacheManager(supabase);
    const { action, key, data, ttl_minutes } = await req.json();

    switch (action) {
      case 'get':
        const cached = await cacheManager.get(key);
        return new Response(
          JSON.stringify({ success: true, data: cached }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'set':
        const expiresAt = new Date(Date.now() + (ttl_minutes || 10) * 60 * 1000).toISOString();
        const success = await cacheManager.safeUpsert({
          key,
          data,
          expires_at: expiresAt
        });
        
        return new Response(
          JSON.stringify({ success }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'cleanup':
        await cacheManager.cleanup();
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Cache manager error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})