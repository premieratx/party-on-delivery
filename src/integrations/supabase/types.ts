export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          id: string
          last_activity_at: string
          session_id: string
          subtotal: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          abandoned_at?: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          cart_items?: Json
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          last_activity_at?: string
          session_id: string
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          abandoned_at?: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          cart_items?: Json
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          last_activity_at?: string
          session_id?: string
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
          commission_unpaid: number | null
          company_name: string
          created_at: string | null
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
          commission_unpaid?: number | null
          company_name: string
          created_at?: string | null
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
          commission_unpaid?: number | null
          company_name?: string
          created_at?: string | null
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
      custom_affiliate_sites: {
        Row: {
          affiliate_id: string | null
          business_address: Json | null
          business_name: string
          created_at: string
          custom_promo_code: string | null
          delivery_address: Json | null
          id: string
          is_active: boolean | null
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
          id?: string
          is_active?: boolean | null
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
          id?: string
          is_active?: boolean | null
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
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
          group_participants: Json | null
          id: string
          is_group_order: boolean | null
          is_shareable: boolean | null
          line_items: Json
          order_number: string
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
          group_participants?: Json | null
          id?: string
          is_group_order?: boolean | null
          is_shareable?: boolean | null
          line_items?: Json
          order_number: string
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
          group_participants?: Json | null
          id?: string
          is_group_order?: boolean | null
          is_shareable?: boolean | null
          line_items?: Json
          order_number?: string
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
          {
            foreignKeyName: "customer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          created_at: string
          email: string
          first_name: string | null
          google_id: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          referred_by_affiliate_id: string | null
          referred_by_code: string | null
          session_tokens: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          google_id?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          referred_by_affiliate_id?: string | null
          referred_by_code?: string | null
          session_tokens?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          google_id?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          referred_by_affiliate_id?: string | null
          referred_by_code?: string | null
          session_tokens?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_referred_by_affiliate_id_fkey"
            columns: ["referred_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
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
      shopify_collections_cache: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          handle: string
          id: string
          image_url: string | null
          last_synced_at: string
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
          products_count?: number | null
          shopify_collection_id?: string
          title?: string
          updated_at?: string
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
      shopify_products_cache: {
        Row: {
          collection_id: string | null
          created_at: string
          data: Json
          description: string | null
          handle: string
          id: string
          image_url: string | null
          price: number | null
          shopify_product_id: string
          title: string
          updated_at: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          data: Json
          description?: string | null
          handle: string
          id?: string
          image_url?: string | null
          price?: number | null
          shopify_product_id: string
          title: string
          updated_at?: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          handle?: string
          id?: string
          image_url?: string | null
          price?: number | null
          shopify_product_id?: string
          title?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_affiliate_code: {
        Args: { company_name: string }
        Returns: string
      }
      join_group_order: {
        Args: {
          p_share_token: string
          p_customer_email: string
          p_customer_name: string
          p_line_items: Json
          p_subtotal: number
        }
        Returns: Json
      }
      link_customer_session: {
        Args: { customer_email: string; session_token: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { event_type: string; user_email: string; details?: Json }
        Returns: undefined
      }
      safe_cache_upsert: {
        Args: { cache_key: string; cache_data: Json; expires_timestamp: number }
        Returns: string
      }
      verify_admin_password: {
        Args: { input_email: string; input_password: string }
        Returns: boolean
      }
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
