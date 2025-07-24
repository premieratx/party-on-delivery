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
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
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
      log_security_event: {
        Args: { event_type: string; user_email: string; details?: Json }
        Returns: undefined
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
