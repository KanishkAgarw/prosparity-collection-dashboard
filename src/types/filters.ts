
export type LastMonthBounceCategory = 'Not paid' | 'Paid on time' | '1-5 days late' | '6-15 days late' | '15+ days late';

export interface FilterState {
  branch: string[];
  teamLead: string[];
  rm: string[];
  dealer: string[];
  lender: string[];
  status: string[];
  emiMonth: string[];
  repayment: string[];
  lastMonthBounce: LastMonthBounceCategory[];
  ptpDate: import('@/utils/ptpDateUtils').PtpDateCategory[];
  collectionRm: string[];
}

export interface AvailableOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: LastMonthBounceCategory[];
  ptpDateOptions: string[];
  collectionRms: string[];
}

// Export alias for compatibility
export type Filters = FilterState;
