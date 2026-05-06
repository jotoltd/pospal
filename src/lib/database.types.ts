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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          allergies: string | null
          created_at: string | null
          email: string | null
          id: string
          is_vip: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string
          total_orders: number | null
          total_spent: number | null
          total_visits: number | null
          venue_id: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone: string
          total_orders?: number | null
          total_spent?: number | null
          total_visits?: number | null
          venue_id: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string
          total_orders?: number | null
          total_spent?: number | null
          total_visits?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          happy_hour_end: string | null
          happy_hour_start: string | null
          id: string
          is_happy_hour: boolean | null
          max_uses: number | null
          min_order_value: number | null
          type: string
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
          venue_id: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          happy_hour_end?: string | null
          happy_hour_start?: string | null
          id?: string
          is_happy_hour?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          type?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
          venue_id: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          happy_hour_end?: string | null
          happy_hour_start?: string | null
          id?: string
          is_happy_hour?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          type?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          low_stock_threshold: number | null
          modifiers: Json | null
          name: string
          price: number
          sort_order: number | null
          stock_count: number | null
          track_stock: boolean | null
          venue_id: string
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          low_stock_threshold?: number | null
          modifiers?: Json | null
          name: string
          price?: number
          sort_order?: number | null
          stock_count?: number | null
          track_stock?: boolean | null
          venue_id: string
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          low_stock_threshold?: number | null
          modifiers?: Json | null
          name?: string
          price?: number
          sort_order?: number | null
          stock_count?: number | null
          track_stock?: boolean | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string | null
          modifiers: Json | null
          name: string
          notes: string | null
          order_id: string
          price: number
          quantity: number
          venue_id: string
        }
        Insert: {
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name: string
          notes?: string | null
          order_id: string
          price: number
          quantity?: number
          venue_id: string
        }
        Update: {
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name?: string
          notes?: string | null
          order_id?: string
          price?: number
          quantity?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number | null
          discount: number
          discount_code: string | null
          id: string
          loyalty_points_earned: number | null
          loyalty_points_redeemed: number | null
          notes: string | null
          order_number: string
          order_type: string
          payment_method: string | null
          refund_amount: number | null
          refund_reason: string | null
          service_charge: number | null
          split_card: number | null
          split_cash: number | null
          staff_id: string | null
          status: string
          subtotal: number
          table_number: string | null
          tax: number
          tip: number | null
          total: number
          transaction_code: string | null
          venue_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          discount?: number
          discount_code?: string | null
          id?: string
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          notes?: string | null
          order_number: string
          order_type?: string
          payment_method?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          service_charge?: number | null
          split_card?: number | null
          split_cash?: number | null
          staff_id?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          tip?: number | null
          total?: number
          transaction_code?: string | null
          venue_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          discount?: number
          discount_code?: string | null
          id?: string
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          notes?: string | null
          order_number?: string
          order_type?: string
          payment_method?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          service_charge?: number | null
          split_card?: number | null
          split_cash?: number | null
          staff_id?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          tip?: number | null
          total?: number
          transaction_code?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      parked_orders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number
          discount: number
          id: string
          items: Json
          notes: string | null
          order_name: string
          order_type: string | null
          service_charge: number
          subtotal: number
          table_number: string | null
          tax: number
          total: number
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_name: string
          order_type?: string | null
          service_charge?: number
          subtotal: number
          table_number?: string | null
          tax?: number
          total: number
          venue_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_name?: string
          order_type?: string | null
          service_charge?: number
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parked_orders_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string
          reason: string | null
          staff_id: string | null
          venue_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id: string
          reason?: string | null
          staff_id?: string | null
          venue_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string
          reason?: string | null
          staff_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          venue_id: string
        }
        Insert: {
          id?: string
          key: string
          value?: string
          venue_id: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          clock_in: string
          clock_out: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          staff_id: string
          staff_name: string
          venue_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          staff_id: string
          staff_name: string
          venue_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          staff_id?: string
          staff_name?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          is_manager: boolean | null
          name: string
          pin: string
          role: string
          venue_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_manager?: boolean | null
          name: string
          pin: string
          role?: string
          venue_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_manager?: boolean | null
          name?: string
          pin?: string
          role?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          plan: string
          plan_expires_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_venue: { Args: { v_id: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
