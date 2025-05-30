export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_address: string | null
          applicant_id: string
          applicant_mobile: string | null
          applicant_name: string
          branch_name: string
          co_applicant_address: string | null
          co_applicant_mobile: string | null
          co_applicant_name: string | null
          created_at: string | null
          dealer_name: string
          demand_date: string | null
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
          paid_date: string | null
          principle_due: number | null
          ptp_date: string | null
          reference_address: string | null
          reference_mobile: string | null
          reference_name: string | null
          repayment: string | null
          rm_comments: string | null
          rm_name: string
          status: string
          team_lead: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applicant_address?: string | null
          applicant_id: string
          applicant_mobile?: string | null
          applicant_name: string
          branch_name: string
          co_applicant_address?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          created_at?: string | null
          dealer_name: string
          demand_date?: string | null
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
          paid_date?: string | null
          principle_due?: number | null
          ptp_date?: string | null
          reference_address?: string | null
          reference_mobile?: string | null
          reference_name?: string | null
          repayment?: string | null
          rm_comments?: string | null
          rm_name: string
          status?: string
          team_lead: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applicant_address?: string | null
          applicant_id?: string
          applicant_mobile?: string | null
          applicant_name?: string
          branch_name?: string
          co_applicant_address?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          created_at?: string | null
          dealer_name?: string
          demand_date?: string | null
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
          paid_date?: string | null
          principle_due?: number | null
          ptp_date?: string | null
          reference_address?: string | null
          reference_mobile?: string | null
          reference_name?: string | null
          repayment?: string | null
          rm_comments?: string | null
          rm_name?: string
          status?: string
          team_lead?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          application_id: string
          created_at: string
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
          field?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          application_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_email?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
