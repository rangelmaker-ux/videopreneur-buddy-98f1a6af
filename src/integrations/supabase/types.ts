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
  public: {
    Tables: {
      compradores_aprovados: {
        Row: {
          amount: number | null
          buyer_name: string | null
          created_at: string
          email: string
          hoopay_order_id: number | null
          hotmart_product_id: string | null
          hotmart_transaction: string | null
          id: string
          payment_gateway: string | null
          raw_payload: Json | null
          status_compra: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          buyer_name?: string | null
          created_at?: string
          email: string
          hoopay_order_id?: number | null
          hotmart_product_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          payment_gateway?: string | null
          raw_payload?: Json | null
          status_compra?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          buyer_name?: string | null
          created_at?: string
          email?: string
          hoopay_order_id?: number | null
          hotmart_product_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          payment_gateway?: string | null
          raw_payload?: Json | null
          status_compra?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixed_client_deliveries: {
        Row: {
          created_at: string
          cycle_month: number
          cycle_year: number
          delivered_at: string | null
          delivery_date: string | null
          fixed_client_id: string | null
          id: string
          location: string
          notes: string
          quote_id: string | null
          recording_at: string | null
          script: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_month: number
          cycle_year: number
          delivered_at?: string | null
          delivery_date?: string | null
          fixed_client_id?: string | null
          id?: string
          location?: string
          notes?: string
          quote_id?: string | null
          recording_at?: string | null
          script?: string
          status?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_month?: number
          cycle_year?: number
          delivered_at?: string | null
          delivery_date?: string | null
          fixed_client_id?: string | null
          id?: string
          location?: string
          notes?: string
          quote_id?: string | null
          recording_at?: string | null
          script?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_client_deliveries_fixed_client_id_fkey"
            columns: ["fixed_client_id"]
            isOneToOne: false
            referencedRelation: "fixed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_client_deliveries_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_clients: {
        Row: {
          active: boolean
          contact: string | null
          created_at: string
          id: string
          monthly_value: number
          name: string
          notes: string | null
          renewal_day: number
          updated_at: string
          user_id: string
          videos_per_month: number
        }
        Insert: {
          active?: boolean
          contact?: string | null
          created_at?: string
          id?: string
          monthly_value?: number
          name: string
          notes?: string | null
          renewal_day?: number
          updated_at?: string
          user_id: string
          videos_per_month?: number
        }
        Update: {
          active?: boolean
          contact?: string | null
          created_at?: string
          id?: string
          monthly_value?: number
          name?: string
          notes?: string | null
          renewal_day?: number
          updated_at?: string
          user_id?: string
          videos_per_month?: number
        }
        Relationships: []
      }
      professional_data: {
        Row: {
          business_name: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          breakdown: Json
          created_at: string
          customer_name: string
          dur_minutes: number
          dur_seconds: number
          editing_level: string
          fixed_client_id: string | null
          id: string
          locations: number
          notes: string | null
          project_name: string
          services: Json
          status: string
          total: number
          updated_at: string
          user_id: string
          video_type_key: string
          video_type_label: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          customer_name: string
          dur_minutes?: number
          dur_seconds?: number
          editing_level?: string
          fixed_client_id?: string | null
          id?: string
          locations?: number
          notes?: string | null
          project_name: string
          services?: Json
          status?: string
          total?: number
          updated_at?: string
          user_id: string
          video_type_key: string
          video_type_label: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          customer_name?: string
          dur_minutes?: number
          dur_seconds?: number
          editing_level?: string
          fixed_client_id?: string | null
          id?: string
          locations?: number
          notes?: string | null
          project_name?: string
          services?: Json
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
          video_type_key?: string
          video_type_label?: string
        }
        Relationships: []
      }
      video_configs: {
        Row: {
          adv_mult: number
          audio_cost: number
          base_rate: number
          basic_mult: number
          color_cost: number
          created_at: string
          drone_cost: number
          freelancer_cost: number
          id: string
          inter_mult: number
          location_cost: number
          motion_cost: number
          multi_cost: number
          script_cost: number
          sort_order: number
          story_cost: number
          subs_cost: number
          updated_at: string
          user_id: string
          video_type_key: string
          video_type_label: string
        }
        Insert: {
          adv_mult?: number
          audio_cost?: number
          base_rate?: number
          basic_mult?: number
          color_cost?: number
          created_at?: string
          drone_cost?: number
          freelancer_cost?: number
          id?: string
          inter_mult?: number
          location_cost?: number
          motion_cost?: number
          multi_cost?: number
          script_cost?: number
          sort_order?: number
          story_cost?: number
          subs_cost?: number
          updated_at?: string
          user_id: string
          video_type_key: string
          video_type_label: string
        }
        Update: {
          adv_mult?: number
          audio_cost?: number
          base_rate?: number
          basic_mult?: number
          color_cost?: number
          created_at?: string
          drone_cost?: number
          freelancer_cost?: number
          id?: string
          inter_mult?: number
          location_cost?: number
          motion_cost?: number
          multi_cost?: number
          script_cost?: number
          sort_order?: number
          story_cost?: number
          subs_cost?: number
          updated_at?: string
          user_id?: string
          video_type_key?: string
          video_type_label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_email_approved: { Args: { _email: string }; Returns: boolean }
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
