import { supabase } from '@/integrations/supabase/client';

/**
 * Secure storage utility that moves sensitive data from localStorage to Supabase
 * Only stores non-sensitive data locally for performance
 */
export class SecureStorage {
  private static SAFE_LOCAL_KEYS = [
    'partyondelivery_theme_preference',
    'partyondelivery_last_category',
    'partyondelivery_ui_preferences'
  ];

  /**
   * Store data securely - sensitive data goes to Supabase, non-sensitive stays local
   */
  static async setItem(key: string, value: any, options: { sensitive?: boolean; sessionId?: string } = {}) {
    const { sensitive = false, sessionId } = options;

    if (sensitive) {
      // Store sensitive data in Supabase
      return this.storeInSupabase(key, value, sessionId);
    } else if (this.SAFE_LOCAL_KEYS.includes(key)) {
      // Store safe data locally
      return this.storeLocally(key, value);
    } else {
      // Default to Supabase for safety
      return this.storeInSupabase(key, value, sessionId);
    }
  }

  /**
   * Retrieve data from appropriate storage
   */
  static async getItem(key: string, sessionId?: string): Promise<any> {
    if (this.SAFE_LOCAL_KEYS.includes(key)) {
      return this.getFromLocal(key);
    } else {
      return this.getFromSupabase(key, sessionId);
    }
  }

  /**
   * Remove data from appropriate storage
   */
  static async removeItem(key: string, sessionId?: string) {
    if (this.SAFE_LOCAL_KEYS.includes(key)) {
      localStorage.removeItem(key);
    } else {
      return this.removeFromSupabase(key, sessionId);
    }
  }

  /**
   * Store non-sensitive data locally with compression
   */
  private static storeLocally(key: string, value: any) {
    try {
      const compressed = JSON.stringify(value);
      localStorage.setItem(key, compressed);
      return Promise.resolve();
    } catch (error) {
      console.warn(`Failed to store ${key} locally:`, error);
      return Promise.reject(error);
    }
  }

  /**
   * Store sensitive data in Supabase app_state_snapshots
   */
  private static async storeInSupabase(key: string, value: any, sessionId?: string) {
    try {
      const { error } = await supabase
        .from('app_state_snapshots')
        .upsert({
          snapshot_name: key,
          session_id: sessionId || 'global',
          app_state: { [key]: value },
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        });

      if (error) throw error;
    } catch (error) {
      console.warn(`Failed to store ${key} in Supabase:`, error);
      throw error;
    }
  }

  /**
   * Get data from localStorage
   */
  private static getFromLocal(key: string): any {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Get data from Supabase
   */
  private static async getFromSupabase(key: string, sessionId?: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('app_state_snapshots')
        .select('app_state')
        .eq('snapshot_name', key)
        .eq('session_id', sessionId || 'global')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.app_state?.[key] || null;
    } catch (error) {
      console.warn(`Failed to get ${key} from Supabase:`, error);
      return null;
    }
  }

  /**
   * Remove data from Supabase
   */
  private static async removeFromSupabase(key: string, sessionId?: string) {
    try {
      const { error } = await supabase
        .from('app_state_snapshots')
        .delete()
        .eq('snapshot_name', key)
        .eq('session_id', sessionId || 'global');

      if (error) throw error;
    } catch (error) {
      console.warn(`Failed to remove ${key} from Supabase:`, error);
      throw error;
    }
  }

  /**
   * Clear all storage (for logout/cleanup)
   */
  static async clearAll(sessionId?: string) {
    // Clear local storage
    this.SAFE_LOCAL_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear Supabase storage
    try {
      const { error } = await supabase
        .from('app_state_snapshots')
        .delete()
        .eq('session_id', sessionId || 'global');

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to clear Supabase storage:', error);
    }
  }
}