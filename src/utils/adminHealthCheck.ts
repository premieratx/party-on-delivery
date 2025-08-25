/**
 * CRITICAL: Admin Security Health Monitor
 * 
 * This system prevents the authentication bug that broke admin functionality.
 * The bug: Cached sessions skipped the verify-admin-google call, which sets
 * the admin context required for RLS policies.
 * 
 * NEVER REMOVE OR MODIFY THIS FILE WITHOUT UNDERSTANDING THE SECURITY IMPLICATIONS
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminHealthStatus {
  isHealthy: boolean;
  issues: string[];
  contextSet: boolean;
  canSaveApps: boolean;
  canUploadFiles: boolean;
  lastChecked: Date;
}

export class AdminHealthMonitor {
  private static instance: AdminHealthMonitor;
  private lastHealthCheck: AdminHealthStatus | null = null;
  
  static getInstance(): AdminHealthMonitor {
    if (!AdminHealthMonitor.instance) {
      AdminHealthMonitor.instance = new AdminHealthMonitor();
    }
    return AdminHealthMonitor.instance;
  }

  /**
   * CRITICAL: Test if admin context is properly set for RLS policies
   * This prevents the cached session bug from breaking admin functionality
   */
  async checkAdminHealth(): Promise<AdminHealthStatus> {
    console.log('🏥 SECURITY: Running admin health check...');
    
    const issues: string[] = [];
    let contextSet = false;
    let canSaveApps = false;
    let canUploadFiles = false;

    try {
      // Test 1: Check if we can query delivery_app_variations (requires admin context)
      console.log('🔍 Testing delivery app access...');
      const { data: apps, error: appsError } = await supabase
        .from('delivery_app_variations')
        .select('id')
        .limit(1);
        
      if (!appsError) {
        canSaveApps = true;
        contextSet = true;
        console.log('✅ SECURITY: Delivery app access confirmed');
      } else {
        issues.push(`Cannot access delivery apps: ${appsError.message}`);
        console.error('❌ SECURITY: Delivery app access failed:', appsError);
      }

      // Test 2: Check if we can access storage (test upload capability)
      console.log('🔍 Testing storage access...');
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (!storageError && buckets?.some(b => b.name === 'app-assets')) {
        canUploadFiles = true;
        console.log('✅ SECURITY: Storage access confirmed');
      } else {
        issues.push(`Storage access failed: ${storageError?.message || 'Unknown error'}`);
        console.error('❌ SECURITY: Storage access failed:', storageError);
      }

    } catch (error: any) {
      const errorMsg = `Health check failed: ${error.message}`;
      issues.push(errorMsg);
      console.error('🚨 SECURITY: Admin health check failed:', error);
    }

    const healthStatus: AdminHealthStatus = {
      isHealthy: issues.length === 0,
      issues,
      contextSet,
      canSaveApps,
      canUploadFiles,
      lastChecked: new Date()
    };

    this.lastHealthCheck = healthStatus;
    
    if (!healthStatus.isHealthy) {
      console.error('🚨 SECURITY ALERT: Admin health check failed!', healthStatus);
      this.alertAdminHealthFailure(healthStatus);
    } else {
      console.log('✅ SECURITY: Admin health check passed');
    }

    return healthStatus;
  }

  /**
   * CRITICAL: Force re-establishment of admin context
   * Use this if health check fails to fix the cached session bug
   */
  async forceAdminContextRefresh(adminEmail: string): Promise<boolean> {
    console.log('🔧 SECURITY: Force refreshing admin context for:', adminEmail);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-google', {
        body: { email: adminEmail }
      });
      
      if (error || !data?.isAdmin) {
        console.error('❌ SECURITY: Failed to refresh admin context:', error);
        return false;
      }
      
      console.log('✅ SECURITY: Admin context forcefully refreshed');
      return true;
    } catch (error) {
      console.error('🚨 SECURITY: Exception during context refresh:', error);
      return false;
    }
  }

  /**
   * Get the last health check result without running a new check
   */
  getLastHealthCheck(): AdminHealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Alert system for admin health failures
   */
  private alertAdminHealthFailure(status: AdminHealthStatus) {
    // Log to console with high visibility
    console.error('🚨🚨🚨 ADMIN SECURITY ALERT 🚨🚨🚨');
    console.error('Admin functionality is broken!');
    console.error('Issues:', status.issues);
    console.error('This is likely due to missing admin context for RLS policies');
    console.error('Run forceAdminContextRefresh() to fix');
    
    // In production, this would send alerts to monitoring systems
    // For now, we'll use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Admin Security Alert', {
        body: 'Admin functionality is broken. Check console for details.',
        icon: '/favicon.ico'
      });
    }
  }
}

// Convenience exports
export const adminHealthMonitor = AdminHealthMonitor.getInstance();

/**
 * CRITICAL: Auto-monitor admin health every 5 minutes
 * This helps catch the cached session bug early
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

export const startAdminHealthMonitoring = () => {
  if (healthCheckInterval) return; // Already running
  
  console.log('🏥 SECURITY: Starting admin health monitoring...');
  
  healthCheckInterval = setInterval(async () => {
    const status = await adminHealthMonitor.checkAdminHealth();
    if (!status.isHealthy) {
      console.warn('🚨 SECURITY: Admin health check failed during monitoring');
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

export const stopAdminHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🏥 SECURITY: Stopped admin health monitoring');
  }
};