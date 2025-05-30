
export interface Application {
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
  principle_due?: number;
  interest_due?: number;
  ptp_date?: string;
  paid_date?: string;
  demand_date?: string;
  rm_comments?: string;
  auditLogs?: AuditLog[];
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
  latest_calling_status?: string;
  applicant_calling_status?: string;
  co_applicant_calling_status?: string;
  guarantor_calling_status?: string;
  reference_calling_status?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  field: string;
  previousValue: string;
  newValue: string;
}

export interface FilterOptions {
  branches: string[];
  teamLeads: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
}
