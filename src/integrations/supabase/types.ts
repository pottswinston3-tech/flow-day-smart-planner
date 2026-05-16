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
      classes: {
        Row: {
          color: string
          created_at: string
          days: number[]
          end_time: string
          id: string
          name: string
          notes: string | null
          period: string | null
          room: string | null
          start_time: string
          student_uuid: string
          subject: string | null
          teacher: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          days?: number[]
          end_time: string
          id?: string
          name: string
          notes?: string | null
          period?: string | null
          room?: string | null
          start_time: string
          student_uuid: string
          subject?: string | null
          teacher?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          days?: number[]
          end_time?: string
          id?: string
          name?: string
          notes?: string | null
          period?: string | null
          room?: string | null
          start_time?: string
          student_uuid?: string
          subject?: string | null
          teacher?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          label: string
          pinned: boolean
          sort_order: number
          student_uuid: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          pinned?: boolean
          sort_order?: number
          student_uuid: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          pinned?: boolean
          sort_order?: number
          student_uuid?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          date: string
          google_event_id: string | null
          id: string
          student_uuid: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          date: string
          google_event_id?: string | null
          id?: string
          student_uuid: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          google_event_id?: string | null
          id?: string
          student_uuid?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schedule_overrides: {
        Row: {
          created_at: string
          date: string
          forced_day: number | null
          id: string
          kind: string
          note: string | null
          student_uuid: string
        }
        Insert: {
          created_at?: string
          date: string
          forced_day?: number | null
          id?: string
          kind?: string
          note?: string | null
          student_uuid: string
        }
        Update: {
          created_at?: string
          date?: string
          forced_day?: number | null
          id?: string
          kind?: string
          note?: string | null
          student_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_overrides_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          student_uuid: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          student_uuid: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          student_uuid?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          accent: string
          clock_24h: boolean
          notifications: boolean
          student_uuid: string
          theme: string
          updated_at: string
        }
        Insert: {
          accent?: string
          clock_24h?: boolean
          notifications?: boolean
          student_uuid: string
          theme?: string
          updated_at?: string
        }
        Update: {
          accent?: string
          clock_24h?: boolean
          notifications?: boolean
          student_uuid?: string
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          id: string
          name: string
          pin_hash: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pin_hash: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pin_hash?: string
          student_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          class_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          google_event_id: string | null
          id: string
          notes: string | null
          priority: string
          student_uuid: string
          synced_at: string | null
          title: string
        }
        Insert: {
          class_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          student_uuid: string
          synced_at?: string | null
          title: string
        }
        Update: {
          class_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          student_uuid?: string
          synced_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_uuid_fkey"
            columns: ["student_uuid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
