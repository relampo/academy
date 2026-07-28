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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          notes: string | null
          points_awarded: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submission_url: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          submission_url?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          submission_url?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "lesson_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_editions: {
        Row: {
          archived_at: string | null
          capacity: number | null
          course_id: string
          created_at: string
          created_by: string | null
          discord_url: string | null
          end_date: string | null
          enrollment_open: boolean
          id: string
          max_points: number | null
          requires_approval: boolean
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          capacity?: number | null
          course_id: string
          created_at?: string
          created_by?: string | null
          discord_url?: string | null
          end_date?: string | null
          enrollment_open?: boolean
          id?: string
          max_points?: number | null
          requires_approval?: boolean
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          capacity?: number | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          discord_url?: string | null
          end_date?: string | null
          enrollment_open?: boolean
          id?: string
          max_points?: number | null
          requires_approval?: boolean
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_editions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_editions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          assigned_by: string | null
          course_id: string
          created_at: string
          instructor_id: string
        }
        Insert: {
          assigned_by?: string | null
          course_id: string
          created_at?: string
          instructor_id: string
        }
        Update: {
          assigned_by?: string | null
          course_id?: string
          created_at?: string
          instructor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          short_description: string | null
          slug: string
          source_course_id: string | null
          status: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          short_description?: string | null
          slug: string
          source_course_id?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          short_description?: string | null
          slug?: string
          source_course_id?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_source_course_id_fkey"
            columns: ["source_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          course_edition_id: string
          id: string
          rejection_reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          course_edition_id: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          course_edition_id?: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_edition_id_fkey"
            columns: ["course_edition_id"]
            isOneToOne: false
            referencedRelation: "course_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attendance_enabled: boolean
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          module_id: string | null
          objectives: string | null
          position: number
          scheduled_at: string | null
          slug: string
          status: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attendance_enabled?: boolean
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          objectives?: string | null
          position: number
          scheduled_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attendance_enabled?: boolean
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          objectives?: string | null
          position?: number
          scheduled_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["lesson_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attendance: {
        Row: {
          attended: boolean
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          lesson_id: string
          stayed_until_end: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          attended?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          stayed_until_end?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          attended?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          stayed_until_end?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attendance_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          points: number
          required: boolean
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          points?: number
          required?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          points?: number
          required?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          student_id: string
          updated_at: string
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          student_id: string
          updated_at?: string
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
          updated_at?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          position: number
          status?: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          discord_username: string | null
          display_name: string | null
          first_name: string
          id: string
          last_name: string
          leaderboard_name: string | null
          leaderboard_visibility: Database["public"]["Enums"]["leaderboard_visibility"]
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          first_name?: string
          id: string
          last_name?: string
          leaderboard_name?: string | null
          leaderboard_visibility?: Database["public"]["Enums"]["leaderboard_visibility"]
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          first_name?: string
          id?: string
          last_name?: string
          leaderboard_name?: string | null
          leaderboard_visibility?: Database["public"]["Enums"]["leaderboard_visibility"]
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          is_downloadable: boolean
          lesson_id: string
          position: number
          requires_enrollment: boolean
          resource_type: string
          title: string
          unlock_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_downloadable?: boolean
          lesson_id: string
          position: number
          requires_enrollment?: boolean
          resource_type: string
          title: string
          unlock_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_downloadable?: boolean
          lesson_id?: string
          position?: number
          requires_enrollment?: boolean
          resource_type?: string
          title?: string
          unlock_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin_by_email: {
        Args: { reason?: string; target_email: string }
        Returns: string
      }
      can_manage_course: {
        Args: { target_course_id: string }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_enrolled_in_course: {
        Args: { target_course_id: string }
        Returns: boolean
      }
      is_instructor_for_course: {
        Args: { target_course_id: string }
        Returns: boolean
      }
      is_instructor_for_edition: {
        Args: { target_edition_id: string }
        Returns: boolean
      }
      write_audit_log: {
        Args: {
          action: string
          after_data?: Json
          before_data?: Json
          entity_id?: string
          entity_type: string
          reason?: string
        }
        Returns: string
      }
    }
    Enums: {
      course_status:
        | "draft"
        | "published"
        | "enrollment_closed"
        | "completed"
        | "archived"
      enrollment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
        | "completed"
      leaderboard_visibility: "full_name" | "first_name" | "alias" | "hidden"
      lesson_status: "draft" | "published" | "hidden" | "archived"
      user_role: "admin" | "instructor" | "student"
      user_status: "active" | "suspended" | "pending"
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
    Enums: {
      course_status: [
        "draft",
        "published",
        "enrollment_closed",
        "completed",
        "archived",
      ],
      enrollment_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
        "completed",
      ],
      leaderboard_visibility: ["full_name", "first_name", "alias", "hidden"],
      lesson_status: ["draft", "published", "hidden", "archived"],
      user_role: ["admin", "instructor", "student"],
      user_status: ["active", "suspended", "pending"],
    },
  },
} as const
