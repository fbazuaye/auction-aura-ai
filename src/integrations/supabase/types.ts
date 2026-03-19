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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      auctions: {
        Row: {
          bid_increment: number
          created_at: string
          current_bid: number | null
          ends_at: string
          id: string
          live_stream_url: string | null
          original_end_time: string | null
          reserve_price: number | null
          start_price: number
          starts_at: string
          status: string
          updated_at: string
          vehicle_id: string
          winner_id: string | null
        }
        Insert: {
          bid_increment?: number
          created_at?: string
          current_bid?: number | null
          ends_at: string
          id?: string
          live_stream_url?: string | null
          original_end_time?: string | null
          reserve_price?: number | null
          start_price: number
          starts_at: string
          status?: string
          updated_at?: string
          vehicle_id: string
          winner_id?: string | null
        }
        Update: {
          bid_increment?: number
          created_at?: string
          current_bid?: number | null
          ends_at?: string
          id?: string
          live_stream_url?: string | null
          original_end_time?: string | null
          reserve_price?: number | null
          start_price?: number
          starts_at?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_bid_settings: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          is_active: boolean
          max_bids: number
          max_budget: number
          strategy: string
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_bids?: number
          max_budget: number
          strategy?: string
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_bids?: number
          max_budget?: number
          strategy?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_bid_settings_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_bid_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          price: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          price?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          price?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
          is_auto_bid: boolean
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_vehicles: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          ai_condition_score: number | null
          ai_market_value: number | null
          ai_profit_potential: number | null
          ai_repair_cost: number | null
          body_style: string | null
          condition: string
          created_at: string
          cylinders: number | null
          description: string | null
          drive_type: string | null
          engine_type: string | null
          exterior_color: string | null
          fuel_type: string | null
          highlights: string[] | null
          id: string
          images: string[] | null
          inspection_reports: string[] | null
          interior_color: string | null
          keys_available: boolean | null
          location: string | null
          make: string
          mileage: number
          model: string
          primary_damage: string | null
          reserve_price: number | null
          secondary_damage: string | null
          seller_id: string
          status: string
          title_status: string | null
          transmission: string | null
          updated_at: string
          videos: string[] | null
          vin: string | null
          year: number
        }
        Insert: {
          ai_condition_score?: number | null
          ai_market_value?: number | null
          ai_profit_potential?: number | null
          ai_repair_cost?: number | null
          body_style?: string | null
          condition?: string
          created_at?: string
          cylinders?: number | null
          description?: string | null
          drive_type?: string | null
          engine_type?: string | null
          exterior_color?: string | null
          fuel_type?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inspection_reports?: string[] | null
          interior_color?: string | null
          keys_available?: boolean | null
          location?: string | null
          make: string
          mileage: number
          model: string
          primary_damage?: string | null
          reserve_price?: number | null
          secondary_damage?: string | null
          seller_id: string
          status?: string
          title_status?: string | null
          transmission?: string | null
          updated_at?: string
          videos?: string[] | null
          vin?: string | null
          year: number
        }
        Update: {
          ai_condition_score?: number | null
          ai_market_value?: number | null
          ai_profit_potential?: number | null
          ai_repair_cost?: number | null
          body_style?: string | null
          condition?: string
          created_at?: string
          cylinders?: number | null
          description?: string | null
          drive_type?: string | null
          engine_type?: string | null
          exterior_color?: string | null
          fuel_type?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inspection_reports?: string[] | null
          interior_color?: string | null
          keys_available?: boolean | null
          location?: string | null
          make?: string
          mileage?: number
          model?: string
          primary_damage?: string | null
          reserve_price?: number | null
          secondary_damage?: string | null
          seller_id?: string
          status?: string
          title_status?: string | null
          transmission?: string | null
          updated_at?: string
          videos?: string[] | null
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
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
    Enums: {
      app_role: ["buyer", "seller", "admin"],
    },
  },
} as const
