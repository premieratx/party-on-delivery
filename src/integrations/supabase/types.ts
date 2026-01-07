export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      abandoned_orders: {
        Row: {
          abandoned_at: string
          affiliate_code: string | null
          affiliate_id: string | null
          cart_items: Json
          checkout_url: string | null
          contains_payment_info: boolean | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          id: string
          last_activity_at: string
          session_id: string
          session_token: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          abandoned_at?: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          cart_items?: Json
          checkout_url?: string | null
          contains_payment_info?: boolean | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          last_activity_at?: string
          session_id: string
          session_token?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          abandoned_at?: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          cart_items?: Json
          checkout_url?: string | null
          contains_payment_info?: boolean | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          last_activity_at?: string
          session_id?: string
          session_token?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_abandoned_orders_affiliate_id"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          affiliate_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password_hash: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string | null
        }
        Relationships: []
      }
      affiliate_flows: {
        Row: {
          affiliate_id: string
          cover_page_id: string | null
          created_at: string | null
          delivery_app_configs: Json | null
          flow_description: string | null
          flow_name: string
          flow_slug: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          post_checkout_screen_id: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          cover_page_id?: string | null
          created_at?: string | null
          delivery_app_configs?: Json | null
          flow_description?: string | null
          flow_name: string
          flow_slug: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          post_checkout_screen_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          cover_page_id?: string | null
          created_at?: string | null
          delivery_app_configs?: Json | null
          flow_description?: string | null
          flow_name?: string
          flow_slug?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          post_checkout_screen_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_order_tracking: {
        Row: {
          affiliate_id: string
          affiliate_slug: string
          commission_amount: number | null
          commission_rate: number | null
          cover_page_id: string | null
          created_at: string | null
          customer_email: string | null
          delivery_app_slug: string | null
          flow_path: string | null
          id: string
          order_completed_at: string | null
          order_id: string | null
          session_id: string | null
          subtotal: number | null
          tracking_url_params: Json | null
          updated_at: string | null
          used_default_flow: boolean | null
        }
        Insert: {
          affiliate_id: string
          affiliate_slug: string
          commission_amount?: number | null
          commission_rate?: number | null
          cover_page_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          delivery_app_slug?: string | null
          flow_path?: string | null
          id?: string
          order_completed_at?: string | null
          order_id?: string | null
          session_id?: string | null
          subtotal?: number | null
          tracking_url_params?: Json | null
          updated_at?: string | null
          used_default_flow?: boolean | null
        }
        Update: {
          affiliate_id?: string
          affiliate_slug?: string
          commission_amount?: number | null
          commission_rate?: number | null
          cover_page_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          delivery_app_slug?: string | null
          flow_path?: string | null
          id?: string
          order_completed_at?: string | null
          order_id?: string | null
          session_id?: string | null
          subtotal?: number | null
          tracking_url_params?: Json | null
          updated_at?: string | null
          used_default_flow?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_order_tracking_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_order_tracking_cover_page_id_fkey"
            columns: ["cover_page_id"]
            isOneToOne: false
            referencedRelation: "cover_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          customer_email: string | null
          id: string
          order_date: string | null
          order_id: string | null
          paid_out: boolean | null
          subtotal: number
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          customer_email?: string | null
          id?: string
          order_date?: string | null
          order_id?: string | null
          paid_out?: boolean | null
          subtotal: number
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          customer_email?: string | null
          id?: string
          order_date?: string | null
          order_id?: string | null
          paid_out?: boolean | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          commission_type: string
          commission_unpaid: number | null
          commission_value: number | null
          company_name: string
          created_at: string | null
          custom_handle: string | null
          default_flow_id: string | null
          discount_type: string | null
          discount_value: number | null
          email: string
          google_id: string | null
          id: string
          largest_order: number | null
          name: string
          orders_count: number | null
          phone: string | null
          status: string | null
          total_commission: number | null
          total_sales: number | null
          updated_at: string | null
          venmo_handle: string | null
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          commission_type?: string
          commission_unpaid?: number | null
          commission_value?: number | null
          company_name: string
          created_at?: string | null
          custom_handle?: string | null
          default_flow_id?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email: string
          google_id?: string | null
          id?: string
          largest_order?: number | null
          name: string
          orders_count?: number | null
          phone?: string | null
          status?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          venmo_handle?: string | null
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          commission_type?: string
          commission_unpaid?: number | null
          commission_value?: number | null
          company_name?: string
          created_at?: string | null
          custom_handle?: string | null
          default_flow_id?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email?: string
          google_id?: string | null
          id?: string
          largest_order?: number | null
          name?: string
          orders_count?: number | null
          phone?: string | null
          status?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          venmo_handle?: string | null
        }
        Relationships: []
      }
      ai_coordinator_logs: {
        Row: {
          ai_response: string
          chat_id: number
          confidence_score: number | null
          created_at: string | null
          id: string
          intent_detected: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          chat_id: number
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          chat_id?: number
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          user_message?: string
        }
        Relationships: []
      }
      ai_fix_requests: {
        Row: {
          created_at: string
          error_message: string | null
          flow: string
          generated_fix: string | null
          id: string
          issues: string
          priority: string
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          flow: string
          generated_fix?: string | null
          id?: string
          issues: string
          priority?: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          flow?: string
          generated_fix?: string | null
          id?: string
          issues?: string
          priority?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      ai_testing_issues: {
        Row: {
          created_at: string | null
          description: string
          fix_applied: boolean | null
          fix_suggested: string | null
          flow: string
          id: string
          resolved: boolean | null
          screenshot_url: string | null
          session_id: string | null
          severity: string | null
          test_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          fix_applied?: boolean | null
          fix_suggested?: string | null
          flow: string
          id?: string
          resolved?: boolean | null
          screenshot_url?: string | null
          session_id?: string | null
          severity?: string | null
          test_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          fix_applied?: boolean | null
          fix_suggested?: string | null
          flow?: string
          id?: string
          resolved?: boolean | null
          screenshot_url?: string | null
          session_id?: string | null
          severity?: string | null
          test_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_testing_issues_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_testing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_testing_sessions: {
        Row: {
          app_url: string | null
          chat_id: number | null
          created_at: string | null
          current_flow: string | null
          flows_tested: Json | null
          id: string
          session_id: string
          status: string | null
          test_type: string
          tests_failed: number | null
          tests_passed: number | null
          updated_at: string | null
        }
        Insert: {
          app_url?: string | null
          chat_id?: number | null
          created_at?: string | null
          current_flow?: string | null
          flows_tested?: Json | null
          id?: string
          session_id: string
          status?: string | null
          test_type: string
          tests_failed?: number | null
          tests_passed?: number | null
          updated_at?: string | null
        }
        Update: {
          app_url?: string | null
          chat_id?: number | null
          created_at?: string | null
          current_flow?: string | null
          flows_tested?: Json | null
          id?: string
          session_id?: string
          status?: string | null
          test_type?: string
          tests_failed?: number | null
          tests_passed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_work_logs: {
        Row: {
          action_type: string
          after_state: Json | null
          before_state: Json | null
          component_name: string | null
          created_at: string
          description: string
          error_details: Json | null
          file_path: string | null
          id: string
          session_id: string
          success: boolean | null
          timestamp: string
          user_feedback: string | null
        }
        Insert: {
          action_type: string
          after_state?: Json | null
          before_state?: Json | null
          component_name?: string | null
          created_at?: string
          description: string
          error_details?: Json | null
          file_path?: string | null
          id?: string
          session_id: string
          success?: boolean | null
          timestamp?: string
          user_feedback?: string | null
        }
        Update: {
          action_type?: string
          after_state?: Json | null
          before_state?: Json | null
          component_name?: string | null
          created_at?: string
          description?: string
          error_details?: Json | null
          file_path?: string | null
          id?: string
          session_id?: string
          success?: boolean | null
          timestamp?: string
          user_feedback?: string | null
        }
        Relationships: []
      }
      app_state_snapshots: {
        Row: {
          app_state: Json
          created_at: string
          id: string
          session_id: string | null
          snapshot_name: string | null
          user_id: string | null
        }
        Insert: {
          app_state?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          snapshot_name?: string | null
          user_id?: string | null
        }
        Update: {
          app_state?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          snapshot_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_type: string
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          email_error: string | null
          email_sent: boolean
          id: string
          order_id: string
          sms_error: string | null
          sms_sent: boolean
          updated_at: string
        }
        Insert: {
          automation_type?: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          email_error?: string | null
          email_sent?: boolean
          id?: string
          order_id: string
          sms_error?: string | null
          sms_sent?: boolean
          updated_at?: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          email_error?: string | null
          email_sent?: boolean
          id?: string
          order_id?: string
          sms_error?: string | null
          sms_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      automation_sessions: {
        Row: {
          completed_at: string | null
          completed_tasks: number
          created_at: string
          failed_tasks: number
          id: string
          next_task_id: string | null
          session_name: string
          started_at: string
          status: string
          total_tasks: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_tasks?: number
          created_at?: string
          failed_tasks?: number
          id?: string
          next_task_id?: string | null
          session_name: string
          started_at?: string
          status?: string
          total_tasks?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_tasks?: number
          created_at?: string
          failed_tasks?: number
          id?: string
          next_task_id?: string | null
          session_name?: string
          started_at?: string
          status?: string
          total_tasks?: number
          updated_at?: string
        }
        Relationships: []
      }
      automation_templates: {
        Row: {
          automation_config: Json
          created_at: string
          created_by: string | null
          description: string | null
          execution_settings: Json
          id: string
          is_active: boolean
          tasks_config: Json
          template_name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          automation_config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_settings?: Json
          id?: string
          is_active?: boolean
          tasks_config?: Json
          template_name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          automation_config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_settings?: Json
          id?: string
          is_active?: boolean
          tasks_config?: Json
          template_name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      autonomous_execution_logs: {
        Row: {
          action: string
          chat_id: number
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          phase: string
          retry_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action: string
          chat_id: number
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          phase: string
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          chat_id?: number
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          phase?: string
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cache: {
        Row: {
          created_at: string
          data: Json
          expires_at: number
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          expires_at: number
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: number
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_sessions: {
        Row: {
          affiliate_tracking: Json | null
          cart_data: Json | null
          created_at: string | null
          customer_email: string | null
          expires_at: string | null
          id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          affiliate_tracking?: Json | null
          cart_data?: Json | null
          created_at?: string | null
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          affiliate_tracking?: Json | null
          cart_data?: Json | null
          created_at?: string | null
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      category_mappings_simple: {
        Row: {
          app_category: string
          collection_handle: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          app_category: string
          collection_handle?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          app_category?: string
          collection_handle?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      checkout_flow_backups: {
        Row: {
          backup_name: string
          component_config: Json
          created_at: string
          created_by: string | null
          id: string
          is_current: boolean | null
          notes: string | null
        }
        Insert: {
          backup_name: string
          component_config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
        }
        Update: {
          backup_name?: string
          component_config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
        }
        Relationships: []
      }
      checkout_flow_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string
          id: string
          is_default: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      checkout_flow_documentation: {
        Row: {
          component_name: string
          component_type: string
          created_at: string | null
          dependencies: Json | null
          file_path: string
          functionality: string
          id: string
          is_critical: boolean | null
          last_verified: string | null
          notes: string | null
          stripe_related: boolean | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          component_type: string
          created_at?: string | null
          dependencies?: Json | null
          file_path: string
          functionality: string
          id?: string
          is_critical?: boolean | null
          last_verified?: string | null
          notes?: string | null
          stripe_related?: boolean | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          component_type?: string
          created_at?: string | null
          dependencies?: Json | null
          file_path?: string
          functionality?: string
          id?: string
          is_critical?: boolean | null
          last_verified?: string | null
          notes?: string | null
          stripe_related?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checkout_flow_monitoring: {
        Row: {
          completed_at: string | null
          completion_status: string
          created_at: string
          device_info: Json | null
          entry_point: string | null
          error_details: Json | null
          id: string
          session_id: string | null
          step_reached: string
          user_email: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          device_info?: Json | null
          entry_point?: string | null
          error_details?: Json | null
          id?: string
          session_id?: string | null
          step_reached: string
          user_email?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          device_info?: Json | null
          entry_point?: string | null
          error_details?: Json | null
          id?: string
          session_id?: string | null
          step_reached?: string
          user_email?: string | null
        }
        Relationships: []
      }
      collection_drafts: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          description: string | null
          handle: string
          id: string
          selected_product_ids: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          handle: string
          id?: string
          selected_product_ids?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          handle?: string
          id?: string
          selected_product_ids?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_payouts: {
        Row: {
          affiliate_id: string | null
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          referral_ids: string[]
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referral_ids: string[]
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referral_ids?: string[]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      component_health_checks: {
        Row: {
          component_name: string
          created_at: string
          dependencies: Json | null
          file_path: string
          id: string
          is_legacy: boolean | null
          issues: Json | null
          last_checked: string
          status: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          component_name: string
          created_at?: string
          dependencies?: Json | null
          file_path: string
          id?: string
          is_legacy?: boolean | null
          issues?: Json | null
          last_checked?: string
          status?: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          component_name?: string
          created_at?: string
          dependencies?: Json | null
          file_path?: string
          id?: string
          is_legacy?: boolean | null
          issues?: Json | null
          last_checked?: string
          status?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      configuration_templates: {
        Row: {
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          template_name: string
          template_type: string
          updated_at: string
          version: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name: string
          template_type: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name?: string
          template_type?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      cover_page_affiliate_assignments: {
        Row: {
          affiliate_id: string
          cover_page_id: string
          created_at: string
          id: string
          share_slug: string
        }
        Insert: {
          affiliate_id: string
          cover_page_id: string
          created_at?: string
          id?: string
          share_slug: string
        }
        Update: {
          affiliate_id?: string
          cover_page_id?: string
          created_at?: string
          id?: string
          share_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cpaa_affiliate"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cpaa_cover_page"
            columns: ["cover_page_id"]
            isOneToOne: false
            referencedRelation: "cover_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_page_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          preview_url: string | null
          template_config: Json
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          preview_url?: string | null
          template_config?: Json
          template_name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          preview_url?: string | null
          template_config?: Json
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cover_pages: {
        Row: {
          affiliate_assigned_slug: string | null
          affiliate_id: string | null
          affiliate_slug: string | null
          bg_image_url: string | null
          bg_video_url: string | null
          buttons: Json
          checklist: Json
          created_at: string
          created_by: string | null
          flow_description: string | null
          flow_name: string | null
          free_shipping_enabled: boolean | null
          id: string
          is_active: boolean
          is_default_homepage: boolean | null
          is_multi_flow: boolean | null
          logo_height: number | null
          logo_height_override: number | null
          logo_url: string | null
          logo_width: number | null
          slug: string
          styles: Json
          subtitle: string | null
          theme: string | null
          title: string
          unified_theme: string | null
          updated_at: string
        }
        Insert: {
          affiliate_assigned_slug?: string | null
          affiliate_id?: string | null
          affiliate_slug?: string | null
          bg_image_url?: string | null
          bg_video_url?: string | null
          buttons?: Json
          checklist?: Json
          created_at?: string
          created_by?: string | null
          flow_description?: string | null
          flow_name?: string | null
          free_shipping_enabled?: boolean | null
          id?: string
          is_active?: boolean
          is_default_homepage?: boolean | null
          is_multi_flow?: boolean | null
          logo_height?: number | null
          logo_height_override?: number | null
          logo_url?: string | null
          logo_width?: number | null
          slug: string
          styles?: Json
          subtitle?: string | null
          theme?: string | null
          title: string
          unified_theme?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_assigned_slug?: string | null
          affiliate_id?: string | null
          affiliate_slug?: string | null
          bg_image_url?: string | null
          bg_video_url?: string | null
          buttons?: Json
          checklist?: Json
          created_at?: string
          created_by?: string | null
          flow_description?: string | null
          flow_name?: string | null
          free_shipping_enabled?: boolean | null
          id?: string
          is_active?: boolean
          is_default_homepage?: boolean | null
          is_multi_flow?: boolean | null
          logo_height?: number | null
          logo_height_override?: number | null
          logo_url?: string | null
          logo_width?: number | null
          slug?: string
          styles?: Json
          subtitle?: string | null
          theme?: string | null
          title?: string
          unified_theme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_pages_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_affiliate_sites: {
        Row: {
          affiliate_id: string | null
          business_address: Json | null
          business_name: string
          created_at: string
          custom_promo_code: string | null
          delivery_address: Json | null
          delivery_app_id: string | null
          id: string
          is_active: boolean | null
          is_delivery_app: boolean | null
          site_name: string
          site_slug: string
          site_type: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          business_address?: Json | null
          business_name: string
          created_at?: string
          custom_promo_code?: string | null
          delivery_address?: Json | null
          delivery_app_id?: string | null
          id?: string
          is_active?: boolean | null
          is_delivery_app?: boolean | null
          site_name: string
          site_slug: string
          site_type?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          business_address?: Json | null
          business_name?: string
          created_at?: string
          custom_promo_code?: string | null
          delivery_address?: Json | null
          delivery_app_id?: string | null
          id?: string
          is_active?: boolean | null
          is_delivery_app?: boolean | null
          site_name?: string
          site_slug?: string
          site_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_affiliate_sites_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_affiliate_sites_delivery_app_id_fkey"
            columns: ["delivery_app_id"]
            isOneToOne: false
            referencedRelation: "delivery_app_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_collections: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          description: string | null
          handle: string
          id: string
          is_published: boolean
          product_ids: string[]
          shopify_collection_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          handle: string
          id?: string
          is_published?: boolean
          product_ids?: string[]
          shopify_collection_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          handle?: string
          id?: string
          is_published?: boolean
          product_ids?: string[]
          shopify_collection_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_product_categories: {
        Row: {
          created_at: string
          handle: string
          id: string
          name: string
          products: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          name: string
          products?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          name?: string
          products?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          affiliate_code: string | null
          affiliate_id: string | null
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          delivery_address: Json
          delivery_date: string | null
          delivery_fee: number | null
          delivery_time: string | null
          group_order_id: string | null
          group_order_name: string | null
          group_participants: Json | null
          id: string
          is_group_order: boolean | null
          is_shareable: boolean | null
          line_items: Json
          order_number: string
          payment_intent_id: string | null
          session_id: string | null
          share_token: string | null
          shared_at: string | null
          shopify_order_id: string | null
          special_instructions: string | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address: Json
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          group_order_id?: string | null
          group_order_name?: string | null
          group_participants?: Json | null
          id?: string
          is_group_order?: boolean | null
          is_shareable?: boolean | null
          line_items?: Json
          order_number: string
          payment_intent_id?: string | null
          session_id?: string | null
          share_token?: string | null
          shared_at?: string | null
          shopify_order_id?: string | null
          special_instructions?: string | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          group_order_id?: string | null
          group_order_name?: string | null
          group_participants?: Json | null
          id?: string
          is_group_order?: boolean | null
          is_shareable?: boolean | null
          line_items?: Json
          order_number?: string
          payment_intent_id?: string | null
          session_id?: string | null
          share_token?: string | null
          shared_at?: string | null
          shopify_order_id?: string | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          default_address: Json | null
          email: string
          google_id: string | null
          id: number
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_address?: Json | null
          email: string
          google_id?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_address?: Json | null
          email?: string
          google_id?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_integrity_checks: {
        Row: {
          actual_result: Json | null
          check_name: string
          check_type: string
          completed_at: string | null
          created_at: string
          discrepancy_details: Json | null
          expected_result: Json | null
          id: string
          severity: string | null
          status: string
          table_name: string | null
        }
        Insert: {
          actual_result?: Json | null
          check_name: string
          check_type: string
          completed_at?: string | null
          created_at?: string
          discrepancy_details?: Json | null
          expected_result?: Json | null
          id?: string
          severity?: string | null
          status?: string
          table_name?: string | null
        }
        Update: {
          actual_result?: Json | null
          check_name?: string
          check_type?: string
          completed_at?: string | null
          created_at?: string
          discrepancy_details?: Json | null
          expected_result?: Json | null
          id?: string
          severity?: string | null
          status?: string
          table_name?: string | null
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          city: string
          created_at: string
          customer_email: string
          id: string
          instructions: string | null
          is_primary: boolean | null
          last_used_at: string
          state: string
          street: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          customer_email: string
          id?: string
          instructions?: string | null
          is_primary?: boolean | null
          last_used_at?: string
          state: string
          street: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          customer_email?: string
          id?: string
          instructions?: string | null
          is_primary?: boolean | null
          last_used_at?: string
          state?: string
          street?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_customer_email_fkey"
            columns: ["customer_email"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["email"]
          },
        ]
      }
      delivery_app_collection_mappings: {
        Row: {
          created_at: string | null
          delivery_app_id: string | null
          id: string
          shopify_collection_handle: string
          tab_index: number
          tab_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_app_id?: string | null
          id?: string
          shopify_collection_handle: string
          tab_index: number
          tab_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_app_id?: string | null
          id?: string
          shopify_collection_handle?: string
          tab_index?: number
          tab_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_app_collection_mappings_delivery_app_id_fkey"
            columns: ["delivery_app_id"]
            isOneToOne: false
            referencedRelation: "delivery_app_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_app_variations: {
        Row: {
          app_name: string
          app_slug: string
          bg_image_url: string | null
          bg_video_url: string | null
          collections_config: Json
          created_at: string
          custom_post_checkout_config: Json | null
          free_delivery_enabled: boolean | null
          hero_config: Json | null
          id: string
          is_active: boolean
          is_homepage: boolean | null
          logo_url: string | null
          logo_width: number | null
          main_app_config: Json | null
          post_checkout_config: Json | null
          prefill_address_enabled: boolean | null
          prefill_delivery_address: Json | null
          short_path: string | null
          sort_order: number | null
          start_screen_config: Json | null
          styles: Json | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          app_name: string
          app_slug: string
          bg_image_url?: string | null
          bg_video_url?: string | null
          collections_config?: Json
          created_at?: string
          custom_post_checkout_config?: Json | null
          free_delivery_enabled?: boolean | null
          hero_config?: Json | null
          id?: string
          is_active?: boolean
          is_homepage?: boolean | null
          logo_url?: string | null
          logo_width?: number | null
          main_app_config?: Json | null
          post_checkout_config?: Json | null
          prefill_address_enabled?: boolean | null
          prefill_delivery_address?: Json | null
          short_path?: string | null
          sort_order?: number | null
          start_screen_config?: Json | null
          styles?: Json | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          app_name?: string
          app_slug?: string
          bg_image_url?: string | null
          bg_video_url?: string | null
          collections_config?: Json
          created_at?: string
          custom_post_checkout_config?: Json | null
          free_delivery_enabled?: boolean | null
          hero_config?: Json | null
          id?: string
          is_active?: boolean
          is_homepage?: boolean | null
          logo_url?: string | null
          logo_width?: number | null
          main_app_config?: Json | null
          post_checkout_config?: Json | null
          prefill_address_enabled?: boolean | null
          prefill_delivery_address?: Json | null
          short_path?: string | null
          sort_order?: number | null
          start_screen_config?: Json | null
          styles?: Json | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_apps: {
        Row: {
          active: boolean | null
          collections: Json | null
          created_at: string | null
          custom_branding: Json | null
          description: string | null
          id: number
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          collections?: Json | null
          created_at?: string | null
          custom_branding?: Json | null
          description?: string | null
          id?: number
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          collections?: Json | null
          created_at?: string | null
          custom_branding?: Json | null
          description?: string | null
          id?: number
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      development_security_checklist: {
        Row: {
          category: string
          checklist_item: string
          created_at: string | null
          id: string
          is_automated: boolean | null
          validation_query: string | null
        }
        Insert: {
          category: string
          checklist_item: string
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          validation_query?: string | null
        }
        Update: {
          category?: string
          checklist_item?: string
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          validation_query?: string | null
        }
        Relationships: []
      }
      discount_code_usage: {
        Row: {
          applied_at: string | null
          created_at: string | null
          customer_email: string | null
          discount_amount: number
          discount_code: string
          id: string
          order_id: string | null
          order_subtotal: number
          session_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          discount_amount?: number
          discount_code: string
          id?: string
          order_id?: string | null
          order_subtotal?: number
          session_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          discount_amount?: number
          discount_code?: string
          id?: string
          order_id?: string | null
          order_subtotal?: number
          session_id?: string | null
        }
        Relationships: []
      }
      failed_order_processing: {
        Row: {
          created_at: string
          customer_email: string | null
          error_message: string
          id: string
          payment_amount: number
          payment_intent_id: string
          requires_manual_review: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          error_message: string
          id?: string
          payment_amount: number
          payment_intent_id: string
          requires_manual_review?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          error_message?: string
          id?: string
          payment_amount?: number
          payment_intent_id?: string
          requires_manual_review?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      figma_design_templates: {
        Row: {
          created_at: string
          design_data: Json
          figma_file_id: string | null
          figma_node_id: string | null
          id: string
          is_active: boolean
          preview_image_url: string | null
          template_category: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          design_data?: Json
          figma_file_id?: string | null
          figma_node_id?: string | null
          id?: string
          is_active?: boolean
          preview_image_url?: string | null
          template_category?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          design_data?: Json
          figma_file_id?: string | null
          figma_node_id?: string | null
          id?: string
          is_active?: boolean
          preview_image_url?: string | null
          template_category?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flow_themes: {
        Row: {
          cover_page_id: string | null
          created_at: string | null
          delivery_app_id: string | null
          flow_name: string
          id: string
          post_checkout_page_id: string | null
          theme: string
          updated_at: string | null
        }
        Insert: {
          cover_page_id?: string | null
          created_at?: string | null
          delivery_app_id?: string | null
          flow_name: string
          id?: string
          post_checkout_page_id?: string | null
          theme?: string
          updated_at?: string | null
        }
        Update: {
          cover_page_id?: string | null
          created_at?: string | null
          delivery_app_id?: string | null
          flow_name?: string
          id?: string
          post_checkout_page_id?: string | null
          theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_themes_cover_page_id_fkey"
            columns: ["cover_page_id"]
            isOneToOne: false
            referencedRelation: "cover_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_themes_delivery_app_id_fkey"
            columns: ["delivery_app_id"]
            isOneToOne: false
            referencedRelation: "delivery_app_variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_themes_post_checkout_page_id_fkey"
            columns: ["post_checkout_page_id"]
            isOneToOne: false
            referencedRelation: "post_checkout_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_cover_config: {
        Row: {
          cover_page_id: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          cover_page_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          cover_page_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_cover_config_cover_page_id_fkey"
            columns: ["cover_page_id"]
            isOneToOne: false
            referencedRelation: "cover_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health_logs: {
        Row: {
          checked_at: string
          checks: Json
          created_at: string
          id: string
          overall_status: string
          recommendations: Json | null
        }
        Insert: {
          checked_at?: string
          checks?: Json
          created_at?: string
          id?: string
          overall_status: string
          recommendations?: Json | null
        }
        Update: {
          checked_at?: string
          checks?: Json
          created_at?: string
          id?: string
          overall_status?: string
          recommendations?: Json | null
        }
        Relationships: []
      }
      launch_phases: {
        Row: {
          actual_completion: string | null
          chat_id: number | null
          created_at: string | null
          description: string | null
          estimated_completion: string | null
          id: string
          phase_name: string
          progress_percentage: number | null
          status: string | null
          tasks: Json | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          chat_id?: number | null
          created_at?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          phase_name: string
          progress_percentage?: number | null
          status?: string | null
          tasks?: Json | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          chat_id?: number | null
          created_at?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          phase_name?: string
          progress_percentage?: number | null
          status?: string | null
          tasks?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_automation_sessions: {
        Row: {
          autonomous_mode: boolean
          completed_at: string | null
          completed_phases: number
          created_at: string
          current_phase: string | null
          id: string
          parallel_execution_enabled: boolean
          phases_included: string[]
          session_name: string
          started_at: string
          status: string
          total_phases: number
          updated_at: string
        }
        Insert: {
          autonomous_mode?: boolean
          completed_at?: string | null
          completed_phases?: number
          created_at?: string
          current_phase?: string | null
          id?: string
          parallel_execution_enabled?: boolean
          phases_included: string[]
          session_name: string
          started_at?: string
          status?: string
          total_phases: number
          updated_at?: string
        }
        Update: {
          autonomous_mode?: boolean
          completed_at?: string | null
          completed_phases?: number
          created_at?: string
          current_phase?: string | null
          id?: string
          parallel_execution_enabled?: boolean
          phases_included?: string[]
          session_name?: string
          started_at?: string
          status?: string
          total_phases?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          file_size: number | null
          file_type: string
          filename: string
          height: number | null
          id: string
          mime_type: string
          original_filename: string
          public_url: string
          storage_path: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          file_type: string
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          original_filename: string
          public_url: string
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          file_type?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          public_url?: string
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      optimization_logs: {
        Row: {
          created_at: string
          details: Json | null
          file_path: string | null
          id: string
          line_number: number | null
          log_level: string
          message: string
          task_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          file_path?: string | null
          id?: string
          line_number?: number | null
          log_level: string
          message: string
          task_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          file_path?: string | null
          id?: string
          line_number?: number | null
          log_level?: string
          message?: string
          task_id?: string
        }
        Relationships: []
      }
      optimization_tasks: {
        Row: {
          actual_time_minutes: number | null
          automation_capable: boolean
          automation_function: string | null
          autonomous_capable: boolean | null
          category: string
          completed_at: string | null
          created_at: string
          description: string
          estimated_time: string
          id: string
          parallel_execution: boolean | null
          phase_name: string | null
          prerequisites: string[] | null
          priority: string
          started_at: string | null
          status: string
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_time_minutes?: number | null
          automation_capable?: boolean
          automation_function?: string | null
          autonomous_capable?: boolean | null
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          estimated_time: string
          id?: string
          parallel_execution?: boolean | null
          phase_name?: string | null
          prerequisites?: string[] | null
          priority: string
          started_at?: string | null
          status?: string
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_time_minutes?: number | null
          automation_capable?: boolean
          automation_function?: string | null
          autonomous_capable?: boolean | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          estimated_time?: string
          id?: string
          parallel_execution?: boolean | null
          phase_name?: string | null
          prerequisites?: string[] | null
          priority?: string
          started_at?: string | null
          status?: string
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      optimization_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: string
          implementation_notes: Json | null
          optimization_type: string
          performance_metrics: Json | null
          priority: number | null
          status: string
          target_component: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          implementation_notes?: Json | null
          optimization_type: string
          performance_metrics?: Json | null
          priority?: number | null
          status?: string
          target_component: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          implementation_notes?: Json | null
          optimization_type?: string
          performance_metrics?: Json | null
          priority?: number | null
          status?: string
          target_component?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_drafts: {
        Row: {
          checkout_step: string | null
          created_at: string
          customer_email: string | null
          draft_data: Json
          expires_at: string | null
          id: string
          session_id: string | null
          stripe_session_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checkout_step?: string | null
          created_at?: string
          customer_email?: string | null
          draft_data?: Json
          expires_at?: string | null
          id?: string
          session_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checkout_step?: string | null
          created_at?: string
          customer_email?: string | null
          draft_data?: Json
          expires_at?: string | null
          id?: string
          session_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_groups: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_instructions: string | null
          delivery_state: string | null
          delivery_zip: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_instructions?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_instructions?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          affiliate_code: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: Json | null
          delivery_date: string | null
          delivery_fee: number | null
          delivery_time_slot: string | null
          group_order_token: string | null
          id: number
          is_group_order: boolean | null
          notes: string | null
          order_items: Json | null
          order_number: string
          payment_status: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_time_slot?: string | null
          group_order_token?: string | null
          id?: number
          is_group_order?: boolean | null
          notes?: string | null
          order_items?: Json | null
          order_number: string
          payment_status?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_time_slot?: string | null
          group_order_token?: string | null
          id?: number
          is_group_order?: boolean | null
          notes?: string | null
          order_items?: Json | null
          order_number?: string
          payment_status?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      party_planning_agents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          name: string
          tone: string
          updated_at: string | null
          voice: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          tone?: string
          updated_at?: string | null
          voice?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          tone?: string
          updated_at?: string | null
          voice?: string
        }
        Relationships: []
      }
      performance_log_simple: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          operation: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          operation: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          operation?: string
        }
        Relationships: []
      }
      performance_metrics_history: {
        Row: {
          id: string
          measured_at: string
          measurement_context: Json | null
          metric_name: string
          target_value: number
          unit: string
          value: number
        }
        Insert: {
          id?: string
          measured_at?: string
          measurement_context?: Json | null
          metric_name: string
          target_value: number
          unit: string
          value: number
        }
        Update: {
          id?: string
          measured_at?: string
          measurement_context?: Json | null
          metric_name?: string
          target_value?: number
          unit?: string
          value?: number
        }
        Relationships: []
      }
      performance_optimizations: {
        Row: {
          applied_at: string | null
          baseline_value: number | null
          created_at: string
          current_value: number | null
          description: string
          id: string
          improvement_percentage: number | null
          optimization_type: string
          status: string
          target_metric: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          description: string
          id?: string
          improvement_percentage?: number | null
          optimization_type: string
          status?: string
          target_metric: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          description?: string
          id?: string
          improvement_percentage?: number | null
          optimization_type?: string
          status?: string
          target_metric?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_checkout_pages: {
        Row: {
          bg_image_url: string | null
          bg_video_url: string | null
          content: Json
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          logo_url: string | null
          logo_width: number | null
          name: string
          slug: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          bg_image_url?: string | null
          bg_video_url?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          logo_width?: number | null
          name: string
          slug: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          bg_image_url?: string | null
          bg_video_url?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          logo_width?: number | null
          name?: string
          slug?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_checkout_screens: {
        Row: {
          affiliate_id: string | null
          background_color: string | null
          button_1_text: string | null
          button_1_url: string | null
          button_2_text: string | null
          button_2_url: string | null
          cover_page_id: string
          created_at: string | null
          flow_id: string | null
          id: string
          is_template: boolean | null
          logo_url: string | null
          styles: Json | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          background_color?: string | null
          button_1_text?: string | null
          button_1_url?: string | null
          button_2_text?: string | null
          button_2_url?: string | null
          cover_page_id: string
          created_at?: string | null
          flow_id?: string | null
          id?: string
          is_template?: boolean | null
          logo_url?: string | null
          styles?: Json | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          background_color?: string | null
          button_1_text?: string | null
          button_1_url?: string | null
          button_2_text?: string | null
          button_2_url?: string | null
          cover_page_id?: string
          created_at?: string | null
          flow_id?: string | null
          id?: string
          is_template?: boolean | null
          logo_url?: string | null
          styles?: Json | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_checkout_screens_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_checkout_screens_cover_page_id_fkey"
            columns: ["cover_page_id"]
            isOneToOne: false
            referencedRelation: "cover_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_products: {
        Row: {
          clean_title: string
          created_at: string | null
          display_subtitle: string
          id: string
          original_title: string
          package_count: number | null
          package_description: string | null
          shopify_product_id: string
          unit_size: string | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          clean_title: string
          created_at?: string | null
          display_subtitle: string
          id?: string
          original_title: string
          package_count?: number | null
          package_description?: string | null
          shopify_product_id: string
          unit_size?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          clean_title?: string
          created_at?: string | null
          display_subtitle?: string
          id?: string
          original_title?: string
          package_count?: number | null
          package_description?: string | null
          shopify_product_id?: string
          unit_size?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          assigned_category: string
          confidence_score: number | null
          created_at: string
          id: string
          product_handle: string
          product_title: string
          shopify_product_id: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          assigned_category: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          product_handle: string
          product_title: string
          shopify_product_id: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          assigned_category?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          product_handle?: string
          product_title?: string
          shopify_product_id?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: number | null
          created_at: string | null
          id: number
          product_id: number | null
        }
        Insert: {
          collection_id?: number | null
          created_at?: string | null
          id?: number
          product_id?: number | null
        }
        Update: {
          collection_id?: number | null
          created_at?: string | null
          id?: number
          product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "shopify_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_hierarchical_categories: {
        Row: {
          categories: string[] | null
          collections: string[] | null
          created_at: string | null
          hierarchy_level: number | null
          id: string
          priority_score: number | null
          product_handle: string | null
          product_id: string
          product_title: string
          product_type: string | null
          search_vector: unknown
          tags: string[] | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          categories?: string[] | null
          collections?: string[] | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          priority_score?: number | null
          product_handle?: string | null
          product_id: string
          product_title: string
          product_type?: string | null
          search_vector?: unknown
          tags?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          categories?: string[] | null
          collections?: string[] | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          priority_score?: number | null
          product_handle?: string | null
          product_id?: string
          product_title?: string
          product_type?: string | null
          search_vector?: unknown
          tags?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      product_modifications: {
        Row: {
          app_synced: boolean | null
          category: string | null
          collection: string | null
          created_at: string
          id: string
          modified_by_admin_id: string | null
          product_title: string
          product_type: string | null
          shopify_product_id: string
          synced_to_shopify: boolean
          updated_at: string
        }
        Insert: {
          app_synced?: boolean | null
          category?: string | null
          collection?: string | null
          created_at?: string
          id?: string
          modified_by_admin_id?: string | null
          product_title: string
          product_type?: string | null
          shopify_product_id: string
          synced_to_shopify?: boolean
          updated_at?: string
        }
        Update: {
          app_synced?: boolean | null
          category?: string | null
          collection?: string | null
          created_at?: string
          id?: string
          modified_by_admin_id?: string | null
          product_title?: string
          product_type?: string | null
          shopify_product_id?: string
          synced_to_shopify?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      products_cache_simple: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
        }
        Relationships: []
      }
      project_templates: {
        Row: {
          configuration: Json
          created_at: string
          description: string | null
          id: string
          template_name: string
          template_type: string
          updated_at: string
          version: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string
          description?: string | null
          id?: string
          template_name: string
          template_type: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          affiliate_code: string | null
          affiliate_id: string | null
          created_at: string
          created_by: string
          customer_company: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_fee: number
          event_date: string | null
          event_description: string | null
          event_location: string | null
          event_time: string | null
          event_type: string
          expiration_date: string
          guest_count: number | null
          id: string
          items: Json
          notes: string | null
          quote_number: string
          sales_tax: number
          status: string
          subtotal: number
          tip_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          created_at?: string
          created_by: string
          customer_company?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_fee?: number
          event_date?: string | null
          event_description?: string | null
          event_location?: string | null
          event_time?: string | null
          event_type: string
          expiration_date: string
          guest_count?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quote_number: string
          sales_tax?: number
          status?: string
          subtotal?: number
          tip_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          created_at?: string
          created_by?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_fee?: number
          event_date?: string | null
          event_description?: string | null
          event_location?: string | null
          event_time?: string | null
          event_type?: string
          expiration_date?: string
          guest_count?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quote_number?: string
          sales_tax?: number
          status?: string
          subtotal?: number
          tip_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      recent_orders: {
        Row: {
          created_at: string
          customer_email: string
          delivery_address_id: string | null
          delivery_date: string | null
          delivery_time: string | null
          expires_at: string
          id: string
          order_date: string
          order_number: string | null
          shopify_order_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          delivery_address_id?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          expires_at?: string
          id?: string
          order_date?: string
          order_number?: string | null
          shopify_order_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          delivery_address_id?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          expires_at?: string
          id?: string
          order_date?: string
          order_number?: string | null
          shopify_order_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_orders_customer_email_fkey"
            columns: ["customer_email"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "recent_orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_carts: {
        Row: {
          affiliate_code: string | null
          applied_discounts: Json | null
          cart_items: Json
          cart_value: number | null
          created_at: string
          customer_email: string | null
          customer_info: Json | null
          delivery_info: Json | null
          expires_at: string | null
          group_order_token: string | null
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code?: string | null
          applied_discounts?: Json | null
          cart_items?: Json
          cart_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_info?: Json | null
          delivery_info?: Json | null
          expires_at?: string | null
          group_order_token?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string | null
          applied_discounts?: Json | null
          cart_items?: Json
          cart_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_info?: Json | null
          delivery_info?: Json | null
          expires_at?: string | null
          group_order_token?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          user_email: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          user_email?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          user_email?: string | null
        }
        Relationships: []
      }
      security_check_schedule: {
        Row: {
          created_at: string | null
          findings: Json | null
          id: string
          last_run: string | null
          next_run: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          status?: string | null
        }
        Relationships: []
      }
      security_documentation: {
        Row: {
          category: string
          code_example: string | null
          created_at: string | null
          description: string
          id: string
          prevention_rule: string
          title: string
        }
        Insert: {
          category: string
          code_example?: string | null
          created_at?: string | null
          description: string
          id?: string
          prevention_rule: string
          title: string
        }
        Update: {
          category?: string
          code_example?: string | null
          created_at?: string | null
          description?: string
          id?: string
          prevention_rule?: string
          title?: string
        }
        Relationships: []
      }
      security_standards: {
        Row: {
          created_at: string | null
          description: string | null
          enforcement_rule: string
          id: string
          is_active: boolean | null
          standard_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enforcement_rule: string
          id?: string
          is_active?: boolean | null
          standard_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enforcement_rule?: string
          id?: string
          is_active?: boolean | null
          standard_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shared_order_participants: {
        Row: {
          id: string
          items_added: Json | null
          joined_at: string
          order_id: string
          participant_email: string
          participant_name: string | null
          total_contribution: number | null
        }
        Insert: {
          id?: string
          items_added?: Json | null
          joined_at?: string
          order_id: string
          participant_email: string
          participant_name?: string | null
          total_contribution?: number | null
        }
        Update: {
          id?: string
          items_added?: Json | null
          joined_at?: string
          order_id?: string
          participant_email?: string
          participant_name?: string | null
          total_contribution?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_order_participants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_collections: {
        Row: {
          created_at: string | null
          description: string | null
          handle: string
          id: number
          image: Json | null
          published: boolean | null
          shopify_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          handle: string
          id?: number
          image?: Json | null
          published?: boolean | null
          shopify_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          handle?: string
          id?: number
          image?: Json | null
          published?: boolean | null
          shopify_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shopify_collections_cache: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          handle: string
          id: string
          image_url: string | null
          last_synced_at: string
          product_order: number[] | null
          products_count: number | null
          shopify_collection_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          description?: string | null
          handle: string
          id?: string
          image_url?: string | null
          last_synced_at?: string
          product_order?: number[] | null
          products_count?: number | null
          shopify_collection_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          handle?: string
          id?: string
          image_url?: string | null
          last_synced_at?: string
          product_order?: number[] | null
          products_count?: number | null
          shopify_collection_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_discount_codes_cache: {
        Row: {
          code: string
          created_at: string | null
          customer_selection: string | null
          ends_at: string | null
          id: string
          is_recomsale_code: boolean | null
          minimum_order_amount: number | null
          once_per_customer: boolean | null
          raw_data: Json | null
          shopify_discount_id: string
          shopify_price_rule_id: string
          starts_at: string | null
          target_type: string | null
          title: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          value: string
          value_type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          customer_selection?: string | null
          ends_at?: string | null
          id?: string
          is_recomsale_code?: boolean | null
          minimum_order_amount?: number | null
          once_per_customer?: boolean | null
          raw_data?: Json | null
          shopify_discount_id: string
          shopify_price_rule_id: string
          starts_at?: string | null
          target_type?: string | null
          title?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value: string
          value_type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          customer_selection?: string | null
          ends_at?: string | null
          id?: string
          is_recomsale_code?: boolean | null
          minimum_order_amount?: number | null
          once_per_customer?: boolean | null
          raw_data?: Json | null
          shopify_discount_id?: string
          shopify_price_rule_id?: string
          starts_at?: string | null
          target_type?: string | null
          title?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      shopify_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_group_id: string | null
          shopify_order_id: string
          shopify_order_number: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_group_id?: string | null
          shopify_order_id: string
          shopify_order_number?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_group_id?: string | null
          shopify_order_id?: string
          shopify_order_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_order_group_id_fkey"
            columns: ["order_group_id"]
            isOneToOne: false
            referencedRelation: "order_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders_cache: {
        Row: {
          billing_address: Json | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          line_items: Json | null
          note: string | null
          order_number: string | null
          shipping_address: Json | null
          shopify_order_id: string
          source_name: string | null
          subtotal_price: number | null
          tags: string | null
          total_price: number | null
          total_tax: number | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          line_items?: Json | null
          note?: string | null
          order_number?: string | null
          shipping_address?: Json | null
          shopify_order_id: string
          source_name?: string | null
          subtotal_price?: number | null
          tags?: string | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          line_items?: Json | null
          note?: string | null
          order_number?: string | null
          shipping_address?: Json | null
          shopify_order_id?: string
          source_name?: string | null
          subtotal_price?: number | null
          tags?: string | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shopify_products: {
        Row: {
          available: boolean | null
          created_at: string | null
          description: string | null
          handle: string
          id: number
          images: Json | null
          inventory_quantity: number | null
          options: Json | null
          price_max: number | null
          price_min: number | null
          product_type: string | null
          shopify_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          variants: Json | null
          vendor: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          handle: string
          id?: number
          images?: Json | null
          inventory_quantity?: number | null
          options?: Json | null
          price_max?: number | null
          price_min?: number | null
          product_type?: string | null
          shopify_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          variants?: Json | null
          vendor?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          handle?: string
          id?: number
          images?: Json | null
          inventory_quantity?: number | null
          options?: Json | null
          price_max?: number | null
          price_min?: number | null
          product_type?: string | null
          shopify_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          variants?: Json | null
          vendor?: string | null
        }
        Relationships: []
      }
      shopify_products_cache: {
        Row: {
          category: string | null
          category_title: string | null
          collection_handles: string[] | null
          collection_id: string | null
          created_at: string
          data: Json
          description: string | null
          handle: string
          id: string
          image: string | null
          image_url: string | null
          price: number | null
          product_type: string | null
          search_category: string | null
          shopify_id: string | null
          shopify_product_id: string
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
          variants: Json | null
          vendor: string | null
        }
        Insert: {
          category?: string | null
          category_title?: string | null
          collection_handles?: string[] | null
          collection_id?: string | null
          created_at?: string
          data: Json
          description?: string | null
          handle: string
          id?: string
          image?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          search_category?: string | null
          shopify_id?: string | null
          shopify_product_id: string
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Update: {
          category?: string | null
          category_title?: string | null
          collection_handles?: string[] | null
          collection_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          handle?: string
          id?: string
          image?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          search_category?: string | null
          shopify_id?: string | null
          shopify_product_id?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_products_cache_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "shopify_collections_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_webhook_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          topics: string[] | null
          updated_at: string | null
          webhook_secret: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          topics?: string[] | null
          updated_at?: string | null
          webhook_secret: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          topics?: string[] | null
          updated_at?: string | null
          webhook_secret?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      site_configurations: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          site_id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_configurations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "custom_affiliate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_product_collections: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_enabled: boolean | null
          shopify_collection_handle: string
          site_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          shopify_collection_handle: string
          site_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          shopify_collection_handle?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_product_collections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "custom_affiliate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_configuration_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority: number
          rule_name: string
          rule_type: string
          triggers: Json
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name: string
          rule_type: string
          triggers?: Json
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name?: string
          rule_type?: string
          triggers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      system_audit_log: {
        Row: {
          created_at: string
          error_details: Json | null
          event_type: string
          execution_time_ms: number | null
          id: string
          ip_address: string | null
          operation: string
          request_data: Json | null
          response_data: Json | null
          service_name: string
          session_id: string | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          event_type: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: string | null
          operation: string
          request_data?: Json | null
          response_data?: Json | null
          service_name: string
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          event_type?: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: string | null
          operation?: string
          request_data?: Json | null
          response_data?: Json | null
          service_name?: string
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      system_backups: {
        Row: {
          backup_location: string | null
          backup_name: string
          backup_size_bytes: number | null
          backup_type: string
          checksum: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          tables_included: string[]
          verified_at: string | null
        }
        Insert: {
          backup_location?: string | null
          backup_name: string
          backup_size_bytes?: number | null
          backup_type: string
          checksum?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          tables_included?: string[]
          verified_at?: string | null
        }
        Update: {
          backup_location?: string | null
          backup_name?: string
          backup_size_bytes?: number | null
          backup_type?: string
          checksum?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          tables_included?: string[]
          verified_at?: string | null
        }
        Relationships: []
      }
      system_documentation: {
        Row: {
          content: Json
          created_at: string | null
          doc_type: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          doc_type: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          doc_type?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_guidelines: {
        Row: {
          component_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          examples: Json | null
          guideline_type: string
          id: string
          is_active: boolean
          priority: number | null
          rules: Json
          title: string
          updated_at: string
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          examples?: Json | null
          guideline_type: string
          id?: string
          is_active?: boolean
          priority?: number | null
          rules?: Json
          title: string
          updated_at?: string
        }
        Update: {
          component_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          examples?: Json | null
          guideline_type?: string
          id?: string
          is_active?: boolean
          priority?: number | null
          rules?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_health: {
        Row: {
          active_sessions: number | null
          critical_issues: number | null
          id: string
          issues_24h: number | null
          timestamp: string
        }
        Insert: {
          active_sessions?: number | null
          critical_issues?: number | null
          id?: string
          issues_24h?: number | null
          timestamp?: string
        }
        Update: {
          active_sessions?: number | null
          critical_issues?: number | null
          id?: string
          issues_24h?: number | null
          timestamp?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          chat_id: number
          created_at: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_active: string
          last_name: string | null
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string
          last_name?: string | null
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string
          last_name?: string | null
          username?: string | null
        }
        Relationships: []
      }
      testing_issues: {
        Row: {
          created_at: string
          description: string
          flow: string
          id: string
          location: string | null
          screenshot_url: string | null
          session_id: string | null
          severity: string
          status: string
          suggested_fix: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          flow: string
          id?: string
          location?: string | null
          screenshot_url?: string | null
          session_id?: string | null
          severity: string
          status?: string
          suggested_fix?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          flow?: string
          id?: string
          location?: string | null
          screenshot_url?: string | null
          session_id?: string | null
          severity?: string
          status?: string
          suggested_fix?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "testing_issues_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "testing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      testing_sessions: {
        Row: {
          app_url: string | null
          chat_id: number | null
          created_at: string
          current_flow: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          app_url?: string | null
          chat_id?: number | null
          created_at?: string
          current_flow?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_url?: string | null
          chat_id?: number | null
          created_at?: string
          current_flow?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          customer_email: string | null
          delivery_preferences: Json | null
          id: string
          notification_settings: Json | null
          payment_preferences: Json | null
          preferences: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          delivery_preferences?: Json | null
          id?: string
          notification_settings?: Json | null
          payment_preferences?: Json | null
          preferences?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          delivery_preferences?: Json | null
          id?: string
          notification_settings?: Json | null
          payment_preferences?: Json | null
          preferences?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_session_progress: {
        Row: {
          created_at: string
          customer_email: string | null
          expires_at: string | null
          id: string
          page_context: string | null
          progress_data: Json
          progress_type: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          page_context?: string | null
          progress_data?: Json
          progress_type: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          page_context?: string | null
          progress_data?: Json
          progress_type?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      voucher_usage: {
        Row: {
          amount_used: number
          customer_email: string | null
          id: string
          order_id: string | null
          remaining_balance: number | null
          used_at: string
          voucher_id: string
        }
        Insert: {
          amount_used: number
          customer_email?: string | null
          id?: string
          order_id?: string | null
          remaining_balance?: number | null
          used_at?: string
          voucher_id: string
        }
        Update: {
          amount_used?: number
          customer_email?: string | null
          id?: string
          order_id?: string | null
          remaining_balance?: number | null
          used_at?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_usage_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          affiliate_id: string | null
          commission_rate: number | null
          created_at: string
          created_by_admin_id: string | null
          current_uses: number | null
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          minimum_spend: number | null
          prepaid_amount: number | null
          updated_at: string
          voucher_code: string
          voucher_name: string
          voucher_type: string
        }
        Insert: {
          affiliate_id?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_spend?: number | null
          prepaid_amount?: number | null
          updated_at?: string
          voucher_code: string
          voucher_name: string
          voucher_type: string
        }
        Update: {
          affiliate_id?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_spend?: number | null
          prepaid_amount?: number | null
          updated_at?: string
          voucher_code?: string
          voucher_name?: string
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      warmup_log: {
        Row: {
          collections_count: number | null
          created_at: string
          error_message: string | null
          id: string
          products_count: number | null
          status: string
          sync_triggered: boolean | null
          type: string
        }
        Insert: {
          collections_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          products_count?: number | null
          status?: string
          sync_triggered?: boolean | null
          type: string
        }
        Update: {
          collections_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          products_count?: number | null
          status?: string
          sync_triggered?: boolean | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_fix_all_security_issues: { Args: never; Returns: Json }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      cleanup_expired_cache_optimized: { Args: never; Returns: undefined }
      cleanup_expired_orders: { Args: never; Returns: undefined }
      cleanup_expired_progress: { Args: never; Returns: undefined }
      cleanup_integration_health_logs: { Args: never; Returns: undefined }
      cleanup_product_cache: { Args: never; Returns: undefined }
      cleanup_sensitive_payment_data: { Args: never; Returns: undefined }
      comprehensive_security_check: { Args: never; Returns: Json }
      configure_auth_security: { Args: never; Returns: undefined }
      document_remaining_manual_actions: { Args: never; Returns: Json }
      enforce_security_standards: { Args: never; Returns: Json }
      execute_automation_template: {
        Args: { template_name_param: string }
        Returns: Json
      }
      finalize_security_setup: { Args: never; Returns: Json }
      find_group_order_by_token: {
        Args: { p_share_token: string }
        Returns: {
          customer_email: string
          customer_name: string
          delivery_address: Json
          delivery_date: string
          delivery_time: string
          group_participants: Json
          is_active: boolean
          order_id: string
          order_number: string
          total_amount: number
        }[]
      }
      fix_function_search_paths: { Args: never; Returns: Json }
      generate_affiliate_code: {
        Args: { company_name: string }
        Returns: string
      }
      generate_affiliate_handle: {
        Args: { company_name: string }
        Returns: string
      }
      get_active_discount_codes: {
        Args: { recomsale_only?: boolean }
        Returns: {
          code: string
          ends_at: string
          is_recomsale_code: boolean
          minimum_order_amount: number
          once_per_customer: boolean
          starts_at: string
          title: string
          usage_count: number
          usage_limit: number
          value: string
          value_type: string
        }[]
      }
      get_categories_with_counts: {
        Args: never
        Returns: {
          category: string
          product_count: number
        }[]
      }
      get_checkout_config: { Args: { config_type?: string }; Returns: Json }
      get_dashboard_data: {
        Args: {
          affiliate_code?: string
          dashboard_type: string
          user_email?: string
        }
        Returns: Json
      }
      get_dashboard_data_fixed: {
        Args: {
          affiliate_code?: string
          dashboard_type: string
          user_email?: string
        }
        Returns: Json
      }
      get_final_security_summary: { Args: never; Returns: Json }
      get_group_order_details: {
        Args: { p_share_token: string }
        Returns: Json
      }
      get_post_checkout_url: { Args: { app_name: string }; Returns: string }
      get_product_category: {
        Args: { p_collection_handles: string[] }
        Returns: string
      }
      get_products_cached: {
        Args: { p_category?: string; p_limit?: number }
        Returns: Json
      }
      get_security_status: { Args: never; Returns: Json }
      get_system_guidelines: {
        Args: { p_guideline_type?: string }
        Returns: Json
      }
      hash_password: { Args: { password: string }; Returns: string }
      hierarchical_product_search: {
        Args: { max_results?: number; search_query: string }
        Returns: {
          categories: string[]
          collections: string[]
          match_type: string
          product_handle: string
          product_id: string
          product_title: string
          product_type: string
          relevance_score: number
          tags: string[]
          vendor: string
        }[]
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_admin_user_enhanced: { Args: never; Returns: boolean }
      is_admin_user_safe: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      join_group_order: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_line_items: Json
          p_share_token: string
          p_subtotal: number
        }
        Returns: Json
      }
      join_group_order_enhanced: {
        Args: {
          p_share_token: string
          p_user_email: string
          p_user_name: string
        }
        Returns: Json
      }
      join_group_order_fixed: {
        Args: {
          p_share_token: string
          p_user_email: string
          p_user_name: string
        }
        Returns: Json
      }
      link_customer_session: {
        Args: { customer_email: string; session_token: string }
        Returns: undefined
      }
      link_customer_session_enhanced: {
        Args: {
          customer_email: string
          order_data?: Json
          session_token: string
        }
        Returns: Json
      }
      load_figma_template: { Args: { template_id: string }; Returns: Json }
      log_ai_work: {
        Args: {
          p_action_type: string
          p_after_state?: Json
          p_before_state?: Json
          p_component_name?: string
          p_description?: string
          p_error_details?: Json
          p_file_path?: string
          p_session_id: string
          p_success?: boolean
        }
        Returns: string
      }
      log_checkout_event: {
        Args: {
          p_device_info?: Json
          p_entry_point?: string
          p_error_details?: Json
          p_session_id: string
          p_status?: string
          p_step: string
          p_user_email: string
        }
        Returns: string
      }
      log_security_access: {
        Args: { details?: Json; event_type: string; table_name: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { details?: Json; event_type: string; user_email: string }
        Returns: undefined
      }
      log_slow_operation: {
        Args: { p_duration_ms: number; p_operation: string }
        Returns: undefined
      }
      log_system_event: {
        Args: {
          p_error_details?: Json
          p_event_type: string
          p_execution_time_ms?: number
          p_ip_address?: string
          p_operation: string
          p_request_data?: Json
          p_response_data?: Json
          p_service_name: string
          p_session_id?: string
          p_severity?: string
          p_user_agent?: string
          p_user_email?: string
        }
        Returns: string
      }
      monitor_security_status: { Args: never; Returns: Json }
      optimized_cache_cleanup: { Args: never; Returns: undefined }
      request_admin_password_reset: {
        Args: { admin_email: string }
        Returns: Json
      }
      revoke_all_public_access: { Args: never; Returns: undefined }
      safe_cache_upsert: {
        Args: { cache_data: Json; cache_key: string; expires_timestamp: number }
        Returns: string
      }
      safe_cache_upsert_fixed: {
        Args: { cache_data: Json; cache_key: string; expires_timestamp: number }
        Returns: string
      }
      safe_timestamp_to_bigint: { Args: { ts: string }; Returns: number }
      sanitize_order_payment_data: {
        Args: { payment_intent_id_param: string }
        Returns: undefined
      }
      set_admin_context: { Args: { admin_email: string }; Returns: undefined }
      set_admin_password: {
        Args: { admin_email: string; new_password: string }
        Returns: boolean
      }
      sync_shopify_to_hierarchical_categories: { Args: never; Returns: number }
      track_affiliate_order: {
        Args: {
          p_affiliate_slug: string
          p_order_data: Json
          p_session_id: string
        }
        Returns: string
      }
      trigger_keep_alive: { Args: never; Returns: undefined }
      trigger_shopify_bulk_sync: { Args: never; Returns: Json }
      update_component_health: {
        Args: {
          p_component_name: string
          p_dependencies?: Json
          p_file_path: string
          p_is_legacy?: boolean
          p_issues?: Json
          p_status?: string
        }
        Returns: string
      }
      update_daily_analytics: { Args: never; Returns: undefined }
      upsert_cache_entry: {
        Args: {
          cache_data_param: Json
          cache_key_param: string
          expires_timestamp_param: number
        }
        Returns: string
      }
      validate_discount_code: {
        Args: { discount_code_param: string; order_subtotal_param?: number }
        Returns: {
          code_details: Json
          discount_amount: number
          error_message: string
          is_valid: boolean
        }[]
      }
      validate_security_setup: {
        Args: never
        Returns: {
          has_policies: boolean
          rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
      verify_admin_access: { Args: { user_email: string }; Returns: boolean }
      verify_admin_password: {
        Args: { input_email: string; input_password: string }
        Returns: boolean
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
      warm_system_cache: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
