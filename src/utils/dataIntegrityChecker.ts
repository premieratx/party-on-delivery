/**
 * Data Integrity Checker - Ensures data consistency across systems
 */

import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from './systemLogger';

export class DataIntegrityChecker {
  /**
   * Verify Stripe to Shopify order amount consistency
   */
  public static async verifyOrderAmounts(stripeAmount: number, shopifyTotal: number, orderId: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const tolerance = 0.02; // 2 cent tolerance
      const difference = Math.abs(stripeAmount - shopifyTotal);
      const isValid = difference <= tolerance;

      const checkResult = {
        check_name: 'stripe_shopify_amount_verification',
        check_type: 'amount_consistency',
        table_name: 'customer_orders',
        status: isValid ? 'passed' : 'failed',
        expected_result: { stripe_amount: stripeAmount },
        actual_result: { shopify_total: shopifyTotal },
        discrepancy_details: {
          order_id: orderId,
          difference: difference,
          tolerance: tolerance
        },
        severity: isValid ? 'low' : 'high'
      };

      // Log to integrity table
      await supabase.from('data_integrity_checks').insert(checkResult);

      // Log to system logger
      await systemLogger.log({
        eventType: 'data_integrity_check',
        serviceName: 'integrity_checker',
        operation: 'verify_order_amounts',
        requestData: { stripe_amount: stripeAmount, shopify_total: shopifyTotal, order_id: orderId },
        responseData: { is_valid: isValid, difference },
        severity: isValid ? 'info' : 'error',
        executionTimeMs: Date.now() - startTime
      });

      return isValid;
    } catch (error) {
      await systemLogger.log({
        eventType: 'data_integrity_error',
        serviceName: 'integrity_checker',
        operation: 'verify_order_amounts',
        errorDetails: error,
        severity: 'critical',
        executionTimeMs: Date.now() - startTime
      });
      
      return false;
    }
  }

  /**
   * Verify order data completeness
   */
  public static async verifyOrderCompleteness(orderData: any): Promise<boolean> {
    const requiredFields = ['order_number', 'total_amount', 'line_items', 'delivery_address'];
    const missingFields = requiredFields.filter(field => !orderData[field]);

    const isComplete = missingFields.length === 0;

    const checkResult = {
      check_name: 'order_data_completeness',
      check_type: 'data_completeness',
      table_name: 'customer_orders',
      status: isComplete ? 'passed' : 'failed',
      expected_result: { required_fields: requiredFields },
      actual_result: { present_fields: Object.keys(orderData) },
      discrepancy_details: {
        missing_fields: missingFields,
        order_id: orderData.id
      },
      severity: isComplete ? 'low' : 'medium'
    };

    await supabase.from('data_integrity_checks').insert(checkResult);

    return isComplete;
  }

  /**
   * Run comprehensive system health check
   */
  public static async runSystemHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check recent order consistency
      const { data: recentOrders } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentOrders) {
        for (const order of recentOrders) {
          await this.verifyOrderCompleteness(order);
        }
      }

      // Check for orphaned data
      const { data: orphanedSessions } = await supabase
        .from('cart_sessions')
        .select('*')
        .is('customer_email', null)
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (orphanedSessions && orphanedSessions.length > 0) {
        await supabase.from('data_integrity_checks').insert({
          check_name: 'orphaned_cart_sessions',
          check_type: 'data_cleanup',
          table_name: 'cart_sessions',
          status: 'failed',
          actual_result: { orphaned_count: orphanedSessions.length },
          severity: 'medium'
        });
      }

      await systemLogger.log({
        eventType: 'system_health_check',
        serviceName: 'integrity_checker',
        operation: 'run_system_health_check',
        responseData: { orders_checked: recentOrders?.length || 0, orphaned_sessions: orphanedSessions?.length || 0 },
        severity: 'info',
        executionTimeMs: Date.now() - startTime
      });

    } catch (error) {
      await systemLogger.log({
        eventType: 'system_health_check_error',
        serviceName: 'integrity_checker',
        operation: 'run_system_health_check',
        errorDetails: error,
        severity: 'critical',
        executionTimeMs: Date.now() - startTime
      });
    }
  }
}