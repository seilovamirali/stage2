export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      club_members: {
        Row: {
          joined_at: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      club_profiles: {
        Row: {
          avatar_emoji: string
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_emoji?: string
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          avatar_emoji?: string
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      club_habits: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          description: string
          emoji: string
          key: string
          kind: string
          points: number
          sort_order: number
          title: string
          weekly_target: number | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          emoji: string
          key: string
          kind: string
          points?: number
          sort_order?: number
          title: string
          weekly_target?: number | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          key?: string
          kind?: string
          points?: number
          sort_order?: number
          title?: string
          weekly_target?: number | null
        }
        Relationships: []
      }
      club_completions: {
        Row: {
          completed_on: string
          created_at: string
          id: string
          task_key: string
          times: number
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          id?: string
          task_key: string
          times?: number
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          id?: string
          task_key?: string
          times?: number
          user_id?: string
        }
        Relationships: []
      }
      club_user_habits: {
        Row: {
          archived: boolean
          created_at: string
          description: string
          emoji: string
          key: string
          kind: string
          points: number
          sort_order: number
          title: string
          user_id: string
          weekly_target: number | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string
          emoji: string
          key: string
          kind: string
          points?: number
          sort_order?: number
          title: string
          user_id: string
          weekly_target?: number | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string
          emoji?: string
          key?: string
          kind?: string
          points?: number
          sort_order?: number
          title?: string
          user_id?: string
          weekly_target?: number | null
        }
        Relationships: []
      }
      club_book_progress: {
        Row: {
          book_title: string
          current_page: number
          day_start_date: string
          day_start_page: number
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_title?: string
          current_page?: number
          day_start_date?: string
          day_start_page?: number
          total_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_title?: string
          current_page?: number
          day_start_date?: string
          day_start_page?: number
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      club_ensure_member: {
        Args: { p_display_name?: string | null }
        Returns: {
          avatar_emoji: string
          created_at: string
          display_name: string
          id: string
        }
      }
      club_is_member: {
        Args: Record<PropertyKey, never>
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
