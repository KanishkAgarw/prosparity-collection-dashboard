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
      analytics_snapshots: {
        Row: {
          branch_name: string
          created_at: string
          id: string
          others_count: number
          paid_count: number
          paid_pending_approval_count: number
          partially_paid_count: number
          ptp_future: number
          ptp_no_ptp_set: number
          ptp_overdue: number
          ptp_today: number
          ptp_tomorrow: number
          ptp_total: number
          rm_name: string | null
          snapshot_date: string
          total_applications: number
          total_emi_amount: number | null
          total_interest_due: number | null
          total_principle_due: number | null
          unpaid_count: number
          updated_at: string
        }
        Insert: {
          branch_name: string
          created_at?: string
          id?: string
          others_count?: number
          paid_count?: number
          paid_pending_approval_count?: number
          partially_paid_count?: number
          ptp_future?: number
          ptp_no_ptp_set?: number
          ptp_overdue?: number
          ptp_today?: number
          ptp_tomorrow?: number
          ptp_total?: number
          rm_name?: string | null
          snapshot_date: string
          total_applications?: number
          total_emi_amount?: number | null
          total_interest_due?: number | null
          total_principle_due?: number | null
          unpaid_count?: number
          updated_at?: string
        }
        Update: {
          branch_name?: string
          created_at?: string
          id?: string
          others_count?: number
          paid_count?: number
          paid_pending_approval_count?: number
          partially_paid_count?: number
          ptp_future?: number
          ptp_no_ptp_set?: number
          ptp_overdue?: number
          ptp_today?: number
          ptp_tomorrow?: number
          ptp_total?: number
          rm_name?: string | null
          snapshot_date?: string
          total_applications?: number
          total_emi_amount?: number | null
          total_interest_due?: number | null
          total_principle_due?: number | null
          unpaid_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          amount_collected: number | null
          applicant_address: string | null
          applicant_id: string
          applicant_mobile: string | null
          applicant_name: string
          branch_name: string
          co_applicant_address: string | null
          co_applicant_mobile: string | null
          co_applicant_name: string | null
          collection_rm: string | null
          created_at: string | null
          dealer_name: string
          demand_date: string | null
          disbursement_date: string | null
          emi_amount: number
          fi_location: string | null
          guarantor_address: string | null
          guarantor_mobile: string | null
          guarantor_name: string | null
          house_ownership: string | null
          id: string
          interest_due: number | null
          last_month_bounce: number | null
          lender_name: string
          lms_status: string
          loan_amount: number | null
          principle_due: number | null
          reference_address: string | null
          reference_mobile: string | null
          reference_name: string | null
          repayment: string | null
          rm_name: string
          team_lead: string
          updated_at: string | null
          user_id: string
          vehicle_status: string | null
        }
        Insert: {
          amount_collected?: number | null
          applicant_address?: string | null
          applicant_id: string
          applicant_mobile?: string | null
          applicant_name: string
          branch_name: string
          co_applicant_address?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          collection_rm?: string | null
          created_at?: string | null
          dealer_name: string
          demand_date?: string | null
          disbursement_date?: string | null
          emi_amount?: number
          fi_location?: string | null
          guarantor_address?: string | null
          guarantor_mobile?: string | null
          guarantor_name?: string | null
          house_ownership?: string | null
          id?: string
          interest_due?: number | null
          last_month_bounce?: number | null
          lender_name: string
          lms_status?: string
          loan_amount?: number | null
          principle_due?: number | null
          reference_address?: string | null
          reference_mobile?: string | null
          reference_name?: string | null
          repayment?: string | null
          rm_name: string
          team_lead: string
          updated_at?: string | null
          user_id: string
          vehicle_status?: string | null
        }
        Update: {
          amount_collected?: number | null
          applicant_address?: string | null
          applicant_id?: string
          applicant_mobile?: string | null
          applicant_name?: string
          branch_name?: string
          co_applicant_address?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          collection_rm?: string | null
          created_at?: string | null
          dealer_name?: string
          demand_date?: string | null
          disbursement_date?: string | null
          emi_amount?: number
          fi_location?: string | null
          guarantor_address?: string | null
          guarantor_mobile?: string | null
          guarantor_name?: string | null
          house_ownership?: string | null
          id?: string
          interest_due?: number | null
          last_month_bounce?: number | null
          lender_name?: string
          lms_status?: string
          loan_amount?: number | null
          principle_due?: number | null
          reference_address?: string | null
          reference_mobile?: string | null
          reference_name?: string | null
          repayment?: string | null
          rm_name?: string
          team_lead?: string
          updated_at?: string | null
          user_id?: string
          vehicle_status?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          application_id: string
          created_at: string
          demand_date: string | null
          field: string
          id: string
          new_value: string | null
          previous_value: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          demand_date?: string | null
          field: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          demand_date?: string | null
          field?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calling_logs: {
        Row: {
          application_id: string
          contact_type: string
          created_at: string
          demand_date: string | null
          id: string
          new_status: string
          previous_status: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          application_id: string
          contact_type: string
          created_at?: string
          demand_date?: string | null
          id?: string
          new_status: string
          previous_status?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          application_id?: string
          contact_type?: string
          created_at?: string
          demand_date?: string | null
          id?: string
          new_status?: string
          previous_status?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      collection: {
        Row: {
          amount_collected: number | null
          application_id: string
          collection_rm: string | null
          created_at: string | null
          demand_date: string | null
          emi_amount: number | null
          id: string
          last_month_bounce: number | null
          lms_status: string | null
          repayment: string | null
          rm_name: string | null
          team_lead: string | null
          updated_at: string | null
        }
        Insert: {
          amount_collected?: number | null
          application_id: string
          collection_rm?: string | null
          created_at?: string | null
          demand_date?: string | null
          emi_amount?: number | null
          id?: string
          last_month_bounce?: number | null
          lms_status?: string | null
          repayment?: string | null
          rm_name?: string | null
          team_lead?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_collected?: number | null
          application_id?: string
          collection_rm?: string | null
          created_at?: string | null
          demand_date?: string | null
          emi_amount?: number | null
          id?: string
          last_month_bounce?: number | null
          lms_status?: string | null
          repayment?: string | null
          rm_name?: string | null
          team_lead?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["applicant_id"]
          },
        ]
      }
      comments: {
        Row: {
          application_id: string
          content: string
          created_at: string
          demand_date: string | null
          id: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          demand_date?: string | null
          id?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          demand_date?: string | null
          id?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_calling_status: {
        Row: {
          application_id: string
          contact_type: string
          created_at: string | null
          demand_date: string | null
          id: string
          status: string
          updated_at: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          contact_type: string
          created_at?: string | null
          demand_date?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          contact_type?: string
          created_at?: string | null
          demand_date?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      field_status: {
        Row: {
          application_id: string
          calling_status: string | null
          created_at: string
          demand_date: string | null
          id: string
          requested_status: string | null
          status: string
          status_approval_needed: boolean | null
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          calling_status?: string | null
          created_at?: string
          demand_date?: string | null
          id?: string
          requested_status?: string | null
          status?: string
          status_approval_needed?: boolean | null
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          calling_status?: string | null
          created_at?: string
          demand_date?: string | null
          id?: string
          requested_status?: string | null
          status?: string
          status_approval_needed?: boolean | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_dates: {
        Row: {
          application_id: string
          created_at: string
          id: string
          paid_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          paid_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          paid_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ptp_dates: {
        Row: {
          application_id: string
          created_at: string
          demand_date: string | null
          id: string
          ptp_date: string | null
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          demand_date?: string | null
          id?: string
          ptp_date?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          demand_date?: string | null
          id?: string
          ptp_date?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      repayment_history: {
        Row: {
          application_id: string
          created_at: string | null
          delay_in_days: number
          id: string
          repayment_number: number
        }
        Insert: {
          application_id: string
          created_at?: string | null
          delay_in_days: number
          id?: string
          repayment_number: number
        }
        Update: {
          application_id?: string
          created_at?: string | null
          delay_in_days?: number
          id?: string
          repayment_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "repayment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["applicant_id"]
          },
        ]
      }
      status_change_requests: {
        Row: {
          application_id: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string | null
          current_status: string
          demand_date: string
          id: string
          request_timestamp: string
          requested_by_email: string | null
          requested_by_name: string | null
          requested_by_user_id: string
          requested_status: string
          review_comments: string | null
          review_timestamp: string | null
          reviewed_by_email: string | null
          reviewed_by_name: string | null
          reviewed_by_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string | null
          current_status: string
          demand_date: string
          id?: string
          request_timestamp?: string
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_by_user_id: string
          requested_status: string
          review_comments?: string | null
          review_timestamp?: string | null
          reviewed_by_email?: string | null
          reviewed_by_name?: string | null
          reviewed_by_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string | null
          current_status?: string
          demand_date?: string
          id?: string
          request_timestamp?: string
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_by_user_id?: string
          requested_status?: string
          review_comments?: string | null
          review_timestamp?: string | null
          reviewed_by_email?: string | null
          reviewed_by_name?: string | null
          reviewed_by_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      backfill_analytics_snapshots: {
        Args: { start_date: string; end_date?: string }
        Returns: string
      }
      generate_analytics_snapshot: {
        Args: { target_date?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
