
// Database application type without recent_comments
export interface DatabaseApplication {
  id: string;
  applicant_id: string;
  applicant_name: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  status: string;
  emi_amount: number;
  principle_due: number;
  interest_due: number;
  ptp_date?: string;
  paid_date?: string;
  demand_date?: string;
  rm_comments?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  applicant_mobile?: string;
  applicant_address?: string;
  house_ownership?: string;
  co_applicant_name?: string;
  co_applicant_mobile?: string;
  co_applicant_address?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  reference_name?: string;
  reference_mobile?: string;
  reference_address?: string;
  fi_location?: string;
  repayment?: string;
  last_month_bounce?: number;
  applicant_calling_status?: string;
  co_applicant_calling_status?: string;
  guarantor_calling_status?: string;
  reference_calling_status?: string;
  latest_calling_status?: string;
}

export interface UserProfile {
  full_name?: string;
  email?: string;
}

export interface CommentData {
  application_id: string;
  content: string;
  created_at: string;
  user_id: string;
}
